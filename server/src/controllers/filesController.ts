import { Request, Response } from 'express';
import { processStatementFile } from '../services/ocrService';
import { logger } from '../utils/logger';

export async function handleStatementUpload(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
      });
    }

    logger.info(`File uploaded: ${req.file.originalname} (${req.file.mimetype})`);

    const result = await processStatementFile(req.file.buffer, req.file.mimetype);

    res.json({
      success: true,
      bankName: result.bankName,
      transactions: result.transactions,
      count: result.transactions.length,
    });
  } catch (error) {
    logger.error('File processing error:', error);
    res.status(500).json({
      error: 'Failed to process file',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
