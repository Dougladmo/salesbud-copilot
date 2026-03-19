import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { RagService } from '../services/rag.service.js';

export function createRagSearchTool(
  ragService: RagService,
  companyNamespace: string,
  sellerNamespace: string | null,
) {
  return new DynamicStructuredTool({
    name: 'search_knowledge_base',
    description:
      'Busca informações na base de conhecimento da empresa e do vendedor. Use para consultar preços, procedimentos, FAQ, políticas e qualquer informação sobre produtos ou serviços.',
    schema: z.object({
      query: z.string().describe('Pergunta ou termo de busca'),
    }),
    func: async ({ query }) => {
      const results = await ragService.query(
        companyNamespace,
        sellerNamespace,
        query,
      );
      if (!results.length) {
        return 'Nenhuma informação encontrada na base de conhecimento.';
      }
      return results
        .map((r, i) => `[${i + 1}] ${r.text} (relevância: ${r.score.toFixed(2)})`)
        .join('\n\n');
    },
  });
}
