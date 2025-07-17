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
import { OllamaSummarizer } from 'utils/OllamaSummarizer';

type IMarketDocumentUsable = Pick<
   IMarketDocument,
   'externalId' | 'status' | 'ticker' | 'fundDescription' | 'tradingName'
>;

class FinancialDocumentService {
   private readonly METADATA_URL =
      'https://fnet.bmfbovespa.com.br/fnet/publico/pesquisarGerenciadorDocumentosDados';
   private readonly DOWNLOAD_URL = 'https://fnet.bmfbovespa.com.br/fnet/publico/downloadDocumento';

   constructor() {}

   async import() {
      const marketDocumentData = await this.importDataFromBMFBovespa();

      if (!marketDocumentData) {
         throw new Error('Error while import data from BMF');
      }

      await this.saveMarketData(marketDocumentData);
      await this.importFiles();
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
         const referenceDate = '15/07/2025';
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
            await this.getFileFromBMF(document.externalId, document.id);
            console.log(`Successfully downloaded file for externalId: ${document.externalId}`);

            const folder = path.resolve(__dirname, '../../temp');
            const filePath = `${folder}/${document.id}.pdf`;
            const pdfContent = await this.extractPdfContent(filePath);

            console.log('pdfContent ==>', pdfContent);
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
   ): Promise<void> {
      const url = `${this.DOWNLOAD_URL}?id=${externalId}`;
      const folder = path.resolve(__dirname, '../../temp');

      try {
         const header: Record<string, string> = {
            'User-Agent':
               'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            Accept: 'application/pdf',
            Referer: 'https://fnet.bmfbovespa.com.br/',
         };

         const downloader = new Downloader();
         downloader.downloadFile(url, folder, id, header, 1000);
      } catch (error) {
         console.error(`Failed to download file from ${url}:`, error);
         throw new Error(`Failed to download file: ${error}`);
      }
   }

   async extractPdfContent(path: string): Promise<string> {
      const pdf = new ExtractPdfContent();
      const content = pdf.extract(path);
      return content;
   }

   async summarize(text: string) {
      const model = 'phi4-mini';
      const prompt = '';

      const ollamaSummarizer = new OllamaSummarizer();
      ollamaSummarizer.summarize(text, model, prompt);
   }
}

export default FinancialDocumentService;
