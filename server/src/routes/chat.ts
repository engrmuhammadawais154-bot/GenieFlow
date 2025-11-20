import { Router } from 'express';
import { handleChatMessage } from '../controllers/chatController';
import { validateChatMessage } from '../middleware/validation';

export const chatRouter = Router();

chatRouter.post('/', validateChatMessage, handleChatMessage);
