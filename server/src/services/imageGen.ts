import { apiClient } from './useapi';
import { downloadFile } from './downloader';
import { Clip, GeneratedImage } from '../types/project';
import { config } from '../config';
import { logger } from '../utils/logger';
import path from 'path';

export async function generateImage(
  clip: Clip,
  projectId: string,
  autoPickImage: boolean,
  email?: string
): Promise<Clip> {
  const count = autoPickImage ? 1 : 4;
  logger.info(`[imageGen] Clip ${clip.index}: requesting ${count} image(s) — model: nano-banana-pro, email: ${email ?? 'auto'}`);
  logger.info(`[imageGen] Clip ${clip.index} prompt: "${clip.imagePrompt?.slice(0, 120)}..."`);

  let response: any;
  try {
    response = await apiClient.generateImages(clip.imagePrompt, {
      model: 'nano-banana-pro',
      aspectRatio: 'portrait',
      count,
      email,
    });
  } catch (err: any) {
    logger.error(`[imageGen] Clip ${clip.index}: API call failed — ${err.message}`, err.stack ?? err);
    throw err;
  }

  logger.info(`[imageGen] Clip ${clip.index}: raw API response keys: ${Object.keys(response ?? {}).join(', ')}`);

  if (!response?.media || !Array.isArray(response.media) || response.media.length === 0) {
    const errMsg = `[imageGen] Clip ${clip.index}: unexpected response shape — ${JSON.stringify(response).slice(0, 300)}`;
    logger.error(errMsg);
    throw new Error(errMsg);
  }

  clip.imageJobId = response.jobId;
  const generatedImages: GeneratedImage[] = response.media.map((m: any): GeneratedImage => ({
    fifeUrl: m.image.generatedImage.fifeUrl,
    mediaGenerationId: m.image.generatedImage.mediaGenerationId,
    seed: m.image.generatedImage.seed,
  }));
  clip.generatedImages = generatedImages;

  logger.info(`[imageGen] Clip ${clip.index}: got ${generatedImages.length} image(s)`);

  if (autoPickImage) {
    clip.selectedImageIndex = 0;
    const selectedImage = generatedImages[0];
    const imagePath = path.join(
      config.outputDir,
      'images',
      `${projectId}_clip_${clip.index}.jpg`
    );
    logger.info(`[imageGen] Clip ${clip.index}: downloading image to ${imagePath}`);
    try {
      await downloadFile(selectedImage.fifeUrl, imagePath);
    } catch (err: any) {
      logger.error(`[imageGen] Clip ${clip.index}: download failed — ${err.message}`, err.stack ?? err);
      throw err;
    }
    clip.localImagePath = imagePath;
    logger.info(`[imageGen] Clip ${clip.index}: image saved to ${imagePath}`);
  }

  return clip;
}

export async function downloadSelectedImage(
  clip: Clip,
  projectId: string
): Promise<Clip> {
  if (clip.selectedImageIndex === undefined || !clip.generatedImages) {
    throw new Error(`Clip ${clip.index}: no image selected`);
  }

  const selectedImage = clip.generatedImages[clip.selectedImageIndex];
  const imagePath = path.join(
    config.outputDir,
    'images',
    `${projectId}_clip_${clip.index}.jpg`
  );
  await downloadFile(selectedImage.fifeUrl, imagePath);
  clip.localImagePath = imagePath;

  return clip;
}
