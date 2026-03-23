import type { Request, Response } from 'express';
import { container } from 'tsyringe';
import { SellerService } from '../services/seller.service.js';
import { LeadService } from '../services/lead.service.js';
import { TranscriptionService } from '../services/transcription.service.js';
import { EvolutionService } from '../services/evolution.service.js';
import { MessageBufferService } from '../services/message-buffer.service.js';
import { logger } from '../config/logger.js';
import { param } from '../utils/catch-async.js';
import type { EvolutionPayload } from '../validations/webhook.validation.js';

export const webhookController = {
  async handle(req: Request, res: Response) {
    const sellerId = param(req, 'sellerId');
    const payload = req.body as EvolutionPayload;
    const instanceName = (payload as any).instance as string | undefined;

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
    const evolutionService = container.resolve(EvolutionService);
    const messageBufferService = container.resolve(MessageBufferService);

    const seller = await sellerService.findOne(sellerId);

    if (!seller.isActive) {
      res.json({ status: 'copilot_disabled' });
      return;
    }

    const { remoteJid } = data.key;
    const evInstanceName = seller.evolutionInstanceName || instanceName;

    let text: string | null = null;

    switch (data.messageType) {
      case 'conversation':
        text = data.message?.conversation || null;
        break;
      case 'extendedTextMessage':
        text = data.message?.extendedTextMessage?.text || null;
        break;
      case 'audioMessage': {
        try {
          const audio = data.message?.audioMessage;
          let base64 = audio?.base64;
          if (!base64 && evInstanceName) {
            base64 = await evolutionService.getBase64FromMedia(evInstanceName, {
              id: data.key.id,
              remoteJid: data.key.remoteJid,
              fromMe: data.key.fromMe,
            });
          }
          if (base64) {
            text = await transcriptionService.transcribeAudio(base64, audio?.mimetype);
          }
        } catch (error: any) {
          logger.error(`Failed to process audio: ${error.message}`);
        }
        break;
      }
      case 'imageMessage': {
        try {
          const img = data.message?.imageMessage;
          let base64 = img?.base64;
          if (!base64 && evInstanceName) {
            base64 = await evolutionService.getBase64FromMedia(evInstanceName, {
              id: data.key.id,
              remoteJid: data.key.remoteJid,
              fromMe: data.key.fromMe,
            });
          }
          if (base64) {
            const description = await transcriptionService.describeImage(base64, img?.mimetype);
            text = img?.caption
              ? `${img.caption}\n[Imagem: ${description}]`
              : `[Imagem: ${description}]`;
          }
        } catch (error: any) {
          logger.error(`Failed to process image: ${error.message}`);
        }
        break;
      }
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
