import express from 'express';

import { getConfig, updateConfig } from '../services/dashboard/configService';
import { getGitHubService } from '../services/dashboard/githubService';
import { verifyGitHubWebhook } from '../middleware/githubWebhook';
import deploymentRoutes from './deployment';
import type { DashboardConfig, TestResult } from '../types/dashboard';
import { getNetworkStatus } from '../services/dashboard/networkStatusService';
import { getGasUsageStats } from '../services/dashboard/gasUsageService';
import { getContracts } from '../services/dashboard/contractsService';
import { getContractsMetadata } from '../services/dashboard/contractsMetadataService';
import { DeploymentService } from '../services/deployment';
import { EventListenerService } from '../services/events/eventListenerService';

const router = express.Router();

// Mount deployment routes
router.use('/deployments', deploymentRoutes);
import quickActionsRoutes from './quickActions';
router.use('/quick-actions', quickActionsRoutes);

// New GET /contractsMetadata endpoint to serve contract metadata
router.get('/contractsMetadata', (req, res) => {
  try {
    const contractsMetadata = getContractsMetadata();
    res.json({
      success: true,
      data: contractsMetadata,
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

const deploymentService = DeploymentService.getInstance();
// EventListenerService is initialized in app.ts

router.get('/config', async (req, res) => {
  try {
    const config = await getConfig();
    res.json({ 
      success: true,
      data: config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to load dashboard configuration',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// New network status endpoint
router.get('/network-status', async (req, res) => {
  try {
    const statuses = await getNetworkStatus();
    res.json({
      success: true,
      data: statuses,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch network status',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// New gas usage endpoint
router.get('/gas-usage', async (req, res) => {
  try {
    const stats = await getGasUsageStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch gas usage stats',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

router.put('/config', async (req, res) => {
  try {
    const updates: Partial<DashboardConfig> = req.body;
    const updatedConfig = await updateConfig(updates);
    res.json({ 
      success: true,
      data: updatedConfig,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to update configuration',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// Existing contracts endpoint
router.get('/contracts', async (req, res) => {
  try {
    const projectId = req.query.projectId as string;
    const contracts = await getContracts(projectId);
    res.json({
      success: true,
      data: contracts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contracts',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// New POST /deployments/:projectId/deploy endpoint
router.post('/deployments/:projectId/deploy', async (req, res) => {
  try {
    const { contractName, constructorArgs, network, rpcUrl, projectId } = req.body;

    if (!contractName || !network) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: contractName, network',
        timestamp: new Date().toISOString()
      });
    }

    // Get contract metadata
    const contractsMetadata = getContractsMetadata();
    const contractMeta = contractsMetadata.find(c => c.name === contractName);
    if (!contractMeta) {
      return res.status(404).json({
        success: false,
        error: `Contract metadata not found for ${contractName}`,
        timestamp: new Date().toISOString()
      });
    }

    // Get the artifact for the contract
    const path = require('path');
    const contractsPath = path.join(__dirname, '../../contracts');
    const scanner = new (require('../services/deployment/artifactScanner').ArtifactScanner)('http://localhost:8545', contractsPath);
    const artifact = await scanner.getArtifactByName(contractName);
    
    if (!artifact) {
      return res.status(404).json({
        success: false,
        error: `Artifact not found for contract ${contractName}`,
        timestamp: new Date().toISOString()
      });
    }

    // Deploy contract with constructor parameters
    const deploymentResult = await deploymentService.deployContract(
      artifact,
      { name: network, rpcUrl: process.env[`${network.toUpperCase()}_RPC_URL`] || rpcUrl || 'http://localhost:8545' },
      projectId || 'default',
      constructorArgs || []
    );

    res.json({
      success: true,
      data: deploymentResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to deploy contract',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// GitHub Actions routes
router.get('/github/actions', async (req, res) => {
  try {
    const github = await getGitHubService();
    const status = await github.getRepoStatus();
    res.json({
      success: true,
      data: {
        workflowRuns: status.lastWorkflowRun ? [status.lastWorkflowRun] : [],
        branchStatus: status.defaultBranchStatus
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch GitHub Actions data',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/github/workflow-runs', async (req, res) => {
  try {
    const { branch, status, page, per_page } = req.query;
    const github = await getGitHubService();
    const runs = await github.getWorkflowRuns({
      branch: branch as string,
      status: status as 'queued' | 'in_progress' | 'completed',
      page: page ? parseInt(page as string) : undefined,
      per_page: per_page ? parseInt(per_page as string) : undefined
    });
    res.json({
      success: true,
      data: runs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflow runs',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// Test results endpoints
router.get('/test-results', async (req, res) => {
  try {
    const { projectId, runId } = req.query;
    const github = await getGitHubService();
    
    let results: TestResult[] = [];
    let stats: {
      total: number;
      passed: number;
      failed: number;
      skipped: number;
    } | null = null;

    if (runId) {
      // Get test results from specific workflow run
      results = await github.getTestResults(runId as string);
      stats = {
        total: results.length,
        passed: results.filter(r => r.status === 'passed').length,
        failed: results.filter(r => r.status === 'failed').length,
        skipped: results.filter(r => r.status === 'skipped').length
      };
    } else {
      // Get latest test results from recent workflow runs
      const status = await github.getRepoStatus();
      if (status.lastWorkflowRun) {
        results = await github.getTestResults(status.lastWorkflowRun.id);
      }
    }

    res.json({
      success: true,
      data: {
        results,
        stats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test results',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/slither-report', async (req, res) => {
  try {
    const { runId } = req.query;
    const github = await getGitHubService();
    // Get Slither report from artifacts
    const artifacts = await github.getWorkflowArtifacts(runId as string);
    const slitherArtifact = artifacts.find(a => a.name === 'slither-report');
    
    let report = {
      vulnerabilities: [],
      detectors: [],
      summary: {
        high: 0,
        medium: 0,
        low: 0,
        informational: 0
      }
    };

    if (slitherArtifact) {
      report = await github.parseSlitherReport(slitherArtifact.id);
    }

    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Slither report',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/test-coverage', async (req, res) => {
  try {
    const { projectId, runId } = req.query;
    const github = await getGitHubService();
    
    // Get coverage data from artifacts
    const artifacts = await github.getWorkflowArtifacts(runId as string);
    const coverageArtifact = artifacts.find(a => a.name === 'coverage');
    
    let coverage = {
      total: 0,
      lines: 0,
      functions: 0,
      statements: 0,
      branches: 0
    };

    if (coverageArtifact) {
      coverage = await github.parseCoverageData(coverageArtifact.id);
    }

    res.json({
      success: true,
      data: coverage,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test coverage',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
    }
});

router.post('/github/webhook', verifyGitHubWebhook(process.env.GITHUB_WEBHOOK_SECRET || ''), async (req, res) => {
  try {
    const github = await getGitHubService();
    const event = req.headers['x-github-event'] as string;
    const payload = req.body;
    
    // Process different GitHub event types
    switch (event) {
      case 'workflow_run':
        await github.handleWorkflowRunEvent(payload);
        break;
      case 'push':
        await github.handlePushEvent(payload);
        break;
      case 'pull_request':
        await github.handlePullRequestEvent(payload);
        break;
      case 'check_run':
        await github.handleCheckRunEvent(payload);
        break;
    }

    res.json({ 
      success: true,
      message: 'Webhook processed successfully',
      event: event,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process GitHub webhook',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
