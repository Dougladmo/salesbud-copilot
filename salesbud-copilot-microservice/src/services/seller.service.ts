import { injectable, inject } from 'tsyringe';
import { AppDataSource } from '../config/database.js';
import { env } from '../config/env.js';
import { Seller } from '../models/seller.model.js';
import { EvolutionService } from './evolution.service.js';
import { NotFoundError } from '../utils/app-error.js';
import type { CreateSellerInput, UpdateSellerInput } from '../validations/seller.validation.js';
import type { DeepPartial } from 'typeorm';

@injectable()
export class SellerService {
  private readonly repo = AppDataSource.getRepository(Seller);
  private readonly evolutionService: EvolutionService;

  constructor(@inject(EvolutionService) evolutionService: EvolutionService) {
    this.evolutionService = evolutionService;
  }

  async create(data: CreateSellerInput): Promise<Seller> {
    const instanceName = `seller_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const seller = this.repo.create({
      ...data,
      evolutionInstance: instanceName,
    } as DeepPartial<Seller>);
    const saved = await this.repo.save(seller);

    try {
      const baseUrl = process.env.WEBHOOK_BASE_URL || `http://localhost:${env.PORT}`;
      await this.evolutionService.createInstance(instanceName, `${baseUrl}/webhook/${saved.id}`);
    } catch {
      await this.repo.remove(saved);
      throw new Error('Failed to create WhatsApp instance. Seller not created.');
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

  async findByEvolutionInstance(instance: string): Promise<Seller | null> {
    return this.repo.findOne({
      where: { evolutionInstance: instance },
      relations: ['company'],
    });
  }

  async update(id: string, data: UpdateSellerInput): Promise<Seller> {
    const seller = await this.findOne(id);
    Object.assign(seller, data);
    return this.repo.save(seller);
  }

  async remove(id: string): Promise<void> {
    const seller = await this.findOne(id);
    await this.evolutionService.deleteInstance(seller.evolutionInstance);
    await this.repo.remove(seller);
  }

  async getQrCode(id: string) {
    const seller = await this.findOne(id);
    return this.evolutionService.getQrCode(seller.evolutionInstance);
  }

  async getConnectionStatus(id: string) {
    const seller = await this.findOne(id);
    const status = await this.evolutionService.getConnectionStatus(seller.evolutionInstance);

    if (seller.whatsappConnected !== status.connected) {
      seller.whatsappConnected = status.connected;
      await this.repo.save(seller);
    }

    return status;
  }

  async restartInstance(id: string): Promise<void> {
    const seller = await this.findOne(id);
    await this.evolutionService.restartInstance(seller.evolutionInstance);
  }

  async logoutInstance(id: string): Promise<void> {
    const seller = await this.findOne(id);
    await this.evolutionService.logoutInstance(seller.evolutionInstance);
    seller.whatsappConnected = false;
    await this.repo.save(seller);
  }
}
