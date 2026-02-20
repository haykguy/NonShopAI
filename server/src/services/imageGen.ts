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
  logger.info(`Generating ${count} image(s) for clip ${clip.index} with nano-banana-pro`);

  const response = await apiClient.generateImages(clip.imagePrompt, {
    model: 'nano-banana-pro',
    aspectRatio: 'portrait',
    count,
    email,
  });

  clip.imageJobId = response.jobId;
  clip.generatedImages = response.media.map((m): GeneratedImage => ({
    fifeUrl: m.image.generatedImage.fifeUrl,
    mediaGenerationId: m.image.generatedImage.mediaGenerationId,
    seed: m.image.generatedImage.seed,
  }));

  logger.info(`Generated ${clip.generatedImages.length} image(s) for clip ${clip.index}`);

  if (autoPickImage) {
    clip.selectedImageIndex = 0;
    // Download the selected image immediately
    const selectedImage = clip.generatedImages[0];
    const imagePath = path.join(
      config.outputDir,
      'images',
      `${projectId}_clip_${clip.index}.jpg`
    );
    await downloadFile(selectedImage.fifeUrl, imagePath);
    clip.localImagePath = imagePath;
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
