import express from 'express';

import { Router } from 'express';
import { DeploymentService } from '@services/deployment';
import { VerificationService } from '@services/deployment/verificationService';

const router = Router();

const rpcUrl = process.env.ANVIL_RPC_URL || 'http://127.0.0.1:8545';
const deploymentService = new DeploymentService(rpcUrl);
const verificationService = new VerificationService(rpcUrl);

// Deploy action
router.post('/deploy', async (req, res) => {
  try {
    const artifact = req.body.artifact;
    if (!artifact) {
      return res.status(400).json({ success: false, error: 'Missing contract artifact in request body' });
    }

    const deployment = await deploymentService.deployContract(artifact, { name: 'anvil', rpcUrl });

    res.json({ success: true, message: 'Deploy action completed', deployment });
  } catch (error) {
    console.error('Deploy action failed:', error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
    res.status(500).json({ success: false, error: 'Deploy action failed' });
  }
});

// Verify action
router.post('/verify', async (req, res) => {
  try {
    // Example: verify a deployed contract
    // You might get contract address and artifact from req.body
    const contractAddress = req.body.contractAddress;
    const expectedArtifact = req.body.artifact;

    if (!contractAddress || !expectedArtifact) {
      return res.status(400).json({ success: false, error: 'Missing contractAddress or artifact' });
    }

    const verified = await verificationService.verifyContract(contractAddress, expectedArtifact);

    if (verified) {
      res.json({ success: true, message: 'Verify action completed' });
    } else {
      res.status(400).json({ success: false, error: 'Verification failed' });
    }
  } catch (error) {
    console.error('Verify action failed:', error);
    res.status(500).json({ success: false, error: 'Verify action failed' });
  }
});

// Run test action
router.post('/run-tests', async (req, res) => {
  try {
    // TODO: Implement actual test running logic
    console.log('Run tests action triggered');
    res.json({ success: true, message: 'Run tests action triggered' });
  } catch (error) {
    console.error('Run tests action failed:', error);
    res.status(500).json({ success: false, error: 'Run tests action failed' });
  }
});

export default router;
