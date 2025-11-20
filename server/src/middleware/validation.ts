import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const chatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  context: z.record(z.any()).optional(),
});

export function validateChatMessage(req: Request, res: Response, next: NextFunction) {
  try {
    chatMessageSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    next(error);
  }
}
