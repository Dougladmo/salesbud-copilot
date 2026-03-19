import { injectable } from 'tsyringe';
import axios from 'axios';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

@injectable()
export class EvolutionService {
  private get headers() {
    return {
      'Content-Type': 'application/json',
      apikey: env.EVOLUTION_API_KEY,
    };
  }

  private get baseUrl() {
    return env.EVOLUTION_API_URL;
  }

  async createInstance(instanceName: string, webhookUrl: string): Promise<void> {
    const url = `${this.baseUrl}/instance/create`;
    try {
      await axios.post(
        url,
        {
          instanceName,
          integration: 'WHATSAPP-BAILEYS',
          qrcode: true,
          webhook: {
            url: webhookUrl,
            byEvents: false,
            base64: false,
            events: ['MESSAGES_UPSERT'],
          },
        },
        { headers: this.headers },
      );
      logger.info(`Evolution instance created: ${instanceName}`);
    } catch (error) {
      logger.error(`Failed to create Evolution instance: ${error}`);
      throw new Error('Failed to create WhatsApp instance');
    }
  }

  async deleteInstance(instanceName: string): Promise<void> {
    const url = `${this.baseUrl}/instance/delete/${instanceName}`;
    try {
      await axios.delete(url, { headers: this.headers });
      logger.info(`Evolution instance deleted: ${instanceName}`);
    } catch (error) {
      logger.error(`Failed to delete Evolution instance: ${error}`);
    }
  }

  async getQrCode(instanceName: string): Promise<{ base64: string; code: string } | null> {
    const url = `${this.baseUrl}/instance/connect/${instanceName}`;
    try {
      const { data } = await axios.get(url, { headers: this.headers });
      if (data?.base64) {
        return { base64: data.base64, code: data.code || '' };
      }
      return null;
    } catch (error) {
      logger.error(`Failed to get QR code: ${error}`);
      return null;
    }
  }

  async getConnectionStatus(instanceName: string): Promise<{ connected: boolean; number?: string }> {
    const url = `${this.baseUrl}/instance/connectionState/${instanceName}`;
    try {
      const { data } = await axios.get(url, { headers: this.headers });
      const connected = data?.instance?.state === 'open';
      return { connected, number: data?.instance?.phoneNumber };
    } catch (error) {
      logger.error(`Failed to get connection status: ${error}`);
      return { connected: false };
    }
  }

  async restartInstance(instanceName: string): Promise<void> {
    const url = `${this.baseUrl}/instance/restart/${instanceName}`;
    try {
      await axios.put(url, {}, { headers: this.headers });
      logger.info(`Evolution instance restarted: ${instanceName}`);
    } catch (error) {
      logger.error(`Failed to restart Evolution instance: ${error}`);
    }
  }

  async logoutInstance(instanceName: string): Promise<void> {
    const url = `${this.baseUrl}/instance/logout/${instanceName}`;
    try {
      await axios.delete(url, { headers: this.headers });
      logger.info(`Evolution instance logged out: ${instanceName}`);
    } catch (error) {
      logger.error(`Failed to logout Evolution instance: ${error}`);
    }
  }
}
