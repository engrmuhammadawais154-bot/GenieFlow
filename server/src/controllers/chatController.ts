import { Request, Response } from 'express';
import { processAIMessage } from '../services/aiProviderService';
import { logger } from '../utils/logger';

export async function handleChatMessage(req: Request, res: Response) {
  try {
    const { message } = req.body;

    logger.info('Chat message received:', message.substring(0, 50));

    const result = await processAIMessage(message);

    res.json({
      response: result.response,
      provider: result.provider,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to process message',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
