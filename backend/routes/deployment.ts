import express from 'express';
import { getDeployments, getDeploymentById } from '../services/dashboard/deploymentService';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const deployments = await getDeployments();
    res.json({ 
      success: true,
      data: deployments,
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

router.get('/history', async (req, res) => {
  try {
    const { projectId, days = '30' } = req.query;
    const daysNum = parseInt(days as string);
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const deployments = await getDeployments({
      fromDate: startDate.toISOString(),
      toDate: endDate.toISOString(),
      branch: projectId as string
    });

    // Group deployments by date and count successes/failures
    const deploymentHistory = deployments.reduce((acc, deployment) => {
      const date = deployment.timestamp.split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          total: 0,
          successful: 0
        };
      }
      acc[date].total++;
      if (deployment.status === 'success') {
        acc[date].successful++;
      }
      return acc;
    }, {} as Record<string, { date: string; total: number; successful: number }>);

    // Convert to array and sort by date
    const historyArray = Object.values(deploymentHistory).sort((a, b) => 
      a.date.localeCompare(b.date)
    );

    res.json({
      success: true,
      data: historyArray,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deployment history',
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
