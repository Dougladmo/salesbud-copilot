import type { Request, Response } from 'express';
import { container } from 'tsyringe';
import { randomUUID } from 'crypto';
import { RagService } from '../services/rag.service.js';
import { SellerService } from '../services/seller.service.js';
import { CompanyService } from '../services/company.service.js';
import { param } from '../utils/catch-async.js';

export const ragController = {
  async uploadSellerDocument(req: Request, res: Response) {
    const ragService = container.resolve(RagService);
    const sellerService = container.resolve(SellerService);

    const seller = await sellerService.findOne(param(req, 'sellerId'));
    const namespace = seller.pineconeNamespace;

    if (!namespace) {
      res.status(400).json({ error: 'Seller has no pinecone namespace configured' });
      return;
    }

    const docId = randomUUID();
    await ragService.upsertDocument(namespace, docId, req.body.text, req.body.metadata || {});

    res.status(201).json({ id: docId, namespace, status: 'uploaded' });
  },

  async uploadCompanyDocument(req: Request, res: Response) {
    const ragService = container.resolve(RagService);
    const companyService = container.resolve(CompanyService);

    const company = await companyService.findOne(param(req, 'companyId'));
    const docId = randomUUID();

    await ragService.upsertDocument(
      company.pineconeNamespace,
      docId,
      req.body.text,
      req.body.metadata || {},
    );

    res.status(201).json({ id: docId, namespace: company.pineconeNamespace, status: 'uploaded' });
  },
};
