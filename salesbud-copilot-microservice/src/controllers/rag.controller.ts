import type { Request, Response } from 'express';
import { container } from 'tsyringe';
import { randomUUID } from 'crypto';
import { RagService } from '../services/rag.service.js';
import { SellerService } from '../services/seller.service.js';
import { CompanyService } from '../services/company.service.js';
import { param } from '../utils/catch-async.js';

function generateNamespace(prefix: string, name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${prefix}-${slug}-${Date.now().toString(36)}`;
}

export const ragController = {
  async uploadSellerDocument(req: Request, res: Response) {
    const ragService = container.resolve(RagService);
    const sellerService = container.resolve(SellerService);

    const seller = await sellerService.findOne(param(req, 'sellerId'));
    let namespace = seller.pineconeNamespace;

    if (!namespace) {
      namespace = generateNamespace('seller', seller.name);
      await sellerService.update(seller.id, { pineconeNamespace: namespace });
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

  async listSellerDocuments(req: Request, res: Response) {
    const ragService = container.resolve(RagService);
    const sellerService = container.resolve(SellerService);

    const seller = await sellerService.findOne(param(req, 'sellerId'));
    if (!seller.pineconeNamespace) {
      res.json([]);
      return;
    }

    const docs = await ragService.listDocuments(seller.pineconeNamespace);
    res.json(docs);
  },

  async listCompanyDocuments(req: Request, res: Response) {
    const ragService = container.resolve(RagService);
    const companyService = container.resolve(CompanyService);

    const company = await companyService.findOne(param(req, 'companyId'));
    const docs = await ragService.listDocuments(company.pineconeNamespace);
    res.json(docs);
  },

  async deleteSellerDocument(req: Request, res: Response) {
    const ragService = container.resolve(RagService);
    const sellerService = container.resolve(SellerService);

    const seller = await sellerService.findOne(param(req, 'sellerId'));
    if (!seller.pineconeNamespace) {
      res.status(400).json({ error: 'Seller has no pinecone namespace configured' });
      return;
    }

    await ragService.deleteDocument(seller.pineconeNamespace, param(req, 'documentId'));
    res.status(204).send();
  },

  async deleteCompanyDocument(req: Request, res: Response) {
    const ragService = container.resolve(RagService);
    const companyService = container.resolve(CompanyService);

    const company = await companyService.findOne(param(req, 'companyId'));
    await ragService.deleteDocument(company.pineconeNamespace, param(req, 'documentId'));
    res.status(204).send();
  },
};
