import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  RABBITMQ_URL: z.string().default('amqp://localhost:5672'),
  OPENAI_API_KEY: z.string().min(1),
  PINECONE_API_KEY: z.string().min(1),
  PINECONE_INDEX: z.string().default('salesbud-sdr'),
  ELEVENLABS_API_KEY: z.string().default(''),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env: Env = parsed.data;
