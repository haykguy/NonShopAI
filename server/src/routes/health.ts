import { Router } from 'express';
import { apiClient } from '../services/useapi';
import { logger } from '../utils/logger';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const accounts = await apiClient.getAccounts();
    const emails = Object.keys(accounts);

    if (emails.length === 0) {
      res.json({
        status: 'no_accounts',
        message: 'No Google Flow accounts configured',
        accounts: {},
      });
      return;
    }

    // Get detailed health for first account
    const primaryEmail = emails[0];
    let health = null;
    try {
      health = await apiClient.getAccountHealth(primaryEmail);
    } catch (err: any) {
      logger.warn(`Could not get health for ${primaryEmail}: ${err.message}`);
    }

    res.json({
      status: 'ok',
      accountCount: emails.length,
      accounts,
      primaryAccount: {
        email: primaryEmail,
        health: health?.health || 'unknown',
        credits: health?.credits,
        models: health?.models?.videoModels?.map(m => ({
          key: m.key,
          name: m.displayName,
          cost: m.creditCost,
        })),
      },
    });
  } catch (err: any) {
    // Return a graceful degraded response instead of a 500 — the UI handles this
    logger.warn(`Health check failed: ${err.message}`);
    res.json({
      status: 'error',
      message: err.message,
      accounts: {},
    });
  }
});

export default router;
