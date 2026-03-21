import type { Request, Response } from 'express';
import { container } from 'tsyringe';
import { LeadService } from '../services/lead.service.js';
import { param } from '../utils/catch-async.js';

export const leadController = {
  async create(req: Request, res: Response) {
    const service = container.resolve(LeadService);
    const lead = await service.create(req.body);
    res.status(201).json(lead);
  },

  async findAll(_req: Request, res: Response) {
    const service = container.resolve(LeadService);
    const leads = await service.findAll();
    res.json(leads);
  },

  async findBySeller(req: Request, res: Response) {
    const service = container.resolve(LeadService);
    const leads = await service.findBySeller(param(req, 'sellerId'));
    res.json(leads);
  },

  async findOne(req: Request, res: Response) {
    const service = container.resolve(LeadService);
    const lead = await service.findOne(param(req, 'id'));
    res.json(lead);
  },

  async findByJid(req: Request, res: Response) {
    const service = container.resolve(LeadService);
    const sellerId = param(req, 'sellerId');
    const remoteJid = decodeURIComponent(param(req, 'remoteJid'));
    const lead = await service.findBySellerAndJid(sellerId, remoteJid);
    if (!lead) {
      res.json(null);
      return;
    }
    res.json(lead);
  },

  async update(req: Request, res: Response) {
    const service = container.resolve(LeadService);
    const lead = await service.update(param(req, 'id'), req.body);
    res.json(lead);
  },

  async remove(req: Request, res: Response) {
    const service = container.resolve(LeadService);
    await service.remove(param(req, 'id'));
    res.status(204).send();
  },
};
