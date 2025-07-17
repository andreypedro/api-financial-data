import { Telegram } from '../utils/Telegram';

export default class MessageProcessorService {
   async getAllChatId() {
      const telegram = new Telegram();
      telegram.logChatIdsFromUpdates();
   }

   async sendMessage(chatId: string, text: string) {
      if (!chatId) {
         throw new Error('ChatID was not sent to the sendMessage method.');
      }

      if (!text) {
         throw new Error('Text message was not sent to the sendMessage method.');
      }

      const telegram = new Telegram();
      telegram.sendMessage(chatId, text);
   }
}
