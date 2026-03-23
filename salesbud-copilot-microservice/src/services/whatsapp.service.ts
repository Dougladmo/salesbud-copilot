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

    // Fetch outgoing messages (stored with @s.whatsapp.net)
    const { data } = await axios.post(
      url,
      { where: { key: { remoteJid } }, page, limit },
      { headers: this.headers },
    );

    const raw = data?.messages ?? data;
    const outgoing = Array.isArray(raw?.records ?? raw) ? (raw?.records ?? raw) as unknown[] : [];

    // WhatsApp privacy: received messages may be stored under a @lid JID.
    // Discover the @lid JID from the remoteJidAlt field of any received message,
    // or from outgoing messages that reference a @lid remoteJidAlt.
    let lidJid: string | null = null;
    for (const m of outgoing) {
      const key = (m as Record<string, Record<string, unknown>>)?.key;
      const alt = key?.remoteJidAlt as string | undefined;
      if (alt && typeof alt === 'string' && alt.endsWith('@lid')) {
        lidJid = alt;
        break;
      }
    }

    // If no @lid found from outgoing, query a small batch of received messages
    // filtered by remoteJidAlt matching our @s.whatsapp.net JID
    if (!lidJid) {
      try {
        const probe = await axios.post(
          url,
          { where: { key: { remoteJidAlt: remoteJid, fromMe: false } }, page: 1, limit: 1 },
          { headers: this.headers },
        );
        const probeRaw = probe.data?.messages ?? probe.data;
        const probeRecords = Array.isArray(probeRaw?.records ?? probeRaw) ? (probeRaw?.records ?? probeRaw) as unknown[] : [];
        if (probeRecords.length > 0) {
          lidJid = ((probeRecords[0] as Record<string, Record<string, unknown>>)?.key?.remoteJid as string) ?? null;
        }
      } catch {
        // remoteJidAlt filter may not be supported — ignore
      }
    }

    // Fetch incoming messages stored under the @lid JID
    let incoming: unknown[] = [];
    if (lidJid && lidJid !== remoteJid) {
      try {
        const { data: lidData } = await axios.post(
          url,
          { where: { key: { remoteJid: lidJid } }, page, limit },
          { headers: this.headers },
        );
        const lidRaw = lidData?.messages ?? lidData;
        incoming = Array.isArray(lidRaw?.records ?? lidRaw) ? (lidRaw?.records ?? lidRaw) as unknown[] : [];
      } catch {
        // If @lid query fails, continue with outgoing only
      }
    }

    // Merge and deduplicate
    const merged = [...outgoing, ...incoming];
    const seen = new Set<string>();
    const records = merged.filter((m) => {
      const id = (m as Record<string, Record<string, unknown>>)?.key?.id as string;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    // Normalize @lid remoteJid back to @s.whatsapp.net so frontend renders correctly
    for (const m of records) {
      const key = (m as Record<string, Record<string, unknown>>)?.key;
      if (key && typeof key.remoteJid === 'string' && (key.remoteJid as string).endsWith('@lid')) {
        key.remoteJid = remoteJid;
      }
    }

    return {
      records,
      total: records.length,
      pages: 1,
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
