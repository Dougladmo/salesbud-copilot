import { Router } from 'express';
import { companyRoutes } from './company.route.js';
import { sellerRoutes } from './seller.route.js';
import { leadRoutes } from './lead.route.js';
import { ragRoutes } from './rag.route.js';
import { chatRoutes } from './chat.route.js';
import { leadController } from '../controllers/lead.controller.js';
import { uuidParam } from '../middlewares/uuid-param.js';
import { catchAsync } from '../utils/catch-async.js';
import { requireApiAuth } from '../middlewares/require-api-auth.js';
import { meRoutes } from './me.route.js';

const router = Router();

router.use('/me', meRoutes);
router.use('/companies', requireApiAuth, companyRoutes);
router.use('/sellers', requireApiAuth, sellerRoutes);
router.use('/leads', requireApiAuth, leadRoutes);
router.use('/', requireApiAuth, ragRoutes);
router.use('/chat', requireApiAuth, chatRoutes);

router.get('/sellers/:sellerId/leads', requireApiAuth, uuidParam('sellerId'), catchAsync(leadController.findBySeller));
router.get('/sellers/:sellerId/leads/by-jid/:remoteJid', requireApiAuth, uuidParam('sellerId'), catchAsync(leadController.findByJid));

export { router as apiRouter };
