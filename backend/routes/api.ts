import express from 'express';
import { getGitHubService } from '../services/dashboard/githubService';
import { verifyGitHubWebhook } from '../middleware/webhookVerification';
import { githubWebhookLimiter } from '../middleware/rateLimiter';
import quickActionsRoutes from './quickActions';


const router = express.Router();

router.get('/dashboard/contracts', async (req, res) => {
  try {
    const projectId = req.query.projectId as string;
    // For now, ignoring projectId and returning all tracked deployments
    const deploymentModule = await import('../services/deployment');
    const deploymentService = deploymentModule.DeploymentService.getInstance();
    const deployments = deploymentService.getTrackedDeployments();

    // Transform deployments to expected format for ContractsList
    const transformed: Record<string, any[]> = {};
    for (const [network, artifacts] of Object.entries(deployments)) {
      transformed[network] = artifacts.map((artifact: any) => ({
        name: artifact.contractName || 'Unknown',
        address: artifact.address,
        network: artifact.network,
        verified: artifact.verified || false, // use actual verified status if available
        lastDeployed: artifact.lastDeployed || new Date().toISOString()
      }));
    }

    res.json(transformed);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contracts',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

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

export default router;
