import { Downloader } from '../utils/Downloader';
import { IMarketDocument } from '../entities/MarketDocument';
import * as path from 'path';

class FileDownloaderService {
   private readonly FILES_PATH = path.resolve(__dirname, '../../temp');
   private readonly DOWNLOAD_URL = 'https://fnet.bmfbovespa.com.br/fnet/publico/downloadDocumento';

   async downloadFileFromBMF(
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
}

export default FileDownloaderService;
