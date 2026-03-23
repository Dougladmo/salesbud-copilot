import { injectable } from 'tsyringe';
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

  private audioFormatFromMime(mimetype: string): string {
    const map: Record<string, string> = {
      'audio/ogg': 'ogg',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/x-wav': 'wav',
      'audio/aac': 'aac',
      'audio/mp4': 'm4a',
      'audio/x-m4a': 'm4a',
      'audio/flac': 'flac',
    };
    return map[mimetype.split(';')[0].trim()] || 'ogg';
  }

  async transcribeAudio(base64: string, mimetype?: string): Promise<string> {
    try {
      const format = this.audioFormatFromMime(mimetype || 'audio/ogg');

      const response = await this.openai.chat.completions.create({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Transcreva este audio fielmente em portugues brasileiro. Retorne APENAS a transcrição, sem explicações ou formatação adicional.',
              },
              {
                type: 'input_audio',
                input_audio: { data: base64, format },
              } as any,
            ],
          },
        ],
        max_tokens: 1000,
      });

      const text = response.choices[0]?.message?.content || '[Audio vazio]';
      logger.info(`Audio transcribed: ${text.substring(0, 50)}...`);
      return text;
    } catch (error: any) {
      logger.error(`Transcription failed: ${error.message}`);
      return '[Audio nao pode ser transcrito]';
    }
  }

  async describeImage(base64: string, mimetype?: string): Promise<string> {
    try {
      const mime = mimetype || 'image/jpeg';
      const dataUrl = `data:${mime};base64,${base64}`;

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
                image_url: { url: dataUrl },
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
