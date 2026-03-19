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
  private index!: ReturnType<Pinecone['Index']>;
  private readonly openai: OpenAI;
  private indexReady = false;

  constructor() {
    this.pinecone = new Pinecone({ apiKey: env.PINECONE_API_KEY });
    this.openai = new OpenAI({
      apiKey: env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    });
    logger.info('Pinecone and OpenRouter initialized');
  }

  private async ensureIndex(): Promise<void> {
    if (this.indexReady) return;

    try {
      await this.pinecone.describeIndex(env.PINECONE_INDEX);
    } catch (err: any) {
      if (err?.name === 'PineconeNotFoundError') {
        logger.info(`Index "${env.PINECONE_INDEX}" not found, creating...`);
        await this.pinecone.createIndex({
          name: env.PINECONE_INDEX,
          dimension: 1536,
          metric: 'cosine',
          spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
        });
        logger.info(`Index "${env.PINECONE_INDEX}" created, waiting for ready state...`);
        await this.waitForIndex();
      } else {
        throw err;
      }
    }

    this.index = this.pinecone.Index(env.PINECONE_INDEX);
    this.indexReady = true;
  }

  private async waitForIndex(): Promise<void> {
    for (let i = 0; i < 60; i++) {
      const desc = await this.pinecone.describeIndex(env.PINECONE_INDEX);
      if (desc.status?.ready) return;
      await new Promise((r) => setTimeout(r, 2000));
    }
    throw new Error(`Index "${env.PINECONE_INDEX}" not ready after 120s`);
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
    await this.ensureIndex();
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
    await this.ensureIndex();
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

  async listDocuments(namespace: string): Promise<{ id: string; text: string; metadata: Record<string, any> }[]> {
    await this.ensureIndex();
    const ids: string[] = [];
    let paginationToken: string | undefined;

    do {
      const page = await this.index.namespace(namespace).listPaginated({
        limit: 100,
        paginationToken,
      });
      if (page.vectors) {
        ids.push(...page.vectors.map((v) => v.id!));
      }
      paginationToken = page.pagination?.next;
    } while (paginationToken);

    if (ids.length === 0) return [];

    const fetched = await this.index.namespace(namespace).fetch({ ids });
    const docs: { id: string; text: string; metadata: Record<string, any> }[] = [];

    for (const [id, record] of Object.entries(fetched.records || {})) {
      if (record?.metadata) {
        const { text, ...rest } = record.metadata as Record<string, any>;
        docs.push({ id, text: text || '', metadata: rest });
      }
    }

    return docs;
  }

  async deleteDocument(namespace: string, documentId: string): Promise<void> {
    await this.ensureIndex();
    await this.index.namespace(namespace).deleteOne({ id: documentId });
    logger.info(`Document deleted: ns=${namespace} id=${documentId}`);
  }

  async deleteAllDocuments(namespace: string): Promise<void> {
    await this.ensureIndex();
    await this.index.namespace(namespace).deleteAll();
    logger.info(`All documents deleted: ns=${namespace}`);
  }
}
