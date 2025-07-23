import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export class Telegram {
   private readonly token: string;
   private readonly apiUrl: string;

   constructor() {
      if (!process.env.TELEGRAM_BOT_TOKEN) {
         throw new Error('TELEGRAM_BOT_TOKEN is not defined in .env');
      }

      this.token = process.env.TELEGRAM_BOT_TOKEN;
      this.apiUrl = `https://api.telegram.org/bot${this.token}`;
   }

   async sendMessage(chatId: string, text: string): Promise<void> {
      try {
         const url = `${this.apiUrl}/sendMessage`;

         console.log('TELEGRAM URL ######################### ', url);

         const payload = {
            chat_id: chatId,
            text: this.formatMessageForTelegramMarkdownV2(text),
            parse_mode: 'MarkdownV2',
         };

         const response = await axios.post(url, payload);
         if (!response.data.ok) {
            console.error('Telegram API returned error:', response.data);
            throw new Error('Failed to send message');
         }

         console.log('✅ Message sent to chat ID:', chatId);
      } catch (error) {
         console.error('❌ Error sending Telegram message:', error);
         throw error;
      }
   }

   async logChatIdsFromUpdates(): Promise<unknown> {
      try {
         const url = `${this.apiUrl}/getUpdates`;
         const response = await axios.get(url);

         if (!response.data.ok) {
            console.error('Failed to get updates:', response.data);
            return;
         }

         const updates = response.data.result;

         if (updates.length === 0) {
            console.log('No messages found. Ask the user to send /start to your bot.');
            return;
         }

         console.log('📥 Incoming updates:');
         for (const update of updates) {
            const chatId = update.message?.chat?.id;
            const userName = update.message?.from?.first_name || 'Unknown';
            const text = update.message?.text || '';
            if (chatId) {
               console.log(`👤 User: ${userName} | Chat ID: ${chatId} | Message: ${text}`);
            }
         }

         return updates;
      } catch (error) {
         console.error('❌ Error getting updates:', error);
      }
   }

   formatMessageForTelegramMarkdownV2(message: string): string {
      // Caracteres especiais que precisam ser escapados para MarkdownV2
      const specialChars = /[_\*\[\]\(\)~`>#\+\-=\{\}\.!\\]/g;

      // Escapa todos os caracteres especiais
      let formattedMessage = message.replace(specialChars, (char) => '\\' + char);

      // Trata negrito (**texto**) -> *texto*
      formattedMessage = formattedMessage.replace(/\\\*\\\*(.*?)\\\*\\\*/g, '**$1**');
      formattedMessage = formattedMessage.replace(/\*\*(.*?)\*\*/g, '*$1*');

      // Trata itálico (__texto__ ou _texto_) -> _texto_
      // Primeiro, remove escapes dos underlines duplos
      formattedMessage = formattedMessage.replace(/\\_\\_(.*?)\\_\\_/g, '__$1__');
      // Converte __texto__ para _texto_
      formattedMessage = formattedMessage.replace(/__(.*?)__/g, '_$1_');
      // Remove escapes dos underlines simples
      formattedMessage = formattedMessage.replace(/\\_(.*?)\\_/g, '_$1_');

      // Escapa barras invertidas que não fazem parte da sintaxe MarkdownV2
      formattedMessage = formattedMessage.replace(/\\(?![\*_\[\]\(\)~`>#\+\-=\{\}\.!])/g, '\\\\');

      return formattedMessage;
   }
}
