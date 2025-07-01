import express from 'express';
import { getGitHubService } from '../services/dashboard/githubService';
import { verifyGitHubWebhook } from '../middleware/webhookVerification';
import { githubWebhookLimiter } from '../middleware/rateLimiter';
import quickActionsRoutes from './quickActions';

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

// Mock verified contracts endpoint
router.get('/verified-contracts', (req, res) => {
  const mockContracts = [
    {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      name: 'MockContract1',
      abi: []
    },
    {
      address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      name: 'MockContract2',
      abi: []
    }
  ];
  res.json(mockContracts);
});

export default router;
