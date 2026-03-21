import { injectable, inject } from 'tsyringe';
import { AppDataSource } from '../config/database.js';
import { Seller } from '../models/seller.model.js';
import { NotFoundError } from '../utils/app-error.js';
import { EvolutionService, sanitizeInstanceName } from './evolution.service.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import type { CreateSellerInput, UpdateSellerInput } from '../validations/seller.validation.js';
import type { DeepPartial } from 'typeorm';

@injectable()
export class SellerService {
  private readonly repo = AppDataSource.getRepository(Seller);

  constructor(@inject(EvolutionService) private readonly evolutionService: EvolutionService) {}

  async create(data: CreateSellerInput): Promise<Seller> {
    const seller = this.repo.create(data as DeepPartial<Seller>);
    const saved = await this.repo.save(seller);

    try {
      const instanceName = `${sanitizeInstanceName(saved.name)}-${saved.id.slice(0, 6)}`;
      await this.evolutionService.createInstance(instanceName);

      const webhookUrl = `${env.WEBHOOK_BASE_URL}/webhook/${saved.id}`;
      await this.evolutionService.setWebhook(instanceName, webhookUrl);

      saved.evolutionInstanceName = instanceName;
      await this.repo.save(saved);
    } catch (error) {
      logger.error(`Failed to create Evolution instance for seller ${saved.id}: ${error}`);
    }

    return this.findOne(saved.id);
  }

  findAll(): Promise<Seller[]> {
    return this.repo.find({ relations: ['company'] });
  }

  async findOne(id: string): Promise<Seller> {
    const seller = await this.repo.findOne({
      where: { id },
      relations: ['company'],
    });
    if (!seller) throw new NotFoundError(`Seller ${id} not found`);
    return seller;
  }

  async update(id: string, data: UpdateSellerInput): Promise<Seller> {
    const seller = await this.findOne(id);
    Object.assign(seller, data);
    return this.repo.save(seller);
  }

  async findByClerkUserId(clerkUserId: string): Promise<Seller | null> {
    return this.repo.findOne({
      where: { clerkUserId },
      relations: ['company'],
    });
  }

  async remove(id: string): Promise<void> {
    const seller = await this.findOne(id);
    if (seller.evolutionInstanceName) {
      await this.evolutionService.deleteInstance(seller.evolutionInstanceName);
    }
    await this.repo.remove(seller);
  }
}
