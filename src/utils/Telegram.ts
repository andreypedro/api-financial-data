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

      // Substitui caracteres especiais, mas com uma exceção para o negrito
      // A ideia é escapar os caracteres especiais que NÃO estão dentro de um par de **
      // No Telegram, o negrito é feito com **texto**
      let formattedMessage = message.replace(specialChars, (char) => '\\' + char);

      // Agora, precisamos lidar com o negrito.
      // A regex abaixo encontra pares de ** que não são escapados por uma barra invertida
      // e os substitui por * (que é o que o Telegram usa para negrito em MarkdownV2)
      // Além disso, garantimos que o conteúdo dentro do negrito não seja escapado duplamente.
      formattedMessage = formattedMessage.replace(/\\\*\*(.*?)\\\*\*/g, '**$1**');

      // Trata o caso em que o negrito é "escapado" mas a intenção é que seja negrito.
      // Por exemplo, se a mensagem original tinha `**Nova emissão**`, nossa primeira `replace`
      // transformaria em `\*\*Nova emissão\*\*`. O Telegram espera `**Nova emissão**`.
      // Então, precisamos "reverter" o escape para os asteriscos que delimitam o negrito.
      formattedMessage = formattedMessage.replace(/\\\*\\\*(.*?)\\\*\\\*/g, '**$1**');

      // O Telegram MarkdownV2 usa `*` para negrito, não `**`.
      // Se a intenção é ter negrito, devemos usar `*`.
      // A sua mensagem original já usa `**`, então vamos ajustar isso.
      formattedMessage = formattedMessage.replace(/\*\*(.*?)\*\*/g, '*$1*');

      // Adicionalmente, alguns caracteres podem ser problemáticos após a primeira passada.
      // A barra invertida (\) também precisa ser escapada se for literal.
      formattedMessage = formattedMessage.replace(/\\(?![\*_\[\]\(\)~`>#\+\-=\{\}\.!])/g, '\\\\');

      return formattedMessage;
   }
}
