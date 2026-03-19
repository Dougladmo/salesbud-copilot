import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

export function createThinkTool() {
  return new DynamicStructuredTool({
    name: 'think',
    description:
      'Use esta ferramenta para raciocinar sobre a melhor abordagem de vendas usando metodologia SPIN Selling. Organize seus pensamentos antes de responder ao cliente.',
    schema: z.object({
      situation: z.string().describe('Qual a situação atual do cliente?'),
      problem: z.string().describe('Qual o problema ou necessidade identificada?'),
      implication: z.string().describe('Quais as implicações de não resolver?'),
      need_payoff: z.string().describe('Como nossa solução resolve o problema?'),
    }),
    func: async ({ situation, problem, implication, need_payoff }) => {
      return `Análise SPIN concluída:
- Situação: ${situation}
- Problema: ${problem}
- Implicação: ${implication}
- Necessidade/Solução: ${need_payoff}

Use essas informações para formular uma resposta consultiva e empática.`;
    },
  });
}
