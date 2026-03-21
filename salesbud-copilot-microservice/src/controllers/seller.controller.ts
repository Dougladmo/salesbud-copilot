import type { Request, Response } from 'express';
import { container } from 'tsyringe';
import { SellerService } from '../services/seller.service.js';
import { param } from '../utils/catch-async.js';

export const sellerController = {
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
};
