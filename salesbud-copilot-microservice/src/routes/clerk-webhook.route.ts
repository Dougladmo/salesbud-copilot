import { Router, raw } from 'express';
import { verifyWebhook } from '@clerk/express/webhooks';
import { container } from 'tsyringe';
import { SellerService } from '../services/seller.service.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import type { DeepPartial } from 'typeorm';

const router = Router();

router.post(
  '/',
  raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const evt = await verifyWebhook(req, {
        signingSecret: env.CLERK_WEBHOOK_SIGNING_SECRET,
      });

      if (evt.type === 'user.created') {
        const { id, first_name, last_name, email_addresses } = evt.data;
        const name = [first_name, last_name].filter(Boolean).join(' ') || 'Novo Vendedor';
        const email = email_addresses?.[0]?.email_address;

        const sellerService = container.resolve(SellerService);

        const existing = await sellerService.findByClerkUserId(id);
        if (existing) {
          logger.info({ clerkUserId: id }, 'Seller already exists for Clerk user');
          res.json({ success: true });
          return;
        }

        await sellerService.create({
          companyId: env.DEFAULT_COMPANY_ID,
          name,
          agentName: name,
          clerkUserId: id,
        });

        logger.info({ clerkUserId: id, name, email }, 'Seller created from Clerk webhook');
      }

      res.json({ success: true });
    } catch (err) {
      logger.error({ err }, 'Clerk webhook verification failed');
      res.status(400).json({ message: 'Webhook verification failed' });
    }
  },
);

export { router as clerkWebhookRoutes };
