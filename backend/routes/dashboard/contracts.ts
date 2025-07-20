import express from 'express';
import { getContractsMetadata } from '../../services/dashboard/contractsMetadataService';

const router = express.Router();

// GET /api/dashboard/contractsMetadata
router.get('/contractsMetadata', async (req, res) => {
  try {
    const contracts = getContractsMetadata();
    res.json({
      success: true,
      data: contracts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contracts metadata',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
