import { injectable } from 'tsyringe';
import axios from 'axios';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import type { Seller } from '../models/seller.model.js';

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

  async sendText(seller: Seller, remoteJid: string, text: string): Promise<void> {
    const url = `${this.baseUrl}/message/sendText/${seller.evolutionInstance}`;
    try {
      await axios.post(
        url,
        { number: remoteJid, text, delay: 1200 },
        { headers: this.headers },
      );
      logger.info(`Text sent to ${remoteJid}`);
    } catch (error) {
      logger.error(`Failed to send text: ${error}`);
    }
  }

  async sendAudio(seller: Seller, remoteJid: string, audioBase64: string): Promise<void> {
    const url = `${this.baseUrl}/message/sendWhatsAppAudio/${seller.evolutionInstance}`;
    try {
      await axios.post(
        url,
        { number: remoteJid, audio: audioBase64, encoding: true, delay: 1200 },
        { headers: this.headers },
      );
      logger.info(`Audio sent to ${remoteJid}`);
    } catch (error) {
      logger.error(`Failed to send audio: ${error}`);
    }
  }

  async sendMedia(
    seller: Seller,
    remoteJid: string,
    mediaUrl: string,
    mediaType: string,
  ): Promise<void> {
    const url = `${this.baseUrl}/message/sendMedia/${seller.evolutionInstance}`;
    try {
      await axios.post(
        url,
        { number: remoteJid, mediatype: mediaType, media: mediaUrl },
        { headers: this.headers },
      );
      logger.info(`Media (${mediaType}) sent to ${remoteJid}`);
    } catch (error) {
      logger.error(`Failed to send media: ${error}`);
    }
  }
}
