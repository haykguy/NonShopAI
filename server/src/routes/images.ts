import { Router, Request, Response } from 'express';
import { apiClient } from '../services/useapi';
import { logger } from '../utils/logger';

const router = Router();

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, count = 4 } = req.body;

    if (!prompt) {
      logger.warn('Avatar generation request missing prompt');
      return res.status(400).json({ error: 'prompt is required' });
    }

    logger.info(`[Avatar Gen] Starting with prompt: "${prompt.substring(0, 80)}..." (count: ${count})`);

    const response = await apiClient.generateImages(prompt, {
      model: 'nano-banana-pro',
      aspectRatio: 'portrait',
      count,
    });

    logger.info(`[Avatar Gen] API response received with ${response.media?.length || 0} images`);

    if (!response.media || response.media.length === 0) {
      logger.warn('[Avatar Gen] Response has no media');
      return res.status(400).json({ error: 'No images generated. Please check your USEAPI credentials or try again.' });
    }

    // Transform response for client
    const images = response.media.map((m, idx) => {
      try {
        return {
          url: m.image.generatedImage.fifeUrl,
          fifeUrl: m.image.generatedImage.fifeUrl,
          seed: m.image.generatedImage.seed,
          mediaGenerationId: m.image.generatedImage.mediaGenerationId,
        };
      } catch (e) {
        logger.error(`[Avatar Gen] Error extracting image ${idx}:`, e);
        throw new Error(`Failed to extract image ${idx} from response`);
      }
    });

    logger.info(`[Avatar Gen] Successfully transformed ${images.length} images for client`);
    res.json({
      jobId: response.jobId,
      images,
      media: response.media,
    });
  } catch (error) {
    logger.error('[Avatar Gen] Error:', error instanceof Error ? error.message : error);
    const message = error instanceof Error ? error.message : 'Failed to generate images';
    res.status(500).json({ error: message });
  }
});

export default router;
