import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

export async function downloadFile(url: string, outputPath: string): Promise<string> {
  logger.info(`Downloading: ${url.substring(0, 80)}...`);

  const dir = path.dirname(outputPath);
  await fs.mkdir(dir, { recursive: true });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(outputPath, buffer);

  logger.info(`Downloaded ${buffer.length} bytes to ${outputPath}`);
  return outputPath;
}

export async function downloadToBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
