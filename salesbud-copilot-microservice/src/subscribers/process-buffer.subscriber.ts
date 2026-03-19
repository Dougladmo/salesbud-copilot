import { container } from 'tsyringe';
import { logger } from '../config/logger.js';
import { MessageBufferService } from '../services/message-buffer.service.js';
import { AgentService } from '../services/agent.service.js';
import { SellerService } from '../services/seller.service.js';
import { WhatsappService } from '../services/whatsapp.service.js';
import { TtsService } from '../services/tts.service.js';

interface ProcessBufferPayload {
  sellerId: string;
  remoteJid: string;
}

export async function handleProcessBuffer(data: unknown): Promise<void> {
  const { sellerId, remoteJid } = data as ProcessBufferPayload;
  logger.info(`Processing buffer: seller=${sellerId} jid=${remoteJid}`);

  const bufferService = container.resolve(MessageBufferService);
  const agentService = container.resolve(AgentService);
  const sellerService = container.resolve(SellerService);
  const whatsappService = container.resolve(WhatsappService);
  const ttsService = container.resolve(TtsService);

  const paused = await bufferService.isAgentPaused(sellerId, remoteJid);
  if (paused) {
    await bufferService.flushBuffer(sellerId, remoteJid);
    logger.info(`Agent paused (seller takeover), skipping: seller=${sellerId} jid=${remoteJid}`);
    return;
  }

  const messages = await bufferService.flushBuffer(sellerId, remoteJid);
  if (!messages.length) {
    logger.warn('Empty buffer, skipping');
    return;
  }

  const seller = await sellerService.findOne(sellerId);
  const combinedText = messages.join('\n');

  const response = await agentService.processMessage(sellerId, remoteJid, combinedText);

  const urlRegex = /https?:\/\/\S+\.(jpg|jpeg|png|gif|mp4|pdf|doc|docx)/i;
  const urlMatch = response.match(urlRegex);

  if (urlMatch) {
    const url = urlMatch[0];
    const ext = urlMatch[1].toLowerCase();
    let mediaType = 'document';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) mediaType = 'image';
    if (['mp4'].includes(ext)) mediaType = 'video';

    await whatsappService.sendMedia(remoteJid, url, mediaType);
    const textWithoutUrl = response.replace(urlRegex, '').trim();
    if (textWithoutUrl) {
      await whatsappService.sendText(remoteJid, textWithoutUrl);
    }
  } else if (response.length > 500 && seller.voiceId) {
    const cleanResponse = response.replace(/\n---\n/g, '\n\n');
    const audioBase64 = await ttsService.synthesize(cleanResponse, seller.voiceId);
    await whatsappService.sendAudio(remoteJid, audioBase64);
  } else {
    const parts = response.split(/\n---\n/).map((p) => p.trim()).filter(Boolean);
    for (const part of parts) {
      const delay = part.length * 50;
      await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 10000)));
      await whatsappService.sendText(remoteJid, part);
    }
  }

  logger.info(`Response sent: seller=${sellerId} jid=${remoteJid}`);
}
