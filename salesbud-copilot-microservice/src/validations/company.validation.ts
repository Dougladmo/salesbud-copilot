import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(1),
  pineconeNamespace: z.string().min(1),
  evolutionApiUrl: z.string().min(1),
  evolutionApiKey: z.string().min(1),
});

export const updateCompanySchema = createCompanySchema.partial();

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
