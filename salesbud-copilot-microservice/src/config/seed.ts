import axios from 'axios';
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
  let seller = await sellerRepo.findOne({
    where: { clerkUserId: env.SEED_SELLER_CLERK_USER_ID },
  });

  if (seller) {
    logger.info(`Seed already applied — seller "${seller.name}" (${seller.id})`);
  } else {
    seller = sellerRepo.create({
      name: 'Douglas Moura',
      agentName: 'Douglas',
      companyId: company.id,
      clerkUserId: env.SEED_SELLER_CLERK_USER_ID,
      evolutionInstanceName: env.EVOLUTION_INSTANCE_NAME,
      pineconeNamespace: 'seller-douglas-moura-mmy62yda',
    });
    seller = await sellerRepo.save(seller);
    logger.info(`Seeded seller: ${seller.name} (${seller.id})`);
  }

  // Seed admin user (for managing company knowledge base)
  if (env.SEED_ADMIN_CLERK_USER_ID) {
    const existingAdmin = await sellerRepo.findOne({
      where: { clerkUserId: env.SEED_ADMIN_CLERK_USER_ID },
    });

    if (!existingAdmin) {
      const admin = sellerRepo.create({
        name: 'Douglas Moura (Admin)',
        agentName: 'Admin',
        companyId: company.id,
        clerkUserId: env.SEED_ADMIN_CLERK_USER_ID,
        isActive: false,
      });
      await sellerRepo.save(admin);
      logger.info(`Seeded admin seller: ${admin.name} (${admin.id})`);
    }
  }

  // Auto-configure Evolution webhook to point to current WEBHOOK_BASE_URL
  await configureWebhook(seller);
}

async function configureWebhook(seller: Seller): Promise<void> {
  const instanceName = seller.evolutionInstanceName;
  if (!instanceName) return;

  const webhookUrl = `${env.WEBHOOK_BASE_URL}/webhook/${seller.id}`;

  try {
    await axios.post(
      `${env.EVOLUTION_API_URL}/webhook/set/${instanceName}`,
      {
        enabled: true,
        url: webhookUrl,
        webhookByEvents: true,
        webhookBase64: false,
        events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          apikey: env.EVOLUTION_API_KEY,
        },
      },
    );
    logger.info(`Webhook configured: ${webhookUrl}`);
  } catch (error) {
    logger.error(`Failed to configure webhook: ${error}`);
  }
}
