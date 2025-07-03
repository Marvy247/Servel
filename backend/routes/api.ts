import express from 'express';
import { getGitHubService } from '../services/dashboard/githubService';
import { verifyGitHubWebhook } from '../middleware/webhookVerification';
import { githubWebhookLimiter } from '../middleware/rateLimiter';
import quickActionsRoutes from './quickActions';
import type { VerifiedContract } from '../services/dashboard/verifiedContractsService';
import { getVerifiedContracts } from '../services/dashboard/verifiedContractsService';

const router = express.Router();

// Basic health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.use('/dashboard/quick-actions', quickActionsRoutes);

// GitHub webhook endpoint
router.post(
  '/webhooks/github',
  express.json({ verify: verifyGitHubWebhook }),
  githubWebhookLimiter,
  async (req, res) => {
    try {
      const githubService = await getGitHubService();
      await githubService.handleWebhookEvent(req.body);
      res.status(200).send('Event processed');
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).send('Error processing webhook');
    }
  }
);


// Verified contracts endpoint
router.get('/verified-contracts', async (req, res) => {
  try {
    const contracts = await getVerifiedContracts();
    res.json({
      success: true,
      data: contracts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch verified contracts',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
