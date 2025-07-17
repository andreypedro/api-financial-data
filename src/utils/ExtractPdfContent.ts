import * as fs from 'fs';
import pdf from 'pdf-parse';

export default class ExtractPdfContent {
   async extract(path: string): Promise<string> {
      try {
         const dataBuffer = fs.readFileSync(path);
         const data = await pdf(dataBuffer);

         return data.text;
      } catch (err) {
         throw new Error(
            'Error during extract pdf content' + (err instanceof Error ? `: ${err.message}` : '')
         );
      }
   }
}
