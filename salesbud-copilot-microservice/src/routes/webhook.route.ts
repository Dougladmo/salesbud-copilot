import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller.js';
import { uuidParam } from '../middlewares/uuid-param.js';
import { catchAsync } from '../utils/catch-async.js';

const router = Router();

router.post('/:sellerId', uuidParam('sellerId'), catchAsync(webhookController.handle));

export { router as webhookRoutes };
