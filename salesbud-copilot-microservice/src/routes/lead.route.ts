import { Router } from 'express';
import { leadController } from '../controllers/lead.controller.js';
import { createLeadSchema, updateLeadSchema } from '../validations/lead.validation.js';
import { validate } from '../middlewares/validate.js';
import { uuidParam } from '../middlewares/uuid-param.js';
import { catchAsync } from '../utils/catch-async.js';

const router = Router();

router.post('/', validate(createLeadSchema), catchAsync(leadController.create));
router.get('/', catchAsync(leadController.findAll));
router.get('/:id', uuidParam('id'), catchAsync(leadController.findOne));
router.put('/:id', uuidParam('id'), validate(updateLeadSchema), catchAsync(leadController.update));
router.delete('/:id', uuidParam('id'), catchAsync(leadController.remove));

export { router as leadRoutes };
