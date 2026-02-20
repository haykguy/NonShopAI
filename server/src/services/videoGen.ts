import path from 'path';
import { apiClient } from './useapi';
import { pollJobUntilDone } from './jobPoller';
import { downloadFile } from './downloader';
import { Clip } from '../types/project';
import { config } from '../config';
import { logger } from '../utils/logger';

export async function generateVideo(
  clip: Clip,
  projectId: string,
  email?: string,
  onProgress?: (status: string, elapsed: number) => void
): Promise<Clip> {
  if (!clip.uploadedMediaGenerationId) {
    throw new Error(`Clip ${clip.index}: no uploaded asset mediaGenerationId`);
  }

  logger.info(`Starting video generation for clip ${clip.index}`);

  // Submit async video generation
  const asyncResponse = await apiClient.generateVideoAsync(clip.videoPrompt, {
    model: 'veo-3.1-fast',
    aspectRatio: 'portrait',
    count: 1,
    startImage: clip.uploadedMediaGenerationId,
    email,
  });

  clip.videoJobId = asyncResponse.jobid;
  logger.info(`Video job created: ${clip.videoJobId}`);

  // Poll until completion
  const completedJob = await pollJobUntilDone(clip.videoJobId, {
    intervalMs: 10000,
    timeoutMs: 600000,
    onPoll: onProgress,
  });

  // Extract video URL from completed job
  const operations = completedJob.response?.operations;
  if (!operations || operations.length === 0) {
    throw new Error(`Clip ${clip.index}: no video operations in completed job`);
  }

  const videoMetadata = operations[0].operation?.metadata?.video;
  if (!videoMetadata?.fifeUrl) {
    throw new Error(`Clip ${clip.index}: no video fifeUrl in completed job`);
  }

  clip.videoFifeUrl = videoMetadata.fifeUrl;

  // Download video immediately (signed URL expires in ~24h)
  const videoPath = path.join(
    config.outputDir,
    'videos',
    `${projectId}_clip_${clip.index}.mp4`
  );
  await downloadFile(clip.videoFifeUrl, videoPath);
  clip.localVideoPath = videoPath;

  logger.info(`Clip ${clip.index} video downloaded to ${videoPath}`);

  return clip;
}
