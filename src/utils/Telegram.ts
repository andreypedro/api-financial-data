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
            text: this.markdownToTelegramHTML(text),
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

   markdownToTelegramHTML(markdown: string): string {
      return (
         markdown
            // Bold: **text** → <b>text</b>
            .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
            // Italic: *text* → <i>text</i>
            .replace(/\*(.+?)\*/g, '<i>$1</i>')
            // Line breaks
            .replace(/\n/g, '<br>')
      );
   }
}
