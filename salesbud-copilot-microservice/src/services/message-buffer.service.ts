import { injectable } from 'tsyringe';
import { redis } from '../config/redis.js';
import { publishToQueue } from '../config/rabbitmq.js';
import { logger } from '../config/logger.js';

@injectable()
export class MessageBufferService {
  private readonly timers = new Map<string, NodeJS.Timeout>();
  private readonly defaultTimeout = 5000;
  private readonly pauseDurationSeconds = 2 * 60 * 60; // 2 hours

  async pauseAgent(sellerId: string, remoteJid: string): Promise<void> {
    const key = `pause:${sellerId}:${remoteJid}`;
    await redis.set(key, '1', 'EX', this.pauseDurationSeconds);
    logger.info(`Agent paused for 2h: seller=${sellerId} jid=${remoteJid}`);
  }

  async isAgentPaused(sellerId: string, remoteJid: string): Promise<boolean> {
    const key = `pause:${sellerId}:${remoteJid}`;
    const paused = await redis.exists(key);
    return paused === 1;
  }

  async addMessage(
    sellerId: string,
    remoteJid: string,
    text: string,
    timeoutMs?: number,
  ): Promise<void> {
    const key = `buf:${sellerId}:${remoteJid}`;
    const timerKey = `${sellerId}:${remoteJid}`;

    await redis.rpush(key, text);

    const existing = this.timers.get(timerKey);
    if (existing) {
      clearTimeout(existing);
    }

    const timeout = timeoutMs || this.defaultTimeout;
    const timer = setTimeout(() => {
      this.timers.delete(timerKey);
      publishToQueue({ sellerId, remoteJid });
      logger.info(`Buffer timeout fired: seller=${sellerId} jid=${remoteJid}`);
    }, timeout);

    this.timers.set(timerKey, timer);
  }

  async flushBuffer(sellerId: string, remoteJid: string): Promise<string[]> {
    const key = `buf:${sellerId}:${remoteJid}`;
    const messages = await redis.lrange(key, 0, -1);
    await redis.del(key);
    return messages;
  }
}
