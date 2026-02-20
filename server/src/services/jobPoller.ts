import { apiClient } from './useapi';
import { JobStatusResponse } from '../types/api';
import { logger } from '../utils/logger';

export interface PollOptions {
  intervalMs?: number;
  timeoutMs?: number;
  onPoll?: (status: string, elapsed: number) => void;
}

export async function pollJobUntilDone(
  jobId: string,
  options: PollOptions = {}
): Promise<JobStatusResponse> {
  const { intervalMs = 10000, timeoutMs = 600000, onPoll } = options;
  const startTime = Date.now();

  logger.info(`Polling job ${jobId} every ${intervalMs / 1000}s (timeout: ${timeoutMs / 1000}s)`);

  while (true) {
    const elapsed = Date.now() - startTime;

    if (elapsed > timeoutMs) {
      throw new Error(`Job ${jobId} polling timeout after ${timeoutMs / 1000}s`);
    }

    try {
      const job = await apiClient.getJobStatus(jobId);

      if (onPoll) onPoll(job.status, elapsed);

      if (job.status === 'completed') {
        logger.info(`Job ${jobId} completed in ${(elapsed / 1000).toFixed(1)}s`);
        return job;
      }

      if (job.status === 'failed') {
        const errMsg = job.error || job.errorDetails || 'Unknown failure';
        throw new Error(`Job ${jobId} failed: ${errMsg}`);
      }

      logger.debug(`Job ${jobId} status: ${job.status} (${(elapsed / 1000).toFixed(0)}s elapsed)`);
    } catch (error: any) {
      // Don't rethrow poll errors for transient issues, just log and continue
      if (error.message?.includes('failed:')) throw error;
      logger.warn(`Poll error for job ${jobId}: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
}
