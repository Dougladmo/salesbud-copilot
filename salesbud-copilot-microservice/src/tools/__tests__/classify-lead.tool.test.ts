import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClassifyLeadTool } from '../classify-lead.tool.js';

vi.mock('../../config/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

const SELLER_ID = 'seller-uuid-123';
const REMOTE_JID = '5511999999999@s.whatsapp.net';

function makeLead(overrides: Record<string, any> = {}) {
  return {
    id: 'lead-uuid-456',
    sellerId: SELLER_ID,
    remoteJid: REMOTE_JID,
    status: 'new',
    temperature: null,
    painPoints: null,
    expectations: null,
    interests: null,
    objections: null,
    budget: null,
    timeline: null,
    isDecisionMaker: null,
    qualificationSummary: null,
    ...overrides,
  };
}

function mockLeadService(overrides: Record<string, any> = {}) {
  return {
    findBySellerAndJid: vi.fn().mockResolvedValue(makeLead()),
    update: vi.fn().mockResolvedValue(makeLead()),
    ...overrides,
  } as any;
}

describe('classify_lead tool', () => {
  let leadService: ReturnType<typeof mockLeadService>;

  beforeEach(() => {
    vi.restoreAllMocks();
    leadService = mockLeadService();
  });

  describe('lead not found', () => {
    it('returns "Lead não encontrado" when lead does not exist', async () => {
      leadService = mockLeadService({
        findBySellerAndJid: vi.fn().mockResolvedValue(null),
      });

      const tool = createClassifyLeadTool(leadService, SELLER_ID, REMOTE_JID);
      const result = await tool.invoke({ temperature: 'hot' });

      expect(result).toContain('Lead não encontrado');
      expect(leadService.update).not.toHaveBeenCalled();
    });
  });

  describe('no new information', () => {
    it('returns "Nenhuma informação nova" when all fields are empty', async () => {
      const tool = createClassifyLeadTool(leadService, SELLER_ID, REMOTE_JID);
      const result = await tool.invoke({});

      expect(result).toContain('Nenhuma informação nova');
      expect(leadService.update).not.toHaveBeenCalled();
    });
  });

  describe('scalar field updates', () => {
    it('updates status and temperature', async () => {
      const tool = createClassifyLeadTool(leadService, SELLER_ID, REMOTE_JID);
      const result = await tool.invoke({ status: 'qualified', temperature: 'hot' });

      expect(leadService.update).toHaveBeenCalledWith(
        'lead-uuid-456',
        expect.objectContaining({ status: 'qualified', temperature: 'hot' }),
      );
      expect(result).toContain('etapa: qualified');
      expect(result).toContain('temperatura: hot');
    });

    it('updates budget, timeline, is_decision_maker and qualification_summary', async () => {
      const tool = createClassifyLeadTool(leadService, SELLER_ID, REMOTE_JID);
      const result = await tool.invoke({
        budget: 'R$5000/mês',
        timeline: 'Q2 2025',
        is_decision_maker: true,
        qualification_summary: 'Lead qualificado com budget aprovado',
      });

      expect(leadService.update).toHaveBeenCalledWith(
        'lead-uuid-456',
        expect.objectContaining({
          budget: 'R$5000/mês',
          timeline: 'Q2 2025',
          isDecisionMaker: true,
          qualificationSummary: 'Lead qualificado com budget aprovado',
        }),
      );
      expect(result).toContain('orçamento: R$5000/mês');
      expect(result).toContain('prazo: Q2 2025');
      expect(result).toContain('decisor: sim');
    });

    it('reports "decisor: não" when is_decision_maker is false', async () => {
      const tool = createClassifyLeadTool(leadService, SELLER_ID, REMOTE_JID);
      const result = await tool.invoke({ is_decision_maker: false });

      expect(leadService.update).toHaveBeenCalledWith(
        'lead-uuid-456',
        expect.objectContaining({ isDecisionMaker: false }),
      );
      expect(result).toContain('decisor: não');
    });
  });

  describe('mergeLists deduplication', () => {
    it('merges new pain_points deduplicating case-insensitively', async () => {
      leadService = mockLeadService({
        findBySellerAndJid: vi.fn().mockResolvedValue(
          makeLead({ painPoints: ['Perda de tempo'] }),
        ),
      });

      const tool = createClassifyLeadTool(leadService, SELLER_ID, REMOTE_JID);
      const result = await tool.invoke({
        pain_points: ['perda de tempo', 'Custo alto'],
      });

      expect(leadService.update).toHaveBeenCalledWith(
        'lead-uuid-456',
        expect.objectContaining({
          painPoints: ['Perda de tempo', 'Custo alto'],
        }),
      );
      expect(result).toContain('dores:');
    });

    it('merges into null arrays treating them as empty', async () => {
      leadService = mockLeadService({
        findBySellerAndJid: vi.fn().mockResolvedValue(
          makeLead({ painPoints: null, expectations: null }),
        ),
      });

      const tool = createClassifyLeadTool(leadService, SELLER_ID, REMOTE_JID);
      await tool.invoke({
        pain_points: ['Dor 1'],
        expectations: ['Meta 1'],
      });

      expect(leadService.update).toHaveBeenCalledWith(
        'lead-uuid-456',
        expect.objectContaining({
          painPoints: ['Dor 1'],
          expectations: ['Meta 1'],
        }),
      );
    });

    it('preserves original casing of existing items during merge', async () => {
      leadService = mockLeadService({
        findBySellerAndJid: vi.fn().mockResolvedValue(
          makeLead({ interests: ['Automação de WhatsApp'] }),
        ),
      });

      const tool = createClassifyLeadTool(leadService, SELLER_ID, REMOTE_JID);
      await tool.invoke({
        interests: ['automação de whatsapp', 'CRM integrado'],
      });

      expect(leadService.update).toHaveBeenCalledWith(
        'lead-uuid-456',
        expect.objectContaining({
          interests: ['Automação de WhatsApp', 'CRM integrado'],
        }),
      );
    });
  });

  describe('error handling', () => {
    it('returns error message when leadService throws', async () => {
      leadService = mockLeadService({
        findBySellerAndJid: vi.fn().mockRejectedValue(new Error('DB connection lost')),
      });

      const tool = createClassifyLeadTool(leadService, SELLER_ID, REMOTE_JID);
      const result = await tool.invoke({ temperature: 'warm' });

      expect(result).toContain('Erro ao classificar o lead');
      expect(leadService.update).not.toHaveBeenCalled();
    });
  });
});
