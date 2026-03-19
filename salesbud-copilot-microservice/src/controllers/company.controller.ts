import type { Request, Response } from 'express';
import { container } from 'tsyringe';
import { CompanyService } from '../services/company.service.js';
import { param } from '../utils/catch-async.js';

export const companyController = {
  async create(req: Request, res: Response) {
    const service = container.resolve(CompanyService);
    const company = await service.create(req.body);
    res.status(201).json(company);
  },

  async findAll(_req: Request, res: Response) {
    const service = container.resolve(CompanyService);
    const companies = await service.findAll();
    res.json(companies);
  },

  async findOne(req: Request, res: Response) {
    const service = container.resolve(CompanyService);
    const company = await service.findOne(param(req, 'id'));
    res.json(company);
  },

  async update(req: Request, res: Response) {
    const service = container.resolve(CompanyService);
    const company = await service.update(param(req, 'id'), req.body);
    res.json(company);
  },

  async remove(req: Request, res: Response) {
    const service = container.resolve(CompanyService);
    await service.remove(param(req, 'id'));
    res.status(204).send();
  },
};
