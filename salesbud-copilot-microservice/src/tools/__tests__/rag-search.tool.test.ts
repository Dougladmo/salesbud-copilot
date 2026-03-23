import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRagSearchTool } from '../rag-search.tool.js';

function mockRagService(overrides: Record<string, any> = {}) {
  return {
    query: vi.fn().mockResolvedValue([]),
    ...overrides,
  } as any;
}

describe('search_knowledge_base tool', () => {
  let ragService: ReturnType<typeof mockRagService>;

  beforeEach(() => {
    vi.restoreAllMocks();
    ragService = mockRagService();
  });

  it('returns formatted numbered list with relevance scores', async () => {
    ragService = mockRagService({
      query: vi.fn().mockResolvedValue([
        { text: 'Plano Pro custa R$299/mês', score: 0.95, metadata: {} },
        { text: 'Desconto de 20% no plano anual', score: 0.82, metadata: {} },
      ]),
    });

    const tool = createRagSearchTool(ragService, 'company-ns', 'seller-ns');
    const result = await tool.invoke({ query: 'preço plano pro' });

    expect(result).toContain('[1] Plano Pro custa R$299/mês (relevância: 0.95)');
    expect(result).toContain('[2] Desconto de 20% no plano anual (relevância: 0.82)');
    expect(ragService.query).toHaveBeenCalledWith('company-ns', 'seller-ns', 'preço plano pro');
  });

  it('returns "Nenhuma informação encontrada" when results array is empty', async () => {
    const tool = createRagSearchTool(ragService, 'company-ns', 'seller-ns');
    const result = await tool.invoke({ query: 'algo inexistente' });

    expect(result).toContain('Nenhuma informação encontrada');
  });

  it('passes null sellerNamespace correctly', async () => {
    ragService = mockRagService({
      query: vi.fn().mockResolvedValue([
        { text: 'Resultado', score: 0.9, metadata: {} },
      ]),
    });

    const tool = createRagSearchTool(ragService, 'company-ns', null);
    await tool.invoke({ query: 'test' });

    expect(ragService.query).toHaveBeenCalledWith('company-ns', null, 'test');
  });

  it('formats scores to exactly 2 decimal places', async () => {
    ragService = mockRagService({
      query: vi.fn().mockResolvedValue([
        { text: 'Resultado com score arredondado', score: 0.8, metadata: {} },
      ]),
    });

    const tool = createRagSearchTool(ragService, 'company-ns', 'seller-ns');
    const result = await tool.invoke({ query: 'test' });

    expect(result).toContain('0.80');
  });
});
