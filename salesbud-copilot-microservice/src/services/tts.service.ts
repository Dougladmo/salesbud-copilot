import { injectable } from 'tsyringe';
import axios from 'axios';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

@injectable()
export class TtsService {
  async synthesize(text: string, voiceId: string): Promise<string> {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    try {
      const response = await axios.post(
        url,
        {
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.4,
            similarity_boost: 0.85,
            style: 0.8,
          },
        },
        {
          headers: {
            'xi-api-key': env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          responseType: 'arraybuffer',
        },
      );

      const base64 = Buffer.from(response.data).toString('base64');
      logger.info(`TTS synthesized: ${text.substring(0, 50)}...`);
      return base64;
    } catch (error: any) {
      logger.error(`TTS failed: ${error.message}`);
      throw error;
    }
  }
}
