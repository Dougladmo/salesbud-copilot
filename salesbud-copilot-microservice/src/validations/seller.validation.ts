import { z } from 'zod';

export const createSellerSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(1),
  agentName: z.string().min(1),
  evolutionInstance: z.string().min(1),
  pineconeNamespace: z.string().optional(),
  traitFormality: z.enum(['formal', 'informal']).optional(),
  traitHumor: z.enum(['humorous', 'serious']).optional(),
  traitCommunication: z.enum(['direct', 'detailed']).optional(),
  traitEmpathy: z.enum(['empathetic', 'objective']).optional(),
  traitSelling: z.enum(['consultive', 'aggressive']).optional(),
  customPrompt: z.string().optional(),
  voiceId: z.string().optional(),
  timeoutMs: z.number().int().min(1000).optional(),
  timePerCharMs: z.number().int().min(10).optional(),
  maxMemoryMessages: z.number().int().min(1).optional(),
  audioThreshold: z.number().int().min(100).optional(),
  isActive: z.boolean().optional(),
});

export const updateSellerSchema = createSellerSchema.omit({ companyId: true }).partial();

export type CreateSellerInput = z.infer<typeof createSellerSchema>;
export type UpdateSellerInput = z.infer<typeof updateSellerSchema>;
