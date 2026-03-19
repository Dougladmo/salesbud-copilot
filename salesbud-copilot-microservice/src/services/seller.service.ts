import { injectable } from 'tsyringe';
import { AppDataSource } from '../config/database.js';
import { Seller } from '../models/seller.model.js';
import { NotFoundError } from '../utils/app-error.js';
import type { CreateSellerInput, UpdateSellerInput } from '../validations/seller.validation.js';
import type { DeepPartial } from 'typeorm';

@injectable()
export class SellerService {
  private readonly repo = AppDataSource.getRepository(Seller);

  async create(data: CreateSellerInput): Promise<Seller> {
    const seller = this.repo.create(data as DeepPartial<Seller>);
    const saved = await this.repo.save(seller);
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

  async remove(id: string): Promise<void> {
    const seller = await this.findOne(id);
    await this.repo.remove(seller);
  }
}
