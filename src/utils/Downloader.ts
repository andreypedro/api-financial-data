import axios, { AxiosRequestConfig } from 'axios';
import * as fs from 'fs';
import * as path from 'path';

function delay(ms: number): Promise<void> {
   return new Promise((resolve) => setTimeout(resolve, ms));
}

export class Downloader {
   public async downloadFile(
      url: string,
      localFolder: string,
      fileName: string,
      headers: Record<string, string>,
      delayMs: number = 0
   ): Promise<void> {
      if (delayMs > 0) {
         console.log(`Waiting ${delayMs / 1000} before starts download...`);
         await delay(delayMs);
      }

      console.log(`Iniciando download de: ${url}`);

      try {
         if (!fs.existsSync(localFolder)) {
            fs.mkdirSync(localFolder, { recursive: true });
         }

         const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            headers,
         });

         const contentType = response.headers['content-type'];

         let fileExtension: string = '';
         if (!contentType) {
            throw new Error('Content-Type was not identified.');
         }

         if (contentType.includes('application/pdf')) {
            fileExtension = 'pdf';
         } else if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
            fileExtension = 'xml';
         }

         const fileNameToSave = `${fileName}.${fileExtension}`;

         const filePath = path.join(localFolder, fileNameToSave);
         const writer = fs.createWriteStream(filePath);

         response.data.pipe(writer);

         return new Promise((resolve, reject) => {
            writer.on('finish', () => {
               console.log(`Download concluído! Arquivo salvo como: ${filePath}`);
            });
            writer.on('error', (err) => {
               console.error(`Erro ao salvar o arquivo ${filePath}:`, err);
               reject(err);
            });
         });
      } catch (error) {
         if (axios.isAxiosError(error)) {
            console.error(`Erro na requisição para ${url}: ${error.message}`);
            if (error.response) {
               console.error(`Status: ${error.response.status}`);
            }
         } else {
            console.error(`Ocorreu um erro inesperado ao baixar ${url}:`, error);
         }
         throw error;
      }
   }
}
