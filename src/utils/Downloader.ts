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
   ): Promise<{
      success: boolean;
      name?: string;
      extension?: string;
      size?: number;
      filePath?: string;
      error?: string;
   }> {
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
            return { success: false, error: 'Content-Type was not identified.' };
         }

         if (contentType.includes('application/pdf')) {
            fileExtension = 'pdf';
         } else if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
            fileExtension = 'xml';
         } else {
            fileExtension = 'bin';
         }

         const fileNameToSave = `${fileName}.${fileExtension}`;
         const filePath = path.join(localFolder, fileNameToSave);
         const writer = fs.createWriteStream(filePath);

         response.data.pipe(writer);

         return new Promise((resolve, reject) => {
            writer.on('finish', () => {
               console.log(`Download concluído! Arquivo salvo como: ${filePath}`);
               try {
                  const stats = fs.statSync(filePath);
                  resolve({
                     success: true,
                     name: fileNameToSave,
                     extension: fileExtension,
                     size: stats.size,
                     filePath,
                  });
               } catch (err) {
                  resolve({ success: false, error: 'Erro ao obter informações do arquivo.' });
               }
            });
            writer.on('error', (err) => {
               console.error(`Erro ao salvar o arquivo ${filePath}:`, err);
               resolve({ success: false, error: err.message });
            });
         });
      } catch (error) {
         if (axios.isAxiosError(error)) {
            console.error(`Erro na requisição para ${url}: ${error.message}`);
            if (error.response) {
               console.error(`Status: ${error.response.status}`);
            }
            return { success: false, error: error.message };
         } else {
            console.error(`Ocorreu um erro inesperado ao baixar ${url}:`, error);
            return { success: false, error: String(error) };
         }
      }
   }
}
