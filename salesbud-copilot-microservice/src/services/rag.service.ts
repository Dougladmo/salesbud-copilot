import { injectable } from 'tsyringe';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export interface RagResult {
  text: string;
  score: number;
  metadata: Record<string, any>;
}

@injectable()
export class RagService {
  private readonly pinecone: Pinecone;
  private readonly index: ReturnType<Pinecone['Index']>;
  private readonly openai: OpenAI;

  constructor() {
    this.pinecone = new Pinecone({ apiKey: env.PINECONE_API_KEY });
    this.index = this.pinecone.Index(env.PINECONE_INDEX);
    this.openai = new OpenAI({
      apiKey: env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    });
    logger.info('Pinecone and OpenRouter initialized');
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'openai/text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }

  async query(
    companyNamespace: string,
    sellerNamespace: string | null,
    queryText: string,
    topK = 3,
  ): Promise<RagResult[]> {
    const embedding = await this.generateEmbedding(queryText);
    const results: RagResult[] = [];

    const companyResults = await this.index
      .namespace(companyNamespace)
      .query({ vector: embedding, topK, includeMetadata: true });

    for (const match of companyResults.matches || []) {
      if (match.metadata) {
        results.push({
          text: (match.metadata.text as string) || '',
          score: match.score || 0,
          metadata: match.metadata as Record<string, any>,
        });
      }
    }

    if (sellerNamespace) {
      const sellerResults = await this.index
        .namespace(sellerNamespace)
        .query({ vector: embedding, topK, includeMetadata: true });

      for (const match of sellerResults.matches || []) {
        if (match.metadata) {
          results.push({
            text: (match.metadata.text as string) || '',
            score: match.score || 0,
            metadata: match.metadata as Record<string, any>,
          });
        }
      }
    }

    results.sort((a, b) => b.score - a.score);

    const seen = new Set<string>();
    return results.filter((r) => {
      if (seen.has(r.text)) return false;
      seen.add(r.text);
      return true;
    });
  }

  async upsertDocument(
    namespace: string,
    documentId: string,
    text: string,
    metadata: Record<string, any> = {},
  ): Promise<void> {
    const embedding = await this.generateEmbedding(text);

    await this.index.namespace(namespace).upsert({
      records: [
        {
          id: documentId,
          values: embedding,
          metadata: { ...metadata, text },
        },
      ],
    });

    logger.info(`Document upserted: ns=${namespace} id=${documentId}`);
  }
}
