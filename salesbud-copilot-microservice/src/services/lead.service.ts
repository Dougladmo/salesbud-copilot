import { injectable } from 'tsyringe';
import { AppDataSource } from '../config/database.js';
import { Lead } from '../models/lead.model.js';
import { NotFoundError } from '../utils/app-error.js';
import type { CreateLeadInput, UpdateLeadInput } from '../validations/lead.validation.js';
import type { DeepPartial } from 'typeorm';

@injectable()
export class LeadService {
  private readonly repo = AppDataSource.getRepository(Lead);

  create(data: CreateLeadInput): Promise<Lead> {
    const lead = this.repo.create(data as DeepPartial<Lead>);
    return this.repo.save(lead);
  }

  findAll(): Promise<Lead[]> {
    return this.repo.find();
  }

  findBySeller(sellerId: string): Promise<Lead[]> {
    return this.repo.find({ where: { sellerId } });
  }

  async findOne(id: string): Promise<Lead> {
    const lead = await this.repo.findOne({ where: { id } });
    if (!lead) throw new NotFoundError(`Lead ${id} not found`);
    return lead;
  }

  async upsertByRemoteJid(
    sellerId: string,
    remoteJid: string,
    pushName?: string,
  ): Promise<Lead> {
    let lead = await this.repo.findOne({
      where: { sellerId, remoteJid },
    });

    if (!lead) {
      const phone = remoteJid.replace('@s.whatsapp.net', '');
      lead = this.repo.create({
        sellerId,
        remoteJid,
        name: pushName || null,
        phone,
      });
    }

    lead.lastContactAt = new Date();
    if (pushName && !lead.name) {
      lead.name = pushName;
    }

    return this.repo.save(lead);
  }

  async findBySellerAndJid(sellerId: string, remoteJid: string): Promise<Lead | null> {
    return this.repo.findOne({ where: { sellerId, remoteJid } });
  }

  async update(id: string, data: UpdateLeadInput): Promise<Lead> {
    const lead = await this.findOne(id);
    Object.assign(lead, data);
    return this.repo.save(lead);
  }

  async remove(id: string): Promise<void> {
    const lead = await this.findOne(id);
    await this.repo.remove(lead);
  }
}
