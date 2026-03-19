import { injectable } from 'tsyringe';
import axios from 'axios';
import { logger } from '../config/logger.js';
import type { Seller } from '../models/seller.model.js';

@injectable()
export class WhatsappService {
  private getHeaders(seller: Seller) {
    return {
      'Content-Type': 'application/json',
      apikey: seller.company.evolutionApiKey,
    };
  }

  private getBaseUrl(seller: Seller) {
    return seller.company.evolutionApiUrl;
  }

  async sendText(seller: Seller, remoteJid: string, text: string): Promise<void> {
    const url = `${this.getBaseUrl(seller)}/message/sendText/${seller.evolutionInstance}`;
    try {
      await axios.post(
        url,
        { number: remoteJid, text, delay: 1200 },
        { headers: this.getHeaders(seller) },
      );
      logger.info(`Text sent to ${remoteJid}`);
    } catch (error) {
      logger.error(`Failed to send text: ${error}`);
    }
  }

  async sendAudio(seller: Seller, remoteJid: string, audioBase64: string): Promise<void> {
    const url = `${this.getBaseUrl(seller)}/message/sendWhatsAppAudio/${seller.evolutionInstance}`;
    try {
      await axios.post(
        url,
        { number: remoteJid, audio: audioBase64, encoding: true, delay: 1200 },
        { headers: this.getHeaders(seller) },
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
    const url = `${this.getBaseUrl(seller)}/message/sendMedia/${seller.evolutionInstance}`;
    try {
      await axios.post(
        url,
        { number: remoteJid, mediatype: mediaType, media: mediaUrl },
        { headers: this.getHeaders(seller) },
      );
      logger.info(`Media (${mediaType}) sent to ${remoteJid}`);
    } catch (error) {
      logger.error(`Failed to send media: ${error}`);
    }
  }
}
