import { AppDataSource } from './database.js';
import { env } from './env.js';
import { logger } from './logger.js';
import { Company } from '../models/company.model.js';
import { Seller } from '../models/seller.model.js';
import { container } from 'tsyringe';
import { EvolutionService } from '../services/evolution.service.js';

const SEED_COMPANY = {
  name: 'SalesBud Demo',
  pineconeNamespace: 'salesbud-demo',
};

const SEED_SELLER = {
  name: 'Ana Silva',
  agentName: 'Ana',
  evolutionInstance: 'vendedor',
  traitFormality: 'informal' as const,
  traitHumor: 'humorous' as const,
  traitCommunication: 'direct' as const,
  traitEmpathy: 'empathetic' as const,
  traitSelling: 'consultive' as const,
};

export async function seedDatabase(): Promise<void> {
  const companyRepo = AppDataSource.getRepository(Company);
  const sellerRepo = AppDataSource.getRepository(Seller);

  const existingSeller = await sellerRepo.findOne({
    where: { evolutionInstance: SEED_SELLER.evolutionInstance },
  });

  if (existingSeller) {
    logger.info(`Seed already applied — seller "${existingSeller.name}" (${existingSeller.id})`);
    return;
  }

  let company = await companyRepo.findOne({
    where: { name: SEED_COMPANY.name },
  });

  if (!company) {
    company = companyRepo.create(SEED_COMPANY);
    company = await companyRepo.save(company);
    logger.info(`Seeded company: ${company.name} (${company.id})`);
  }

  const seller = sellerRepo.create({
    ...SEED_SELLER,
    companyId: company.id,
  });
  const saved = await sellerRepo.save(seller);

  const evolutionService = container.resolve(EvolutionService);
  const baseUrl = env.WEBHOOK_BASE_URL || `http://localhost:${env.PORT}`;

  try {
    await evolutionService.createInstance(
      SEED_SELLER.evolutionInstance,
      `${baseUrl}/webhook/${saved.id}`,
    );
    logger.info(`Evolution instance created for seed seller`);
  } catch (error) {
    logger.warn(`Evolution instance creation failed (may already exist) — continuing`);
  }

  logger.info(`Seeded seller: ${saved.name} (${saved.id})`);
  logger.info(`Webhook URL: ${baseUrl}/webhook/${saved.id}`);
}
