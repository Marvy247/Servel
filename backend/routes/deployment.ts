import express from 'express';
import { getDeployments, getDeploymentById } from '../services/dashboard/deploymentService';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const deployments = await getDeployments();
    res.json({ 
      deployments,
      timestamp: new Date().toISOString()
    });
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


export default router;
