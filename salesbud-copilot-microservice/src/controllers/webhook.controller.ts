import type { Request, Response } from 'express';
import { container } from 'tsyringe';
import { SellerService } from '../services/seller.service.js';
import { LeadService } from '../services/lead.service.js';
import { TranscriptionService } from '../services/transcription.service.js';
import { MessageBufferService } from '../services/message-buffer.service.js';
import { logger } from '../config/logger.js';
import { param } from '../utils/catch-async.js';
import type { EvolutionPayload } from '../validations/webhook.validation.js';

export const webhookController = {
  async handle(req: Request, res: Response) {
    const sellerId = param(req, 'sellerId');
    const payload = req.body as EvolutionPayload;

    logger.info({ payload: JSON.stringify(payload).slice(0, 500) }, `Webhook received for seller=${sellerId}`);

    const { data } = payload;

    if (!data?.key?.remoteJid) {
      res.json({ status: 'ignored' });
      return;
    }

    // When the real seller sends a message, pause the agent for 2 hours
    if (data.key.fromMe) {
      const messageBufferService = container.resolve(MessageBufferService);
      await messageBufferService.pauseAgent(sellerId, data.key.remoteJid);
      res.json({ status: 'agent_paused' });
      return;
    }

    const sellerService = container.resolve(SellerService);
    const leadService = container.resolve(LeadService);
    const transcriptionService = container.resolve(TranscriptionService);
    const messageBufferService = container.resolve(MessageBufferService);

    const seller = await sellerService.findOne(sellerId);

    if (!seller.isActive) {
      res.json({ status: 'copilot_disabled' });
      return;
    }

    const { remoteJid } = data.key;

    let text: string | null = null;

    switch (data.messageType) {
      case 'conversation':
        text = data.message?.conversation || null;
        break;
      case 'extendedTextMessage':
        text = data.message?.extendedTextMessage?.text || null;
        break;
      case 'audioMessage':
        if (data.message?.audioMessage?.url) {
          text = await transcriptionService.transcribeAudio(data.message.audioMessage.url);
        }
        break;
      case 'imageMessage':
        if (data.message?.imageMessage?.url) {
          const description = await transcriptionService.describeImage(
            data.message.imageMessage.url,
          );
          const caption = data.message.imageMessage.caption;
          text = caption
            ? `${caption}\n[Imagem: ${description}]`
            : `[Imagem: ${description}]`;
        }
        break;
      default:
        logger.warn(`Unhandled message type: ${data.messageType}`);
        res.json({ status: 'unsupported_type' });
        return;
    }

    if (!text) {
      res.json({ status: 'no_text' });
      return;
    }

    await leadService.upsertByRemoteJid(sellerId, remoteJid, data.pushName);
    await messageBufferService.addMessage(sellerId, remoteJid, text);

    logger.info(`Message buffered for seller=${sellerId} jid=${remoteJid}`);
    res.json({ status: 'buffered' });
  },
};
