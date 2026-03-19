import { z } from 'zod';

export const uploadDocumentSchema = z.object({
  text: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
