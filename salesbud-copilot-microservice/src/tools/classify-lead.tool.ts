import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { LeadService } from '../services/lead.service.js';
import { LeadTemperature } from '../models/lead.model.js';
import { logger } from '../config/logger.js';

export function createClassifyLeadTool(
  leadService: LeadService,
  sellerId: string,
  remoteJid: string,
) {
  return new DynamicStructuredTool({
    name: 'classify_lead',
    description:
      'Classifica o lead com base na conversa. Use após identificar informações relevantes como: nível de interesse (temperatura), dores, expectativas, interesses, objeções, orçamento, prazo ou se é decisor. Atualize SEMPRE que perceber mudança no perfil do lead.',
    schema: z.object({
      temperature: z
        .enum(['cold', 'warm', 'hot'])
        .optional()
        .describe(
          'Temperatura do lead: cold = sem interesse claro ou início de conversa, warm = demonstrou interesse mas ainda tem dúvidas, hot = pronto para comprar ou muito engajado',
        ),
      pain_points: z
        .array(z.string())
        .optional()
        .describe('Dores e problemas que o cliente mencionou (ex: "perda de tempo com processos manuais")'),
      expectations: z
        .array(z.string())
        .optional()
        .describe('O que o cliente espera como resultado (ex: "automatizar atendimento", "reduzir custos")'),
      interests: z
        .array(z.string())
        .optional()
        .describe('Produtos, funcionalidades ou temas que despertaram interesse do lead'),
      objections: z
        .array(z.string())
        .optional()
        .describe('Objeções ou preocupações levantadas pelo lead (ex: "preço alto", "já uso outra ferramenta")'),
      budget: z
        .string()
        .optional()
        .describe('Informação sobre orçamento mencionada pelo lead'),
      timeline: z
        .string()
        .optional()
        .describe('Prazo ou urgência mencionada pelo lead (ex: "preciso pra semana que vem", "estamos avaliando pro Q2")'),
      is_decision_maker: z
        .boolean()
        .optional()
        .describe('Se o lead é quem toma a decisão de compra'),
      qualification_summary: z
        .string()
        .optional()
        .describe('Resumo curto da qualificação atual do lead em 1-2 frases'),
    }),
    func: async ({
      temperature,
      pain_points,
      expectations,
      interests,
      objections,
      budget,
      timeline,
      is_decision_maker,
      qualification_summary,
    }) => {
      try {
        const lead = await leadService.findBySellerAndJid(sellerId, remoteJid);
        if (!lead) {
          return 'Lead não encontrado para classificação.';
        }

        const updates: Record<string, unknown> = {};

        if (temperature) updates.temperature = temperature as LeadTemperature;
        if (pain_points?.length) updates.painPoints = mergeLists(lead.painPoints, pain_points);
        if (expectations?.length) updates.expectations = mergeLists(lead.expectations, expectations);
        if (interests?.length) updates.interests = mergeLists(lead.interests, interests);
        if (objections?.length) updates.objections = mergeLists(lead.objections, objections);
        if (budget) updates.budget = budget;
        if (timeline) updates.timeline = timeline;
        if (is_decision_maker !== undefined) updates.isDecisionMaker = is_decision_maker;
        if (qualification_summary) updates.qualificationSummary = qualification_summary;

        if (Object.keys(updates).length === 0) {
          return 'Nenhuma informação nova para classificar.';
        }

        await leadService.update(lead.id, updates);

        logger.info(`Lead classified: seller=${sellerId} jid=${remoteJid} updates=${JSON.stringify(updates)}`);

        const parts: string[] = [];
        if (temperature) parts.push(`temperatura: ${temperature}`);
        if (pain_points?.length) parts.push(`dores: ${pain_points.join(', ')}`);
        if (expectations?.length) parts.push(`expectativas: ${expectations.join(', ')}`);
        if (interests?.length) parts.push(`interesses: ${interests.join(', ')}`);
        if (objections?.length) parts.push(`objeções: ${objections.join(', ')}`);
        if (budget) parts.push(`orçamento: ${budget}`);
        if (timeline) parts.push(`prazo: ${timeline}`);
        if (is_decision_maker !== undefined) parts.push(`decisor: ${is_decision_maker ? 'sim' : 'não'}`);

        return `Lead classificado com sucesso: ${parts.join(' | ')}`;
      } catch (error: any) {
        logger.error(`Lead classification error: ${error.message}`);
        return 'Erro ao classificar o lead. Continue a conversa normalmente.';
      }
    },
  });
}

function mergeLists(existing: string[] | null, incoming: string[]): string[] {
  const current = existing ?? [];
  const normalized = new Set(current.map((s) => s.toLowerCase().trim()));
  const merged = [...current];

  for (const item of incoming) {
    const key = item.toLowerCase().trim();
    if (!normalized.has(key)) {
      merged.push(item);
      normalized.add(key);
    }
  }

  return merged;
}
