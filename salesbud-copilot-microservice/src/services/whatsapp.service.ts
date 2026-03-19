import { injectable } from 'tsyringe';
import axios from 'axios';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

@injectable()
export class WhatsappService {
  private get headers() {
    return {
      'Content-Type': 'application/json',
      apikey: env.EVOLUTION_API_KEY,
    };
  }

  private get baseUrl() {
    return env.EVOLUTION_API_URL;
  }

  private get instance() {
    return env.EVOLUTION_INSTANCE_NAME;
  }

  private async send(endpoint: string, body: Record<string, unknown>, label: string): Promise<void> {
    const url = `${this.baseUrl}/${endpoint}/${this.instance}`;
    try {
      await axios.post(url, body, { headers: this.headers });
      logger.info(`${label} sent to ${body.number}`);
    } catch (error) {
      logger.error(`Failed to send ${label}: ${error}`);
      throw error;
    }
  }

  async sendText(remoteJid: string, text: string): Promise<void> {
    await this.send('message/sendText', { number: remoteJid, text, delay: 1200 }, 'Text');
  }

  async sendAudio(remoteJid: string, audioBase64: string): Promise<void> {
    await this.send(
      'message/sendWhatsAppAudio',
      { number: remoteJid, audio: audioBase64, encoding: true, delay: 1200 },
      'Audio',
    );
  }

  async sendMedia(remoteJid: string, mediaUrl: string, mediaType: string): Promise<void> {
    await this.send(
      'message/sendMedia',
      { number: remoteJid, mediatype: mediaType, media: mediaUrl },
      `Media (${mediaType})`,
    );
  }
}
