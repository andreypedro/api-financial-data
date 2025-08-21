import MessageProcessorService from './MessageProcessorService';
import { IMarketDocument } from '../entities/MarketDocument';
import { myFiis } from '../data/myFiis';

class MessageSenderService {
   async send(documents: IMarketDocument[], downloadUrl: string): Promise<void> {
      for (const document of documents) {
         if (myFiis.some((item) => item.startsWith(document.ticker))) {
            let message = `(${document.ticker}) ${document.fundDescription}\n\n`;
            message += document.content;
            const messageProcessor = new MessageProcessorService();
            if (document.fileExtension === 'pdf') {
               const url = `${downloadUrl}?id=${document.externalId}`;
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

export default MessageSenderService;
