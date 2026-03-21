import { Router } from 'express';
import { getAuth } from '@clerk/express';
import { container } from 'tsyringe';
import { SellerService } from '../services/seller.service.js';
import { catchAsync } from '../utils/catch-async.js';
import { requireApiAuth } from '../middlewares/require-api-auth.js';

const router = Router();

router.get(
  '/',
  requireApiAuth,
  catchAsync(async (req, res) => {
    const { userId } = getAuth(req);
    const sellerService = container.resolve(SellerService);
    const seller = await sellerService.findByClerkUserId(userId!);

    if (!seller) {
      res.status(404).json({ message: 'No seller linked to this account' });
      return;
    }

    res.json(seller);
  }),
);

export { router as meRoutes };
