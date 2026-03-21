import { AppDataSource } from './database.js';
import { env } from './env.js';
import { logger } from './logger.js';
import { Company } from '../models/company.model.js';
import { Seller } from '../models/seller.model.js';

export async function seedDatabase(): Promise<void> {
  const companyRepo = AppDataSource.getRepository(Company);
  const sellerRepo = AppDataSource.getRepository(Seller);

  // Fixed company (matches Clerk org)
  let company = await companyRepo.findOne({
    where: { id: env.DEFAULT_COMPANY_ID },
  });

  if (!company) {
    company = companyRepo.create({
      id: env.DEFAULT_COMPANY_ID,
      name: 'SalesBud Demo',
      pineconeNamespace: 'salesbud-demo',
    });
    company = await companyRepo.save(company);
    logger.info(`Seeded company: ${company.name} (${company.id})`);
  }

  // Fixed seller (matches Clerk org member with admin role)
  const existingSeller = await sellerRepo.findOne({
    where: { clerkUserId: env.SEED_SELLER_CLERK_USER_ID },
  });

  if (existingSeller) {
    logger.info(`Seed already applied — seller "${existingSeller.name}" (${existingSeller.id})`);
    return;
  }

  const seller = sellerRepo.create({
    name: 'Douglas Moura',
    agentName: 'Douglas',
    companyId: company.id,
    clerkUserId: env.SEED_SELLER_CLERK_USER_ID,
    evolutionInstanceName: env.EVOLUTION_INSTANCE_NAME,
    pineconeNamespace: 'seller-douglas-moura-mmy62yda',
  });
  const saved = await sellerRepo.save(seller);

  logger.info(`Seeded seller: ${saved.name} (${saved.id})`);
  logger.info(`Evolution instance: ${saved.evolutionInstanceName}`);
  logger.info(`Pinecone namespace: ${saved.pineconeNamespace}`);
}
