import { describe, it, expect } from 'vitest';
import { createThinkTool } from '../think.tool.js';

describe('think tool (SPIN Selling)', () => {
  it('returns formatted SPIN analysis with all four fields', async () => {
    const tool = createThinkTool();
    const result = await tool.invoke({
      situation: 'Empresa de 50 funcionários sem automação',
      problem: 'Atendimento manual consome 6h/dia',
      implication: 'Perda de clientes por demora no retorno',
      need_payoff: 'Automação reduz tempo de resposta em 80%',
    });

    expect(result).toContain('Análise SPIN concluída');
    expect(result).toContain('Situação: Empresa de 50 funcionários sem automação');
    expect(result).toContain('Problema: Atendimento manual consome 6h/dia');
    expect(result).toContain('Implicação: Perda de clientes por demora no retorno');
    expect(result).toContain('Necessidade/Solução: Automação reduz tempo de resposta em 80%');
    expect(result).toContain('resposta consultiva e empática');
  });

  it('preserves special characters and accented text', async () => {
    const tool = createThinkTool();
    const result = await tool.invoke({
      situation: 'Situação com "aspas" e acentuação: é, ã, ç',
      problem: 'Problema com R$5.000,00 e 100% de impacto',
      implication: 'Implicação: perda > R$10k/mês',
      need_payoff: 'Solução: ROI de 3x em 6 meses',
    });

    expect(result).toContain('"aspas"');
    expect(result).toContain('é, ã, ç');
    expect(result).toContain('R$5.000,00');
    expect(result).toContain('100%');
    expect(result).toContain('R$10k/mês');
  });
});
