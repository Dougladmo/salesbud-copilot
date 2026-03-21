import { Router } from 'express';
import { sellerController } from '../controllers/seller.controller.js';
import { updateSellerSchema } from '../validations/seller.validation.js';
import { validate } from '../middlewares/validate.js';
import { uuidParam } from '../middlewares/uuid-param.js';
import { catchAsync } from '../utils/catch-async.js';

const router = Router();

router.get('/', catchAsync(sellerController.findAll));
router.get('/:id', uuidParam('id'), catchAsync(sellerController.findOne));
router.put('/:id', uuidParam('id'), validate(updateSellerSchema), catchAsync(sellerController.update));

export { router as sellerRoutes };
