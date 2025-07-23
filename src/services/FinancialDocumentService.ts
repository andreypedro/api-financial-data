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
      // const marketDocumentData = await this.importDataFromBMFBovespa();

      // if (!marketDocumentData) {
      //    throw new Error('Error while import data from BMF');
      // }

      // await this.saveMarketData(marketDocumentData);

      //await this.importFiles();

      // await this.summarizeDocuments();

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
         const referenceDate = '17/07/2025';
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

         break;
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

   async summarizeDocuments(status: IMarketDocument['status'] = 'FILE_DOWNLOADED') {
      function isValidResponse(
         obj: any
      ): obj is { tldr: string; summary: string; content: string } {
         return (
            typeof obj === 'object' &&
            obj !== null &&
            typeof obj.tldr === 'string' &&
            typeof obj.summary === 'string' &&
            typeof obj.content === 'string'
         );
      }

      if (!status) {
         throw new Error('Status was not sent.');
      }

      const documents = await MarketDocumentRepository.findByStatus(status);

      documents.forEach(async (document) => {
         const filePath = this.FILES_PATH + '/' + document.id + '.' + document.fileExtension;
         const fileContent = await this.extractPdfContent(filePath);

         const summarizedResponse: string = await this.summarize(fileContent);

         // Remove blocos de markdown caso existam
         let cleanResponse = summarizedResponse.trim();
         if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse
               .replace(/^```json/, '')
               .replace(/```$/, '')
               .trim();
         } else if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/^```/, '').replace(/```$/, '').trim();
         }

         console.log('=====>', cleanResponse);

         const summarizedResponseJson = JSON.parse(cleanResponse);

         if (!isValidResponse(summarizedResponseJson)) {
            throw new Error('AI response was not in the right format.');
         }

         const documentContent: Pick<IMarketDocument, 'tldr' | 'summary' | 'content' | 'status'> = {
            tldr: summarizedResponseJson.tldr,
            summary: summarizedResponseJson.summary,
            content: summarizedResponseJson.content,
            status: 'SUMMARIZED',
         };

         const response = await MarketDocumentRepository.update(document.id, documentContent);
      });
   }

   async summarize(text: string) {
      const persona = 'Você é um especialista em fundos imobiliários.\n\n';
      const context =
         'Você acabou de receber um relatório da administradora do fundo com informações aos acionistas.\n\n';
      const task =
         'Escreva uma mensagem que será enviada aos investidores compartilhando os principais pontos do relatório.\n' +
         'A mensagem deve ser retornada em JSON no seguinte padrão: { tldr: string, summary: string, content: string }\n' +
         'Retorne apenas o JSON puro, sem blocos de código, sem aspas extras.\n' +
         'O summary deve conter no máximo 500 caracteres.\n' +
         'O tldr, summary e content devem estar no formato markdown aceito pelo telegram.';

      const exemplar =
         "Esta mensagem deve conter uma seção tl;dr (too long, didn't read) em negrito, background do relatório (porque este relatório foi enviado), quais os principais pontos informados no relatório (caso haja) como por exemplo:\n" +
         '- Rendimento distribuído por cota no mês e dividend yield;\n' +
         '- Situação de vacância dos imóveis ou inadimplência de recebíveis;\n' +
         '- Novas aquisições, vendas ou movimentações relevantes na carteira;\n' +
         '- Revisão de contratos ou renegociações com inquilinos;\n' +
         '- Mudanças na estratégia do fundo ou comentários da gestão sobre o cenário atual;\n' +
         '- Indicadores como P/VP, valor patrimonial por cota, evolução da receita e despesas;\n' +
         '- Eventos extraordinários, como emissões de cotas ou impactos regulatórios;\n\n';

      const tone =
         'Use uma linguagem acessível, clara e que ajude o investidor a entender o momento do fundo sem precisar ler o relatório completo. Evite jargões técnicos e prefira explicações resumidas, com foco no que muda ou reforça a tese de investimento do fundo.';

      const prompt = persona + context + task + exemplar + tone;

      const ollamaSummarizer = new OllamaSummarizer();
      const summarizedContent = await ollamaSummarizer.summarize(text, prompt);

      return summarizedContent;
   }

   async publishMessages(status: IMarketDocument['status'] = 'SUMMARIZED') {
      const documents = await MarketDocumentRepository.findByStatus(status);

      documents.forEach(async (document) => {
         const message = document.tldr + '\n\n' + document.content;
         const messageProcessor = new MessageProcessorService();

         console.log('--->', message);

         await messageProcessor.sendMessage('6681738390', message);
      });
   }
}

export default FinancialDocumentService;
