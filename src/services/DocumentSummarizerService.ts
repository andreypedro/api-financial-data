import { OllamaSummarizer } from '../utils/OllamaSummarizer';

const AI_BASE_URL = process.env.AI_BASE_URL || 'http://localhost:11434';
const AI_MODEL = process.env.AI_MODEL || 'qwen3:latest';

class DocumentSummarizerService {
   async summarize(text: string): Promise<string> {
      const persona =
         'Você é um assistente de API que **DEVE responder com Markdown válido em português do Brasil (pt_BR)**.\n\n';
      const context =
         'Você acabou de receber um relatório da administradora do fundo com informações aos investidores.\n\n';
      const task =
         'Escreva um texto que será um post/notícia em terceira pessoa em relação ao fundo, em que os investidores receberão via Telegram e também verão no site. Formate a resposta exclusivamente em Markdown com os seguintes elementos:\n' +
         '- Uma seção "**TL;DR**" (too long; didn’t read) com os principais destaques em negrito;\n' +
         '- Um resumo com no máximo 5.000 caracteres abaixo do TL;DR;\n';
      const exemplar =
         'A mensagem deve destacar os principais pontos do relatório (caso existam, do contrário não mostrar), como por exemplo:\n' +
         '- Rendimento por cota e dividend yield;\n' +
         '- Vacância dos imóveis ou inadimplência de recebíveis;\n' +
         '- Aquisições, vendas ou movimentações relevantes na carteira;\n' +
         '- Revisões ou renegociações contratuais com inquilinos;\n' +
         '- Mudanças na estratégia do fundo ou comentários da gestão sobre o cenário atual;\n' +
         '- Indicadores como P/VP, valor patrimonial por cota, evolução de receitas e despesas;\n' +
         '- Eventos extraordinários como emissões de cotas ou impactos regulatórios;\n\n' +
         '- Ao mencionar novas locações ou encerramentos de contrato, não declare o impacto exato na distribuição mensal.\n' +
         '---\n' +
         '**Importante:**\n' +
         '- Não explique o que está fazendo;\n' +
         '- Não adicione blocos de código nem links para o relatório;\n' +
         '- Não responda pedindo esclarecimentos, apenas entregue a melhor resposta possível com base nas instruções;\n' +
         '- Responda sempre em idioma Português do Brasil (pt_BR);\n' +
         '- Não responda como se fosse a responsável pelo fundo, mas sim como um assistente que fornece informações sobre o fundo;\n' +
         '- Sempre inclua a seção TL;DR seguida do conteúdo;\n' +
         '- Não faça nenhum recomendação de investimento;\n' +
         '- Não fale sobre o futuro ou faça previsões;\n' +
         '- Não fale sobre imposto de renda;\n' +
         '- Use apenas informações do relatório atual;\n' +
         '- Não confunda preço unitário com rendimento;\n';
      const tone =
         'Use uma linguagem clara, acessível e direta, focando em ajudar o investidor a entender a situação do fundo sem precisar ler o relatório completo. Evite jargões técnicos e priorize explicações objetivas, destacando o que muda ou reforça a tese do fundo.';
      const prompt = persona + context + task + exemplar + tone;
      const options = {
         temperature: 0.2,
         top_p: 1.0,
         top_k: 1,
         num_ctx: 8192,
         stop: [],
      };
      const ollamaSummarizer = new OllamaSummarizer(AI_BASE_URL, AI_MODEL);
      return ollamaSummarizer.summarize(text, prompt, options);
   }
}

export default DocumentSummarizerService;
