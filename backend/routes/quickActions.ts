import express from 'express';
import { Router } from 'express';
import { DeploymentService } from '../services/deployment';
import { VerificationService } from '../services/deployment/verificationService';
import fs from 'fs';
import path from 'path';

const router = Router();

const rpcUrl = process.env.ANVIL_RPC_URL || 'http://127.0.0.1:8545';
const deploymentService = new DeploymentService(rpcUrl);
const verificationService = new VerificationService(rpcUrl);

// Get artifacts list
router.get('/artifacts', async (req, res) => {
  try {
    const artifactsDir = path.resolve(__dirname, '../../contracts/out');
    const artifactFiles: string[] = [];

    function readDirRecursive(dir: string) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          readDirRecursive(fullPath);
        } else if (file.endsWith('.json')) {
          artifactFiles.push(fullPath);
        }
      }
    }

    readDirRecursive(artifactsDir);

    console.log(`Found ${artifactFiles.length} artifact files in ${artifactsDir}`);

    let artifacts = artifactFiles.map(filePath => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const json = JSON.parse(content);
      return {
        contractName: json.contractName || path.basename(filePath, '.json'),
        abi: json.abi,
        bytecode: json.bytecode || json.evm?.bytecode?.object || '',
        deployedBytecode: json.deployedBytecode || json.evm?.deployedBytecode?.object || '',
        network: 'local'
      };
    });

    // Filter out artifacts with empty bytecode or that are libraries (no deployable bytecode)
    artifacts = artifacts.filter(artifact => {
      const name = artifact.contractName.toLowerCase();
      return artifact.bytecode && artifact.bytecode !== '0x' && !name.includes('library') && !name.includes('std') && !name.includes('vm');
    });

    console.log(`Serving ${artifacts.length} filtered artifacts to client`);

    res.json({ success: true, artifacts });
  } catch (error) {
res.status(500).json({ 
      success: false, 
      message: 'Failed to load artifacts', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

// Deploy action
router.post('/deploy', async (req, res) => {
  try {
    const artifact = req.body.artifact;
    console.log('Received artifact for deployment:', artifact);
    if (!artifact) {
      return res.status(400).json({ success: false, error: 'Missing contract artifact in request body' });
    }

    console.log('Deploying to RPC URL:', rpcUrl);
    const maskedKey = process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.slice(0, 6) + '...' : 'default key';
    console.log('Using private key:', maskedKey);

    const deployment = await deploymentService.deployContract(artifact, { name: 'anvil', rpcUrl });

    console.log('Deployment transaction hash:', deployment.txHash);
    console.log('Deployed contract address:', deployment.address);

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
import { exec } from 'child_process';

router.post('/run-tests', async (req, res) => {
  try {
    console.log('Run tests action triggered');
    exec('forge test', { cwd: '../contracts' }, (error, stdout, stderr) => {
      if (error) {
        console.error('Error running forge tests:', error);
        return res.status(500).json({ success: false, error: 'Error running forge tests', details: stderr });
      }
      res.json({ success: true, message: 'Forge tests run successfully', output: stdout });
    });
  } catch (error) {
    console.error('Run tests action failed:', error);
    res.status(500).json({ success: false, error: 'Run tests action failed' });
  }
});

export default router;
