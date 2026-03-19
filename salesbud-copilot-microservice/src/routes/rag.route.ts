import { Router } from 'express';
import { ragController } from '../controllers/rag.controller.js';
import { uploadDocumentSchema } from '../validations/rag.validation.js';
import { validate } from '../middlewares/validate.js';
import { uuidParam } from '../middlewares/uuid-param.js';
import { catchAsync } from '../utils/catch-async.js';

const router = Router();

// Seller documents
router.get(
  '/sellers/:sellerId/documents',
  uuidParam('sellerId'),
  catchAsync(ragController.listSellerDocuments),
);

router.post(
  '/sellers/:sellerId/documents',
  uuidParam('sellerId'),
  validate(uploadDocumentSchema),
  catchAsync(ragController.uploadSellerDocument),
);

router.delete(
  '/sellers/:sellerId/documents/:documentId',
  uuidParam('sellerId'),
  catchAsync(ragController.deleteSellerDocument),
);

// Company documents
router.get(
  '/companies/:companyId/documents',
  uuidParam('companyId'),
  catchAsync(ragController.listCompanyDocuments),
);

router.post(
  '/companies/:companyId/documents',
  uuidParam('companyId'),
  validate(uploadDocumentSchema),
  catchAsync(ragController.uploadCompanyDocument),
);

router.delete(
  '/companies/:companyId/documents/:documentId',
  uuidParam('companyId'),
  catchAsync(ragController.deleteCompanyDocument),
);

export { router as ragRoutes };
