import type { Request, Response } from 'express';
import { container } from 'tsyringe';
import { WhatsappService } from '../services/whatsapp.service.js';
import { param } from '../utils/catch-async.js';

export const chatController = {
  async findChats(_req: Request, res: Response) {
    const service = container.resolve(WhatsappService);
    const chats = await service.findChats();
    res.json(chats);
  },

  async findMessages(req: Request, res: Response) {
    const remoteJid = param(req, 'remoteJid');
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const service = container.resolve(WhatsappService);
    const result = await service.findMessages(remoteJid, page, limit);
    res.json(result);
  },

  async findContacts(_req: Request, res: Response) {
    const service = container.resolve(WhatsappService);
    const contacts = await service.findContacts();
    res.json(contacts);
  },

  async sendMessage(req: Request, res: Response) {
    const remoteJid = param(req, 'remoteJid');
    const { text } = req.body;
    const service = container.resolve(WhatsappService);
    await service.sendText(remoteJid, text);
    res.json({ status: 'sent' });
  },
};
