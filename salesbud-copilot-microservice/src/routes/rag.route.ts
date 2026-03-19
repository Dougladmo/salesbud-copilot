import { Router } from 'express';
import { ragController } from '../controllers/rag.controller.js';
import { uploadDocumentSchema } from '../validations/rag.validation.js';
import { validate } from '../middlewares/validate.js';
import { uuidParam } from '../middlewares/uuid-param.js';
import { catchAsync } from '../utils/catch-async.js';

const router = Router();

router.post(
  '/sellers/:sellerId/documents',
  uuidParam('sellerId'),
  validate(uploadDocumentSchema),
  catchAsync(ragController.uploadSellerDocument),
);

router.post(
  '/companies/:companyId/documents',
  uuidParam('companyId'),
  validate(uploadDocumentSchema),
  catchAsync(ragController.uploadCompanyDocument),
);

export { router as ragRoutes };
