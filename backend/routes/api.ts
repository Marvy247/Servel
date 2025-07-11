import express from 'express';
import { getGitHubService } from '../services/dashboard/githubService';
import { verifyGitHubWebhook } from '../middleware/webhookVerification';
import { githubWebhookLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Basic health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

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

export default router;
