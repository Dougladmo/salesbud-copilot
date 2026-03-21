import { Router } from 'express';
import { sellerController } from '../controllers/seller.controller.js';
import { createSellerSchema, updateSellerSchema } from '../validations/seller.validation.js';
import { validate } from '../middlewares/validate.js';
import { uuidParam } from '../middlewares/uuid-param.js';
import { catchAsync } from '../utils/catch-async.js';

const router = Router();

router.post('/', validate(createSellerSchema), catchAsync(sellerController.create));
router.get('/', catchAsync(sellerController.findAll));
router.get('/:id', uuidParam('id'), catchAsync(sellerController.findOne));
router.patch('/:id', uuidParam('id'), validate(updateSellerSchema), catchAsync(sellerController.update));
router.delete('/:id', uuidParam('id'), catchAsync(sellerController.remove));
router.get('/:id/qrcode', uuidParam('id'), catchAsync(sellerController.getQrCode));
router.get('/:id/connection-state', uuidParam('id'), catchAsync(sellerController.getConnectionState));

export { router as sellerRoutes };
