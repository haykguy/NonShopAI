import { logger } from './logger';

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  retryableStatuses?: number[];
  onRetry?: (attempt: number, error: any) => void;
}

export class ApiRequestError extends Error {
  statusCode: number;
  responseBody: any;

  constructor(message: string, statusCode: number, responseBody?: any) {
    super(message);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 6000,
    maxDelayMs = 30000,
    retryableStatuses = [429, 500, 503],
    onRetry,
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (attempt >= maxRetries) break;

      const statusCode = error instanceof ApiRequestError ? error.statusCode : 0;
      const isRetryable = retryableStatuses.includes(statusCode) || statusCode === 0;

      if (!isRetryable) throw error;

      const delay = Math.min(baseDelayMs * Math.pow(1.5, attempt), maxDelayMs);
      logger.warn(`Attempt ${attempt + 1}/${maxRetries + 1} failed (status ${statusCode}), retrying in ${delay}ms`);

      if (onRetry) onRetry(attempt + 1, error);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
