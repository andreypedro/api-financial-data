import axios from 'axios';
import { IMarketDocument } from '../entities/MarketDocument';
import { IMarketDcumentFromBMF_PTBR } from '../interfaces/IMarketDocumentFromBMF_PTBR';
import { fiis } from '../data/fii';
import { v4 as uuidv4 } from 'uuid';
import MarketDocumentRepository from '../repositories/MarketDocumentRepository';
import * as fs from 'fs';
import * as path from 'path';
import { Downloader } from '../utils/Downloader';
import ExtractPdfContent from '../utils/ExtractPdfContent';
import { OllamaSummarizer } from '../utils/OllamaSummarizer';
import MessageProcessorService from './MessageProcessorService';
import { myFiis } from '../data/myFiis';

type IMarketDocumentUsable = Pick<
   IMarketDocument,
   'externalId' | 'status' | 'ticker' | 'fundDescription' | 'tradingName'
>;

class FinancialDocumentService {
   private readonly METADATA_URL =
      'https://fnet.bmfbovespa.com.br/fnet/publico/pesquisarGerenciadorDocumentosDados';
   private readonly DOWNLOAD_URL = 'https://fnet.bmfbovespa.com.br/fnet/publico/downloadDocumento';
   private readonly FILES_PATH = path.resolve(__dirname, '../../temp');

   constructor() {}

   async import() {
      const marketDocumentData = await this.importDataFromBMFBovespa();

      if (!marketDocumentData) {
         throw new Error('Error while import data from BMF');
      }

      await this.saveMarketData(marketDocumentData);

      await this.importFiles();

      await this.summarizeDocuments();

      await this.publishMessages();
   }

   async importDataFromBMFBovespa(): Promise<IMarketDocumentUsable[]> {
      // type-guard.
      function isValidResponse(
         resp: unknown
      ): resp is { data: { data: IMarketDcumentFromBMF_PTBR[] } } {
         return (
            typeof resp === 'object' &&
            resp !== null &&
            'data' in resp &&
            typeof (resp as any).data === 'object' &&
            (resp as any).data !== null &&
            'data' in (resp as any).data &&
            Array.isArray((resp as any).data.data)
         );
      }

      try {
         const foundType = 1;
         const referenceDate = '23/07/2025';
         const status = 'A';
         const quantity = 100;
         const page = 1;
         const startFrom = quantity * (page - 1);

         const url = `${this.METADATA_URL}?d=1&s=${startFrom}&l=${quantity}&o%5B0%5D%5BdataEntrega%5D=desc&tipoFundo=${foundType}&idCategoriaDocumento=0&idTipoDocumento=0&idEspecieDocumento=0&situacao=${status}&dataReferencia=${referenceDate}&isSession=false&_=1752685996734`;

         const response: unknown = await axios.get(url);

         if (!isValidResponse(response)) {
            throw new Error('Returned type from bmf is not valid');
         }

         const marketDocumentDataFromBMFBovespa: IMarketDcumentFromBMF_PTBR[] = response.data.data;

         const marketDocumentData: IMarketDocumentUsable[] = marketDocumentDataFromBMFBovespa
            .filter((document) => document.nomePregao != '')
            .map((document) => {
               const matchedFii = fiis.find((fii) => fii.tradingName === document.nomePregao);
               const ticker = matchedFii?.ticker || null;

               console.log('document.id', document.id);

               return {
                  externalId: document.id,
                  status: ticker ? 'PRE_SAVED' : 'TICKER_NOT_FOUND',
                  ticker: ticker as string,
                  fundDescription: document.descricaoFundo,
                  tradingName: document.nomePregao,
               };
            });

         return marketDocumentData;
      } catch (err) {
         throw new Error('It was not possible to get market documents from BMF.');
      }
   }

   async saveMarketData(marketDocumentData: IMarketDocumentUsable[]) {
      for (const document of marketDocumentData) {
         const externalId = document.externalId;

         const exists = await MarketDocumentRepository.findByExternalId(externalId);

         if (exists) {
            console.log(`Skipping already existing externalId ${externalId}`);
            continue;
         }

         const docToSave = {
            id: uuidv4(),
            externalId,
            status: document.status,
            ticker: document.ticker,
            fundDescription: document.fundDescription,
            tradingName: document.tradingName,
         };
         try {
            await MarketDocumentRepository.create(docToSave);
            console.log('Saved to Mongo:', docToSave);
         } catch (err) {
            console.error('Error saving document:', docToSave, err);
         }
      }

      return true;
   }

   async importFiles(status: IMarketDocument['status'] = 'PRE_SAVED') {
      const documents = await MarketDocumentRepository.findByStatus(status);

      if (documents.length === 0) {
         console.log('No documents found with status:', status);
         return;
      }

      console.log(`Found ${documents.length} documents to process.`);

      for (const document of documents) {
         try {
            console.log(`Attempting to download file for externalId: ${document.externalId}`);

            const fileResult = await this.getFileFromBMF(document.externalId, document.id);
            if (fileResult.success) {
               console.log(`Successfully downloaded file for externalId: ${document.externalId}`);
               await MarketDocumentRepository.update(document.id, {
                  status: 'FILE_DOWNLOADED',
                  fileExtension: fileResult.extension,
               });
            } else {
               console.error(`Failed to download file for externalId: ${document.externalId}`);
            }
         } catch (error) {
            console.error(`Error downloading file for externalId ${document.externalId}:`, error);
         }

         // break;
      }
      console.log('All document downloads attempted.');
   }

   async getFileFromBMF(
      externalId: IMarketDocument['externalId'],
      id: IMarketDocument['id']
   ): Promise<{ success: boolean; extension?: string }> {
      const url = `${this.DOWNLOAD_URL}?id=${externalId}`;
      const folder = this.FILES_PATH;

      try {
         const header: Record<string, string> = {
            'User-Agent':
               'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            Accept: 'application/pdf',
            Referer: 'https://fnet.bmfbovespa.com.br/',
         };

         const downloader = new Downloader();
         const result = await downloader.downloadFile(url, folder, id, header, 1000);
         if (result.success) {
            return { success: true, extension: result.extension };
         } else {
            return { success: false };
         }
      } catch (error) {
         console.error(`Failed to download file from ${url}:`, error);
         return { success: false };
      }
   }

   async extractPdfContent(path: string): Promise<string> {
      const pdf = new ExtractPdfContent();
      const content = pdf.extract(path);
      return content;
   }

   async summarizeDocuments(status: IMarketDocument['status'] = 'FILE_DOWNLOADED'): Promise<void> {
      if (!status) {
         throw new Error('Status was not sent.');
      }

      const documents = await MarketDocumentRepository.findByStatus(status);

      for (const document of documents) {
         const filePath = this.FILES_PATH + '/' + document.id + '.' + document.fileExtension;
         let fileContent;

         if (document.fileExtension === 'pdf') {
            fileContent = await this.extractPdfContent(filePath);
         } else if (document.fileExtension === 'xml') {
            fileContent = fs.readFileSync(filePath, 'utf-8');
         }

         if (!fileContent) {
            throw new Error('Error during getting content from file: ' + filePath);
         }

         console.log(
            `Starting summarization from document (${document.id}.${document.fileExtension}) - ${document.ticker}.`
         );

         // console.log('File Content =>', fileContent);

         const summarizedResponse: string = await this.summarize(fileContent);

         console.log(
            `Document (${document.id}.${document.fileExtension}) - ${document.ticker} was summarized.`
         );

         const documentContent: Pick<IMarketDocument, 'content' | 'status'> = {
            // tldr: summarizedResponseJson.tldr,
            // summary: summarizedResponseJson.summary,
            content: summarizedResponse,
            status: 'SUMMARIZED',
         };

         const response = await MarketDocumentRepository.update(document.id, documentContent);
      }
   }

   async summarize(text: string) {
      const persona = 'Você é um assistente de API que **SÓ responde com Markdown válido**.\n\n';

      const context =
         'Você acabou de receber um relatório da administradora do fundo com informações aos acionistas.\n\n';

      const task =
         'Formate a resposta exclusivamente em Markdown com os seguintes elementos:\n' +
         '- Uma seção "**TL;DR**" (too long; didn’t read) com os principais destaques em negrito;\n' +
         '- Um resumo com no máximo 5.000 caracteres abaixo do TL;DR;\n' +
         '- Separe cada item do resumo com **duas quebras de linha**;\n';

      const exemplar =
         'A mensagem deve destacar os principais pontos do relatório, se disponíveis, como por exemplo:\n' +
         '- Rendimento por cota e dividend yield;\n' +
         '- Vacância dos imóveis ou inadimplência de recebíveis;\n' +
         '- Aquisições, vendas ou movimentações relevantes na carteira;\n' +
         '- Revisões ou renegociações contratuais com inquilinos;\n' +
         '- Mudanças na estratégia do fundo ou comentários da gestão sobre o cenário atual;\n' +
         '- Indicadores como P/VP, valor patrimonial por cota, evolução de receitas e despesas;\n' +
         '- Eventos extraordinários como emissões de cotas ou impactos regulatórios;\n\n' +
         '**Importante:**\n' +
         '- Não explique o que está fazendo;\n' +
         '- Não adicione blocos de código nem links para o relatório;\n' +
         '- Não responda pedindo esclarecimentos, apenas entregue a melhor resposta possível com base nas instruções;\n' +
         '- Responda sempre em idioma pt_BR;\n' +
         '- Sempre inclua a seção TL;DR seguida do conteúdo;\n' +
         '- Ao mencionar novas locações ou encerramentos de contrato, não declare o impacto exato na distribuição mensal.\n';

      const tone =
         'Use uma linguagem clara, acessível e direta, focando em ajudar o investidor a entender a situação do fundo sem precisar ler o relatório completo. Evite jargões técnicos e priorize explicações objetivas, destacando o que muda ou reforça a tese do fundo.';

      const example_output = `EXEMPLO DE SAÍDA:
**O fundo XPTO11 manteve seus rendimentos estáveis em R$0,95/cota e anunciou a aquisição de um novo galpão em São Paulo.**

- **Rendimento**: Distribuído R$0,95 por cota, com um Dividend Yield de 1,1% no mês.  

- **Vacância**: A vacância física se manteve controlada em 2,5%.  

- **Movimentações**: Anunciada a compra do galpão logístico "Logis SP" por R$ 50 milhões.  

- **Indicadores**: O valor patrimonial da cota está em R$98,00, com o P/VP atual em 0,97.
`;

      const prompt = persona + context + task + exemplar + tone + example_output;

      const ollamaSummarizer = new OllamaSummarizer();
      const summarizedContent = await ollamaSummarizer.summarize(text, prompt);

      return summarizedContent;
   }

   async publishMessages(status: IMarketDocument['status'] = 'SUMMARIZED') {
      const documents = await MarketDocumentRepository.findByStatus(status);

      for (const document of documents) {
         if (myFiis.some((item) => item.startsWith(document.ticker))) {
            console.log('Enviará mensagem para: ', document.ticker);

            let message = `(${document.ticker}) ${document.fundDescription}\n\n`;
            message += document.content;
            const messageProcessor = new MessageProcessorService();

            if (document.fileExtension === 'pdf') {
               const url = `${this.DOWNLOAD_URL}?id=${document.externalId}`;
               const link = `Acesse o relatório: ${url}`;
               message += '\n\n' + link;
            }

            message +=
               '\n\n---\n\n_ℹ️ Resumo gerado com IA e pode conter erros. Leia sempre o documento emitido pelo fundo. Esta não é uma recomendação de investimento._';

            await messageProcessor.sendMessage('6681738390', message);
         }
      }
   }
}

export default FinancialDocumentService;
