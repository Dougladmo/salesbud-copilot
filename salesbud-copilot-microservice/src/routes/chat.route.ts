import { Router } from 'express';
import { chatController } from '../controllers/chat.controller.js';
import { catchAsync } from '../utils/catch-async.js';

const router = Router();

router.get('/chats', catchAsync(chatController.findChats));
router.get('/contacts', catchAsync(chatController.findContacts));
router.get('/messages/:remoteJid', catchAsync(chatController.findMessages));
router.post('/messages/:remoteJid', catchAsync(chatController.sendMessage));

export { router as chatRoutes };
