import { Router } from 'express';
import { companyRoutes } from './company.route.js';
import { sellerRoutes } from './seller.route.js';
import { leadRoutes } from './lead.route.js';
import { ragRoutes } from './rag.route.js';
import { webhookRoutes } from './webhook.route.js';
import { leadController } from '../controllers/lead.controller.js';
import { uuidParam } from '../middlewares/uuid-param.js';
import { catchAsync } from '../utils/catch-async.js';

const router = Router();

router.use('/companies', companyRoutes);
router.use('/sellers', sellerRoutes);
router.use('/leads', leadRoutes);
router.use('/', ragRoutes);
router.use('/webhook', webhookRoutes);

router.get('/sellers/:sellerId/leads', uuidParam('sellerId'), catchAsync(leadController.findBySeller));

export { router as apiRouter };
