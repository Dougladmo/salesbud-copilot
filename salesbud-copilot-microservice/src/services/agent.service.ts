import { injectable, inject } from 'tsyringe';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { env } from '../config/env.js';
import { redis } from '../config/redis.js';
import { logger } from '../config/logger.js';
import { SellerService } from './seller.service.js';
import { RagService } from './rag.service.js';
import { buildSystemPrompt } from '../utils/prompt-builder.js';
import { createRagSearchTool } from '../jobs/rag-search.tool.js';
import { createThinkTool } from '../jobs/think.tool.js';

@injectable()
export class AgentService {
  constructor(
    @inject(SellerService) private readonly sellerService: SellerService,
    @inject(RagService) private readonly ragService: RagService,
  ) {}

  async processMessage(
    sellerId: string,
    remoteJid: string,
    userMessage: string,
  ): Promise<string> {
    const seller = await this.sellerService.findOne(sellerId);
    const { company } = seller;

    const systemPrompt = buildSystemPrompt(seller, company);
    const memoryKey = `memory:${sellerId}:${remoteJid}`;

    const history = await this.loadMemory(memoryKey);

    const tools = [
      createRagSearchTool(
        this.ragService,
        company.pineconeNamespace,
        seller.pineconeNamespace,
      ),
      createThinkTool(),
    ];

    const llm = new ChatOpenAI({
      modelName: 'openai/gpt-4o',
      openAIApiKey: env.OPENROUTER_API_KEY,
      temperature: 0.7,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
      },
    });

    const agent = createReactAgent({ llm, tools });

    const messages = [
      new SystemMessage(systemPrompt),
      ...history,
      new HumanMessage(userMessage),
    ];

    try {
      const result = await agent.invoke({ messages });

      const lastMessage = result.messages[result.messages.length - 1];
      const responseText =
        typeof lastMessage.content === 'string'
          ? lastMessage.content
          : JSON.stringify(lastMessage.content);

      await this.saveMemory(
        memoryKey,
        userMessage,
        responseText,
        seller.maxMemoryMessages,
      );

      logger.info(`Agent response generated: seller=${sellerId} length=${responseText.length}`);
      return responseText;
    } catch (error: any) {
      logger.error(`Agent error: ${error.message}`);
      return 'Desculpe, tive um problema ao processar sua mensagem. Pode repetir?';
    }
  }

  private async loadMemory(key: string): Promise<(HumanMessage | AIMessage)[]> {
    const raw = await redis.lrange(key, 0, -1);
    return raw.map((entry) => {
      const parsed = JSON.parse(entry);
      if (parsed.role === 'human') return new HumanMessage(parsed.content);
      return new AIMessage(parsed.content);
    });
  }

  private async saveMemory(
    key: string,
    userMsg: string,
    aiMsg: string,
    maxMessages: number,
  ): Promise<void> {
    await redis.rpush(
      key,
      JSON.stringify({ role: 'human', content: userMsg }),
      JSON.stringify({ role: 'ai', content: aiMsg }),
    );
    await redis.ltrim(key, -(maxMessages * 2), -1);
  }
}
