import { AppDataSource } from './database.js';
import { logger } from './logger.js';
import { Company } from '../models/company.model.js';
import { Seller } from '../models/seller.model.js';

const SEED_COMPANY = {
  name: 'SalesBud Demo',
  pineconeNamespace: 'salesbud-demo',
};

import { TraitFormality, TraitHumor, TraitCommunication, TraitEmpathy, TraitSelling } from '../models/seller.model.js';

const SEED_SELLER = {
  name: 'Douglas Moura',
  agentName: 'Douglas',
  traitFormality: TraitFormality.INFORMAL,
  traitHumor: TraitHumor.HUMOROUS,
  traitCommunication: TraitCommunication.DIRECT,
  traitEmpathy: TraitEmpathy.EMPATHETIC,
  traitSelling: TraitSelling.CONSULTIVE,
};

export async function seedDatabase(): Promise<void> {
  const companyRepo = AppDataSource.getRepository(Company);
  const sellerRepo = AppDataSource.getRepository(Seller);

  const existingSeller = await sellerRepo.findOne({
    where: { name: SEED_SELLER.name },
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

  logger.info(`Seeded seller: ${saved.name} (${saved.id})`);
  logger.info(`Configure webhook in Evolution API to: POST /webhook/${saved.id}`);
}
