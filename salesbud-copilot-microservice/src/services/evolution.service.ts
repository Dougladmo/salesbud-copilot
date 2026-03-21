import { injectable } from 'tsyringe';
import axios from 'axios';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export function sanitizeInstanceName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

@injectable()
export class EvolutionService {
  private get baseUrl() {
    return env.EVOLUTION_API_URL;
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      apikey: env.EVOLUTION_API_KEY,
    };
  }

  async createInstance(instanceName: string): Promise<{ qrcode?: { base64?: string; pairingCode?: string } }> {
    const url = `${this.baseUrl}/instance/create`;
    try {
      const { data } = await axios.post(
        url,
        {
          instanceName,
          integration: 'WHATSAPP-BAILEYS',
          qrcode: true,
          rejectCall: false,
          groupsIgnore: true,
          alwaysOnline: true,
          readMessages: true,
          readStatus: true,
          syncFullHistory: false,
        },
        { headers: this.headers },
      );
      logger.info(`Evolution instance created: ${instanceName}`);
      return data;
    } catch (error) {
      logger.error(`Failed to create Evolution instance ${instanceName}: ${error}`);
      throw error;
    }
  }

  async setWebhook(instanceName: string, webhookUrl: string): Promise<void> {
    const url = `${this.baseUrl}/webhook/set/${instanceName}`;
    try {
      await axios.post(
        url,
        {
          enabled: true,
          url: webhookUrl,
          webhookByEvents: true,
          webhookBase64: false,
          events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
        },
        { headers: this.headers },
      );
      logger.info(`Webhook set for instance ${instanceName}: ${webhookUrl}`);
    } catch (error) {
      logger.error(`Failed to set webhook for ${instanceName}: ${error}`);
      throw error;
    }
  }

  async getQrCode(instanceName: string): Promise<{ pairingCode?: string; code?: string; base64?: string }> {
    const url = `${this.baseUrl}/instance/connect/${instanceName}`;
    try {
      const { data } = await axios.get(url, { headers: this.headers });
      return data;
    } catch (error) {
      logger.error(`Failed to get QR code for ${instanceName}: ${error}`);
      throw error;
    }
  }

  async getConnectionState(instanceName: string): Promise<{ instance: string; state: string }> {
    const url = `${this.baseUrl}/instance/connectionState/${instanceName}`;
    try {
      const { data } = await axios.get(url, { headers: this.headers });
      return data;
    } catch (error) {
      logger.error(`Failed to get connection state for ${instanceName}: ${error}`);
      throw error;
    }
  }

  async deleteInstance(instanceName: string): Promise<void> {
    const url = `${this.baseUrl}/instance/delete/${instanceName}`;
    try {
      await axios.delete(url, { headers: this.headers });
      logger.info(`Evolution instance deleted: ${instanceName}`);
    } catch (error) {
      logger.error(`Failed to delete Evolution instance ${instanceName}: ${error}`);
    }
  }
}
