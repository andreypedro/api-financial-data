import { NextFunction, Request, Response } from 'express';
import FinancialMarketDataService from '../services/FinancialMarketDataService';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = `google/gemini-2.0-flash-exp:free`;

export const TestAIController = async (
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> => {
   req.setTimeout(10 * 60 * 1000); // 5 minutes

   try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
         method: 'POST',
         headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': '<YOUR_SITE_URL>', // Optional. Site URL for rankings on openrouter.ai.
            'X-Title': '<YOUR_SITE_NAME>', // Optional. Site title for rankings on openrouter.ai.
            'Content-Type': 'application/json',
         },
         body: JSON.stringify({
            model: MODEL,
            messages: [
               {
                  role: 'system',
                  content:
                     'Você é um assistente que sempre devolve a resposta como um objeto JSON válido. Não inclua texto antes ou depois do JSON. Use aspas duplas, camelCase e nunca escreva comentários. Se a informação não estiver disponível, retorne {"error": "informação indisponível"}.',
               },
               {
                  role: 'user',
                  content:
                     'Se eu construísse o prédio mais alto do mundo, quais seriam três sugestões de nomes criativos? Forneça também a razão breve de cada nome.',
               },
            ],
            temperature: 0.3,
            max_tokens: 500,
         }),
      });

      const content = await response.json();

      res.json({
         success: true,
         data: content,
      });
   } catch (err) {
      next(err);
   }
};
