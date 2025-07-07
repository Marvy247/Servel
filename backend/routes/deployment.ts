import express from 'express';
import { getDeployments, getDeploymentById, getEnvironments, getBranches } from '../services/dashboard/deploymentService';
import { DeploymentService } from '../services/deployment';

const router = express.Router();
const deploymentService = DeploymentService.getInstance();

router.get('/:projectId/environments', async (req, res) => {
  try {
    const environments = await getEnvironments();
    res.json(environments);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch environments',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/:projectId/branches', async (req, res) => {
  try {
    const branches = await getBranches();
    res.json(branches);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch branches',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/:projectId', async (req, res) => {
  try {
    const { range, environments, statuses, branch } = req.query;

    const filters: any = {};

    if (environments) {
      filters.environment = (environments as string).split(',');
    }
    if (statuses) {
      filters.status = (statuses as string).split(',');
    }
    if (branch) {
      filters.branch = branch as string;
    }

    // Handle range filter (e.g., '7d', '30d', 'all')
    if (range && range !== 'all') {
      const now = new Date();
      let fromDate: Date;
      if (range === '7d') {
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (range === '30d') {
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        fromDate = new Date(0);
      }
      filters.fromDate = fromDate.toISOString();
      filters.toDate = now.toISOString();
    }

    const deployments = await getDeployments(filters);
    res.json({ deployments });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deployments',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const deployment = await getDeploymentById(req.params.id);
    if (!deployment) {
      return res.status(404).json({
        success: false,
        error: 'Deployment not found',
        timestamp: new Date().toISOString()
      });
    }
    res.json({
      success: true,
      data: deployment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deployment',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/:projectId/addresses', async (req, res) => {
  try {
    const allDeployments = deploymentService.getTrackedDeployments();
    console.log('Tracked deployments:', allDeployments);
    res.json({
      success: true,
      data: allDeployments,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching deployed contract addresses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deployed contract addresses',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
