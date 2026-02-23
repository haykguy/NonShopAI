import { Router, Request, Response } from 'express';
import { apiClient } from '../services/useapi';
import { logger } from '../utils/logger';

const router = Router();

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, count = 4 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    logger.info(`Generating ${count} avatar images with prompt: ${prompt}`);

    const response = await apiClient.generateImages(prompt, {
      model: 'nano-banana-pro',
      aspectRatio: 'portrait',
      count,
    });

    // Transform response for client
    const images = response.media.map(m => ({
      url: m.image.generatedImage.fifeUrl,
      fifeUrl: m.image.generatedImage.fifeUrl,
      seed: m.image.generatedImage.seed,
      mediaGenerationId: m.image.generatedImage.mediaGenerationId,
    }));

    res.json({
      jobId: response.jobId,
      images,
      media: response.media,
    });
  } catch (error) {
    logger.error('Error generating avatar images:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate images';
    res.status(500).json({ error: message });
  }
});

export default router;
