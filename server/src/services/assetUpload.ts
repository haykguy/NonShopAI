import fs from 'fs/promises';
import { apiClient } from './useapi';
import { logger } from '../utils/logger';

export async function uploadImageAsAsset(
  localImagePath: string,
  email?: string
): Promise<string> {
  logger.info(`Uploading asset: ${localImagePath}`);

  const imageBuffer = await fs.readFile(localImagePath);
  const ext = localImagePath.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
  const contentType = `image/${ext}`;

  const response = await apiClient.uploadAsset(imageBuffer, contentType, email);

  const mediaGenId = response.mediaGenerationId.mediaGenerationId;
  logger.info(`Asset uploaded, mediaGenerationId: ${mediaGenId.substring(0, 40)}...`);

  return mediaGenId;
}
