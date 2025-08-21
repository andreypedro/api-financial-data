import PostRepository from '../repositories/PostRepository';
import MarketDocumentRepository from '../repositories/MarketDocumentRepository';
import { v4 as uuidv4 } from 'uuid';
import { IMarketDocument } from '../entities/MarketDocument';

class PostPublisherService {
   async publish(documents: IMarketDocument[]): Promise<void> {
      for (const document of documents) {
         await PostRepository.create({
            id: uuidv4(),
            documentId: document.id,
            documentExternalId: document.externalId,
            fileExtension: document.fileExtension,
            ticker: document.ticker + '11',
            content: document.content ? document.content : 'NULOOO',
            publishedAt: document.createdAt,
            type: 'report',
         });
         await MarketDocumentRepository.update(document.id, { status: 'PUBLISHED' });
      }
   }
}

export default PostPublisherService;
