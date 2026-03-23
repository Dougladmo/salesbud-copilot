import { z } from 'zod';

export const evolutionPayloadSchema = z.object({
  data: z.object({
    key: z.object({
      remoteJid: z.string(),
      fromMe: z.boolean(),
      id: z.string(),
    }),
    message: z.object({
      conversation: z.string().optional(),
      extendedTextMessage: z.object({ text: z.string() }).optional(),
      imageMessage: z
        .object({
          url: z.string().optional(),
          base64: z.string().optional(),
          caption: z.string().optional(),
          mimetype: z.string().optional(),
        })
        .optional(),
      audioMessage: z
        .object({
          url: z.string().optional(),
          base64: z.string().optional(),
          mimetype: z.string().optional(),
        })
        .optional(),
      videoMessage: z
        .object({
          url: z.string().optional(),
          base64: z.string().optional(),
          caption: z.string().optional(),
        })
        .optional(),
      documentMessage: z
        .object({
          url: z.string().optional(),
          base64: z.string().optional(),
          fileName: z.string().optional(),
        })
        .optional(),
    }),
    messageType: z.string(),
    messageTimestamp: z.number(),
    pushName: z.string().optional(),
  }),
}).passthrough();

export type EvolutionPayload = z.infer<typeof evolutionPayloadSchema>;
