import { z } from 'zod';

export const createSellerSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(1),
  agentName: z.string().min(1),
  pineconeNamespace: z.string().optional(),
  voiceId: z.string().optional(),
  maxMemoryMessages: z.number().int().min(10).max(1000).optional(),
  isActive: z.boolean().optional(),
});

export const updateSellerSchema = createSellerSchema.omit({ companyId: true }).partial();

export type CreateSellerInput = z.infer<typeof createSellerSchema>;
export type UpdateSellerInput = z.infer<typeof updateSellerSchema>;
