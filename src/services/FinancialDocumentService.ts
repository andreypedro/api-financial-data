import axios from 'axios';
import { IMarketDocument } from '../entities/MarketDocument';
import { IMarketDcumentFromBMF_PTBR } from '../interfaces/IMarketDocumentFromBMF_PTBR';
import { fiis } from '../data/fii';
import { v4 as uuidv4 } from 'uuid';
import MarketDocumentRepository from '../repositories/MarketDocumentRepository';
import * as path from 'path';
import FileDownloaderService from './FileDownloaderService';
import { parseBmfDate } from '../utils/parseBmfDate';
import DocumentContentExtractor from './DocumentContentExtractor';
import DocumentSummarizerService from './DocumentSummarizerService';

// Tipagem para uso interno
export type IMarketDocumentUsable = Pick<
   IMarketDocument,
   'externalId' | 'status' | 'ticker' | 'fundDescription' | 'tradingName' | 'createdAt' | 'category'
>;

class FinancialDocumentService {
   private fileDownloaderService: FileDownloaderService;
   private documentContentExtractor: DocumentContentExtractor;
   private documentSummarizerService: DocumentSummarizerService;
   private readonly METADATA_URL =
      'https://fnet.bmfbovespa.com.br/fnet/publico/pesquisarGerenciadorDocumentosDados';
   private readonly DOWNLOAD_URL = 'https://fnet.bmfbovespa.com.br/fnet/publico/downloadDocumento';
   private readonly FILES_PATH = path.resolve(__dirname, '../../temp');

   constructor(
      fileDownloaderService?: FileDownloaderService,
      documentContentExtractor?: DocumentContentExtractor,
      documentSummarizerService?: DocumentSummarizerService
   ) {
      this.fileDownloaderService = fileDownloaderService || new FileDownloaderService();
      this.documentContentExtractor = documentContentExtractor || new DocumentContentExtractor();
      this.documentSummarizerService = documentSummarizerService || new DocumentSummarizerService();
   }

   // Fluxo principal
   async import() {
      const marketDocumentData = await this.importDataFromBMFBovespa();
      if (!marketDocumentData) {
         throw new Error('Error while import data from BMF');
      }
      await this.saveMarketData(marketDocumentData);
      await this.importFiles();
      await this.summarizeDocuments();
      await this.publishPost();
      // await this.sendMessage();
   }

   // Importa dados da BMF Bovespa
   async importDataFromBMFBovespa(): Promise<IMarketDocumentUsable[]> {
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
         const referenceDate = '21/08/2025';
         const status = 'A';
         const quantity = 100;
         const page = 1;
         const startFrom = quantity * (page - 1);
         const excludedCategory = ['Regulamento'];
         const url = `${this.METADATA_URL}?d=1&s=${startFrom}&l=${quantity}&o%5B0%5D%5BdataEntrega%5D=desc&tipoFundo=${foundType}&idCategoriaDocumento=0&idTipoDocumento=0&idEspecieDocumento=0&situacao=${status}&dataReferencia=${referenceDate}&isSession=false&_=1752685996734`;
         const response: unknown = await axios.get(url);
         if (!isValidResponse(response)) {
            throw new Error('Returned type from bmf is not valid');
         }
         const marketDocumentDataFromBMFBovespa: IMarketDcumentFromBMF_PTBR[] = response.data.data;
         const marketDocumentData: IMarketDocumentUsable[] = marketDocumentDataFromBMFBovespa
            .filter((document) => document.nomePregao)
            .filter(
               (document) =>
                  document.categoriaDocumento &&
                  !excludedCategory.some((category) =>
                     document.categoriaDocumento.toLowerCase().includes(category.toLowerCase())
                  )
            )
            .map((document) => {
               const matchedFii = fiis.find((fii) => fii.tradingName === document.nomePregao);
               const createdAt = parseBmfDate(document.dataEntrega) || new Date();
               return {
                  externalId: document.id,
                  status: matchedFii ? 'PRE_SAVED' : 'TICKER_NOT_FOUND',
                  ticker: matchedFii?.ticker ?? '',
                  category:
                     document.tipoDocumento === 'Rendimentos e Amortizações'
                        ? 'DIVIDENDS'
                        : 'REPORT',
                  fundDescription: document.descricaoFundo,
                  tradingName: document.nomePregao,
                  createdAt,
               };
            });
         return marketDocumentData;
      } catch (err) {
         throw new Error('It was not possible to get market documents from BMF.');
      }
   }

   // Salva os dados importados no repositório
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
            createdAt: document.createdAt,
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

   // Importa os arquivos dos documentos financeiros
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
                  status: 'FILE_DOWNLOADED' as IMarketDocument['status'],
                  fileExtension: fileResult.extension as IMarketDocument['fileExtension'],
               });
            } else {
               console.error(`Failed to download file for externalId: ${document.externalId}`);
            }
         } catch (error) {
            console.error(`Error downloading file for externalId ${document.externalId}:`, error);
         }
      }
      console.log('All document downloads attempted.');
   }

   // Baixa o arquivo do documento financeiro
   private async getFileFromBMF(
      externalId: IMarketDocument['externalId'],
      id: IMarketDocument['id']
   ): Promise<{ success: boolean; extension?: string }> {
      return this.fileDownloaderService.downloadFileFromBMF(externalId, id);
   }

   // Resume o conteúdo dos documentos financeiros
   async summarizeDocuments(status: IMarketDocument['status'] = 'FILE_DOWNLOADED'): Promise<void> {
      if (!status) {
         throw new Error('Status was not sent.');
      }
      const documents = await MarketDocumentRepository.findByStatus(status);
      for (const document of documents) {
         const fileExtension = document.fileExtension;
         if (!fileExtension) {
            throw new Error(`Document ${document.id} is missing fileExtension.`);
         }
         const filePath = this.FILES_PATH + '/' + document.id + '.' + fileExtension;
         let fileContent;
         fileContent = await this.documentContentExtractor.extractContent(filePath, fileExtension);
         if (!fileContent) {
            throw new Error('Error during getting content from file: ' + filePath);
         }
         console.log(
            `Starting summarization from document (${document.id}.${fileExtension}) - ${document.ticker}.`
         );
         if (fileContent.length > 16000) {
            console.log(
               `Cutting document ${document.id}.${fileExtension} with just 16.000 characters.`
            );
         }
         const summarizedResponse: string = await this.documentSummarizerService.summarize(
            fileContent.substring(0, 16000)
         );
         console.log(
            `Document (${document.id}.${fileExtension}) - ${document.ticker} was summarized.`
         );
         const documentContent: Pick<IMarketDocument, 'content' | 'status'> = {
            content: summarizedResponse,
            status: 'SUMMARIZED',
         };
         await MarketDocumentRepository.update(document.id, documentContent);
      }
   }

   // Publica os documentos resumidos como posts
   async publishPost(status: IMarketDocument['status'] = 'SUMMARIZED') {
      const documents = await MarketDocumentRepository.findByStatus(status);
      const PostPublisherService = (await import('./PostPublisherService')).default;
      const postPublisherService = new PostPublisherService();
      await postPublisherService.publish(documents);
   }
}

export default FinancialDocumentService;
