import ExtractPdfContent from '../utils/ExtractPdfContent';
import * as fs from 'fs';

class DocumentContentExtractor {
   async extractContent(filePath: string, fileExtension: string): Promise<string> {
      if (fileExtension === 'pdf') {
         const pdf = new ExtractPdfContent();
         return pdf.extract(filePath);
      } else if (fileExtension === 'xml') {
         return fs.readFileSync(filePath, 'utf-8');
      }
      throw new Error('Unsupported file extension: ' + fileExtension);
   }
}

export default DocumentContentExtractor;
