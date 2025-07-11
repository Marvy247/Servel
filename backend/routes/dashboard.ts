import express, { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/request';
import type { DashboardConfig, TestResult, SlitherAnalysisResult, FullSlitherAnalysisResult, SlitherDetector } from '../types/dashboard';

function isFullAnalysisResult(result: SlitherAnalysisResult): result is FullSlitherAnalysisResult {
  return 'vulnerabilities' in result && 'detectors' in result && 'summary' in result;
}

import { authenticate } from '../middleware/auth';
import { getConfig, updateConfig } from '../services/dashboard/configService';
import { getGitHubService } from '../services/dashboard/githubService';
import { getDeployments } from '../services/dashboard/deploymentService';
import { verifyGitHubWebhook } from '../middleware/githubWebhook';
import deploymentRoutes from './deployment';

const router = express.Router();

// Public routes
router.get('/slither-report', async (req, res) => {
  try {
    const { runId } = req.query;
    const github = await getGitHubService();
    const artifacts = await github.getWorkflowArtifacts(runId?.toString() || '');
    const slitherArtifact = artifacts.find(a => a.name === 'slither-report');
    
    const defaultReport: FullSlitherAnalysisResult = {
      success: true,
      errors: [],
      warnings: [],
      informational: [],
      lowIssues: [],
      mediumIssues: [],
      highIssues: [],
      jsonReport: {},
      markdownReport: '',
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
      const result = await github.parseSlitherReport(slitherArtifact.id);
      if (isFullAnalysisResult(result)) {
        res.json({
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        });
        return;
      }
    }

    res.json({
      success: true,
      data: defaultReport,
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

// Protected routes (require auth)
router.use(authenticate as any);

// Mount deployment routes
router.use('/deployments', deploymentRoutes);

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
        results = await github.getTestResults(status.lastWorkflowRun.id.toString());
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

router.get('/metrics', async (req, res) => {
  try {
    const { projectId } = req.query;
    const github = await getGitHubService();
    // Get deployment metrics
    const deployments = await getDeployments({
      branch: projectId as string
    });
    
    // Get coverage data
    const coverageRes = await github.getWorkflowArtifacts('latest');
    const coverageArtifact = coverageRes.find(a => a.name === 'coverage');
    let coverage = {
      current: 0,
      trend: 'stable' as const,
      diff: 0
    };
    if (coverageArtifact) {
      const covData = await github.parseCoverageData(coverageArtifact.id);
      coverage.current = covData.total;
    }

    // Get security issues from slither report
    const slitherRes = await github.getWorkflowArtifacts('latest');
    const slitherArtifact = slitherRes.find(a => a.name === 'slither-report');
    let issues = {
      critical: 0,
      total: 0,
      resolved24h: 0
    };
    if (slitherArtifact) {
      const report = await github.parseSlitherReport(slitherArtifact.id);
      if (isFullAnalysisResult(report)) {
        issues.critical = report.summary.high;
        issues.total = report.summary.high + report.summary.medium + report.summary.low;
      }
    }
    
    res.json({
      success: true,
      data: {
        deployments,
        coverage,
        issues
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard metrics',
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

router.get('/github/actions/:runId/artifacts/:artifactId/download', async (req, res) => {
  try {
    const { runId, artifactId } = req.params;
    const github = await getGitHubService();
    const artifactData = await github.processArtifact(parseInt(artifactId));
    
    // Assuming artifactData is a buffer or stream of the zip file
    res.setHeader('Content-Disposition', `attachment; filename=artifact-${artifactId}.zip`);
    res.setHeader('Content-Type', 'application/zip');
    res.send(artifactData);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to download artifact',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/github/contributors', async (req: Request, res: Response) => {
  try {
    const github = await getGitHubService();
    const contributors = await github.getContributors();
    
    return res.json({
      success: true,
      data: contributors.map(c => ({
        login: c.login,
        contributions: c.contributions,
        avatar_url: c.avatar_url,
        html_url: c.html_url
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contributors',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
