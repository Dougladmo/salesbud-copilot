import { Router } from 'express';
import { companyController } from '../controllers/company.controller.js';
import { createCompanySchema, updateCompanySchema } from '../validations/company.validation.js';
import { validate } from '../middlewares/validate.js';
import { uuidParam } from '../middlewares/uuid-param.js';
import { catchAsync } from '../utils/catch-async.js';

const router = Router();

router.post('/', validate(createCompanySchema), catchAsync(companyController.create));
router.get('/', catchAsync(companyController.findAll));
router.get('/:id', uuidParam('id'), catchAsync(companyController.findOne));
router.patch('/:id', uuidParam('id'), validate(updateCompanySchema), catchAsync(companyController.update));
router.delete('/:id', uuidParam('id'), catchAsync(companyController.remove));

export { router as companyRoutes };
