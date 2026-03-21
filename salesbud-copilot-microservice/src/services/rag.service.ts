import { injectable } from 'tsyringe';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/app-error.js';

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
  private readonly textSplitter: RecursiveCharacterTextSplitter;
  private indexReady = false;

  constructor() {
    this.pinecone = new Pinecone({ apiKey: env.PINECONE_API_KEY });
    this.openai = new OpenAI({
      apiKey: env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    });
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 800,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', '. ', ', ', ' ', ''],
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
      } else if (err?.name === 'PineconeConnectionError') {
        throw new AppError('Pinecone service is unavailable. Please try again later.', 503);
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

  private extractResults(matches: any[]): RagResult[] {
    return (matches || [])
      .filter((m: any) => m.metadata)
      .map((m: any) => ({
        text: (m.metadata.text as string) || '',
        score: m.score || 0,
        metadata: m.metadata as Record<string, any>,
      }));
  }

  async query(
    companyNamespace: string,
    sellerNamespace: string | null,
    queryText: string,
    topK = 3,
  ): Promise<RagResult[]> {
    await this.ensureIndex();
    const embedding = await this.generateEmbedding(queryText);

    const queryParams = { vector: embedding, topK, includeMetadata: true };
    const queries: Promise<any>[] = [
      this.index.namespace(companyNamespace).query(queryParams),
    ];

    if (sellerNamespace) {
      queries.push(this.index.namespace(sellerNamespace).query(queryParams));
    }

    const queryResults = await Promise.all(queries);
    const results = queryResults.flatMap((r) => this.extractResults(r.matches));

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

    const chunks = await this.textSplitter.splitText(text);

    if (chunks.length === 0) {
      throw new AppError('Document text is empty or could not be split.', 400);
    }

    const BATCH_SIZE = 50;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);

      const embeddings = await Promise.all(
        batch.map((chunk) => this.generateEmbedding(chunk)),
      );

      const records = batch.map((chunk, j) => ({
        id: `${documentId}#chunk-${i + j}`,
        values: embeddings[j],
        metadata: {
          ...metadata,
          text: chunk,
          documentId,
          chunkIndex: i + j,
          totalChunks: chunks.length,
        },
      }));

      await this.index.namespace(namespace).upsert({ records });
    }

    logger.info(
      `Document upserted: ns=${namespace} id=${documentId} chunks=${chunks.length}`,
    );
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
    const grouped = new Map<string, { chunks: string[]; metadata: Record<string, any> }>();

    for (const [, record] of Object.entries(fetched.records || {})) {
      if (!record?.metadata) continue;
      const meta = record.metadata as Record<string, any>;
      const docId = (meta.documentId as string) || record.id!;
      const chunkText = (meta.text as string) || '';

      if (!grouped.has(docId)) {
        const { text, documentId, chunkIndex, totalChunks, ...rest } = meta;
        grouped.set(docId, { chunks: [], metadata: rest });
      }

      const entry = grouped.get(docId)!;
      const idx = (meta.chunkIndex as number) ?? 0;
      entry.chunks[idx] = chunkText;
    }

    return Array.from(grouped.entries()).map(([id, { chunks, metadata }]) => ({
      id,
      text: chunks.filter(Boolean).join('\n\n'),
      metadata,
    }));
  }

  async deleteDocument(namespace: string, documentId: string): Promise<void> {
    await this.ensureIndex();
    const ns = this.index.namespace(namespace);

    const idsToDelete: string[] = [];
    let paginationToken: string | undefined;

    do {
      const page = await ns.listPaginated({
        prefix: `${documentId}#chunk-`,
        limit: 100,
        paginationToken,
      });
      if (page.vectors) {
        for (const v of page.vectors) {
          if (v.id) idsToDelete.push(v.id);
        }
      }
      paginationToken = page.pagination?.next;
    } while (paginationToken);

    // Fallback for documents stored before chunking (single vector with bare UUID)
    if (idsToDelete.length === 0) {
      idsToDelete.push(documentId);
    }

    await ns.deleteMany({ ids: idsToDelete });
    logger.info(`Document deleted: ns=${namespace} id=${documentId} vectors=${idsToDelete.length}`);
  }

  async deleteAllDocuments(namespace: string): Promise<void> {
    await this.ensureIndex();
    await this.index.namespace(namespace).deleteAll();
    logger.info(`All documents deleted: ns=${namespace}`);
  }
}
