import type { Request, Response } from 'express';
import { container } from 'tsyringe';
import { SellerService } from '../services/seller.service.js';
import { param } from '../utils/catch-async.js';

export const sellerController = {
  async create(req: Request, res: Response) {
    const service = container.resolve(SellerService);
    const seller = await service.create(req.body);
    res.status(201).json(seller);
  },

  async findAll(_req: Request, res: Response) {
    const service = container.resolve(SellerService);
    const sellers = await service.findAll();
    res.json(sellers);
  },

  async findOne(req: Request, res: Response) {
    const service = container.resolve(SellerService);
    const seller = await service.findOne(param(req, 'id'));
    res.json(seller);
  },

  async update(req: Request, res: Response) {
    const service = container.resolve(SellerService);
    const seller = await service.update(param(req, 'id'), req.body);
    res.json(seller);
  },

  async remove(req: Request, res: Response) {
    const service = container.resolve(SellerService);
    await service.remove(param(req, 'id'));
    res.status(204).send();
  },

  async qrCode(req: Request, res: Response) {
    const service = container.resolve(SellerService);
    const qr = await service.getQrCode(param(req, 'id'));
    if (!qr) {
      res.json({ status: 'already_connected' });
      return;
    }
    res.json(qr);
  },

  async connectionStatus(req: Request, res: Response) {
    const service = container.resolve(SellerService);
    const status = await service.getConnectionStatus(param(req, 'id'));
    res.json(status);
  },

  async restart(req: Request, res: Response) {
    const service = container.resolve(SellerService);
    await service.restartInstance(param(req, 'id'));
    res.json({ status: 'restarted' });
  },

  async logout(req: Request, res: Response) {
    const service = container.resolve(SellerService);
    await service.logoutInstance(param(req, 'id'));
    res.json({ status: 'disconnected' });
  },
};
