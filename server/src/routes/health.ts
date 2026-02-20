import { Router } from 'express';
import { apiClient } from '../services/useapi';
import { logger } from '../utils/logger';

const router = Router();

router.get('/', async (_req, res, next) => {
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
  } catch (error) {
    next(error);
  }
});

export default router;
