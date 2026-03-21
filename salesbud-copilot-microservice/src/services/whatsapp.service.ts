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

  private resolveInstance(instanceName?: string): string {
    return instanceName || env.EVOLUTION_INSTANCE_NAME;
  }

  private async send(endpoint: string, body: Record<string, unknown>, label: string, instanceName?: string): Promise<void> {
    const instance = this.resolveInstance(instanceName);
    const url = `${this.baseUrl}/${endpoint}/${instance}`;
    try {
      await axios.post(url, body, { headers: this.headers });
      logger.info(`${label} sent to ${body.number}`);
    } catch (error) {
      logger.error(`Failed to send ${label}: ${error}`);
      throw error;
    }
  }

  async sendText(remoteJid: string, text: string, instanceName?: string): Promise<void> {
    await this.send('message/sendText', { number: remoteJid, text, delay: 1200 }, 'Text', instanceName);
  }

  async sendAudio(remoteJid: string, audioBase64: string, instanceName?: string): Promise<void> {
    await this.send(
      'message/sendWhatsAppAudio',
      { number: remoteJid, audio: audioBase64, encoding: true, delay: 1200 },
      'Audio',
      instanceName,
    );
  }

  async sendMedia(remoteJid: string, mediaUrl: string, mediaType: string, instanceName?: string): Promise<void> {
    await this.send(
      'message/sendMedia',
      { number: remoteJid, mediatype: mediaType, media: mediaUrl },
      `Media (${mediaType})`,
      instanceName,
    );
  }

  async findChats(instanceName?: string): Promise<unknown[]> {
    const instance = this.resolveInstance(instanceName);
    const url = `${this.baseUrl}/chat/findChats/${instance}`;
    const { data } = await axios.post(url, {}, { headers: this.headers });
    return data;
  }

  async findMessages(remoteJid: string, page = 1, limit = 50, instanceName?: string): Promise<{ records: unknown[]; total: number; pages: number }> {
    const instance = this.resolveInstance(instanceName);
    const url = `${this.baseUrl}/chat/findMessages/${instance}`;
    const { data } = await axios.post(
      url,
      { where: { key: { remoteJid } }, page, limit },
      { headers: this.headers },
    );
    const msgs = data?.messages ?? data;
    return {
      records: msgs?.records ?? [],
      total: msgs?.total ?? 0,
      pages: msgs?.pages ?? 1,
    };
  }

  async findContacts(id?: string, instanceName?: string): Promise<unknown[]> {
    const instance = this.resolveInstance(instanceName);
    const url = `${this.baseUrl}/chat/findContacts/${instance}`;
    const body = id ? { where: { id } } : {};
    const { data } = await axios.post(url, body, { headers: this.headers });
    return data;
  }
}
