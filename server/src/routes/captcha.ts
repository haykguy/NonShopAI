import { Router, Request, Response } from 'express';
import { apiClient } from '../services/useapi';
import { config } from '../config';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/captcha/providers — read currently configured providers (keys masked by useapi)
router.get('/providers', async (_req: Request, res: Response) => {
  try {
    const result = await apiClient.getCaptchaProviders();
    res.json(result);
  } catch (err: any) {
    logger.error(`[captcha] GET providers failed: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/captcha/providers — push all configured env keys to useapi as a single call.
// Only providers with a non-empty key in config are included.
// AntiCaptcha is primary; others are backups and registered in priority order.
router.post('/providers', async (_req: Request, res: Response) => {
  const providerPriority: Array<keyof typeof config.captchaProviders> = [
    'AntiCaptcha',
    'EzCaptcha',
    'CapSolver',
    'YesCaptcha',
    'SolveCaptcha',
    '2Captcha',
  ];

  const payload: Record<string, string> = {};
  for (const name of providerPriority) {
    const key = config.captchaProviders[name];
    if (key) payload[name] = key;
  }

  if (Object.keys(payload).length === 0) {
    res.status(400).json({ error: 'No captcha provider API keys configured in environment' });
    return;
  }

  try {
    const result = await apiClient.setCaptchaProviders(payload);
    logger.info(`[captcha] Registered providers: ${Object.keys(payload).join(', ')}`);
    res.json(result);
  } catch (err: any) {
    logger.error(`[captcha] POST providers failed: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/captcha/stats — query captcha solve statistics
// Query params: date, limit, provider, anonymized
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { date, limit, provider, anonymized } = req.query as Record<string, string>;
    const result = await apiClient.getCaptchaStats({
      ...(date && { date }),
      ...(limit && { limit: parseInt(limit, 10) }),
      ...(provider && { provider }),
      ...(anonymized === 'true' && { anonymized: true }),
    });
    res.json(result);
  } catch (err: any) {
    logger.error(`[captcha] GET stats failed: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

export default router;
