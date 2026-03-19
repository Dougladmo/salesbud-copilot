import { injectable } from 'tsyringe';
import axios from 'axios';
import OpenAI from 'openai';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

@injectable()
export class TranscriptionService {
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    });
  }

  async transcribeAudio(audioUrl: string): Promise<string> {
    try {
      const response = await axios.get(audioUrl, { responseType: 'arraybuffer' });

      const file = new File(
        [Buffer.from(response.data)],
        'audio.ogg',
        { type: 'audio/ogg' },
      );

      const transcription = await this.openai.audio.transcriptions.create({
        model: 'openai/whisper-1',
        file,
      });

      logger.info(`Audio transcribed: ${transcription.text.substring(0, 50)}...`);
      return transcription.text;
    } catch (error: any) {
      logger.error(`Transcription failed: ${error.message}`);
      return '[Audio nao pode ser transcrito]';
    }
  }

  async describeImage(imageUrl: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Descreva esta imagem de forma concisa em portugues brasileiro. Se houver texto na imagem, transcreva-o.',
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        max_tokens: 300,
      });

      const description = response.choices[0]?.message?.content || 'Imagem sem descricao';
      logger.info(`Image described: ${description.substring(0, 50)}...`);
      return description;
    } catch (error: any) {
      logger.error(`Image description failed: ${error.message}`);
      return '[Imagem nao pode ser descrita]';
    }
  }
}
