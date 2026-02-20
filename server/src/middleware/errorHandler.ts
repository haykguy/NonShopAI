import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ApiRequestError } from '../utils/retry';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error(`Unhandled error: ${err.message}`, err.stack);

  if (err instanceof ApiRequestError) {
    res.status(err.statusCode >= 400 ? err.statusCode : 502).json({
      error: err.message,
      statusCode: err.statusCode,
      details: err.responseBody,
    });
    return;
  }

  res.status(500).json({
    error: err.message || 'Internal server error',
  });
}
