import { DataSource } from 'typeorm';
import { env } from './env.js';
import { Company } from '../models/company.model.js';
import { Seller } from '../models/seller.model.js';
import { Lead } from '../models/lead.model.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: env.DATABASE_URL,
  entities: [Company, Seller, Lead],
  synchronize: true,
});
