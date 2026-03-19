import { z } from 'zod';

export const createLeadSchema = z.object({
  sellerId: z.string().uuid(),
  remoteJid: z.string().min(1),
  name: z.string().optional(),
  phone: z.string().min(1),
  status: z.enum(['new', 'contacted', 'qualified', 'scheduled', 'converted', 'lost']).optional(),
  notes: z.string().optional(),
});

export const updateLeadSchema = createLeadSchema
  .omit({ sellerId: true, remoteJid: true })
  .partial();

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
