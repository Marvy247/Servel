import express from 'express';
import { getGitHubService, GitHubService } from '../services/dashboard/githubService';
import { githubWebhookLimiter } from '../middleware/rateLimiter';
import { validateRunId } from '../utils/validators';

const router = express.Router();

// Apply general rate limiting to all GitHub routes
router.use(githubWebhookLimiter);
let githubService: GitHubService | null = null;

// Initialize GitHubService asynchronously
const initializeGitHubService = async () => {
  if (!githubService) {
    githubService = await getGitHubService();
  }
  return githubService;
};

router.get('/actions', async (req, res) => {
  try {
    const githubService = await initializeGitHubService();
    if (!githubService) {
      return res.status(503).json({
        success: false,
        error: 'GitHub service not initialized',
        timestamp: new Date().toISOString()
      });
    }
    const { workflow_runs, total_count } = await githubService.getWorkflowRuns({
      branch: req.query.branch as string,
      status: req.query.status as 'queued' | 'in_progress' | 'completed',
      conclusion: req.query.conclusion as 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required',
      per_page: req.query.per_page ? parseInt(req.query.per_page as string) : 30,
      page: req.query.page ? parseInt(req.query.page as string) : 1
    });
    res.json({
      success: true,
      runs: workflow_runs,
      total: total_count,
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

/**
 * @swagger
 * /actions/{runId}:
 *   get:
 *     tags: [GitHub]
 *     summary: Get workflow run details
 *     description: Returns detailed information about a specific GitHub workflow run
 *     parameters:
 *       - in: path
 *         name: runId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^\d+$'
 *           example: '123456789'
 *         description: Numeric workflow run ID
 *     responses:
 *       200:
 *         description: Workflow run details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkflowRun'
 *       400:
 *         description: Invalid run ID format
 *       404:
 *         description: Run not found
 *       500:
 *         description: Server error
 */
router.get('/actions/:runId', validateRunId, async (req, res) => {
  try {
    const githubService = await initializeGitHubService();
    if (!githubService) {
      return res.status(503).json({
        success: false,
        error: 'GitHub service not initialized',
        timestamp: new Date().toISOString()
      });
    }
    console.log(`Fetching details for run ${req.params.runId}`);
    const { workflow_runs, total_count } = await githubService.getWorkflowRuns();
    const runDetails = workflow_runs.find(run => run.id === req.params.runId);
    if (!runDetails) {
      return res.status(404).json({
        success: false,
        error: 'Workflow run not found',
        timestamp: new Date().toISOString()
      });
    }
    res.set({
      'Cache-Control': 'public, max-age=300',
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '99'
    });
    res.json({
      success: true,
      run: runDetails,
      total: total_count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflow run details',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /actions/{runId}/artifacts:
 *   get:
 *     summary: Get artifacts for a workflow run
 *     parameters:
 *       - in: path
 *         name: runId
 *         required: true
 *         schema:
 *           type: string
 *         description: The workflow run ID
 *     responses:
 *       200:
 *         description: List of artifacts
 *       404:
 *         description: Run not found
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /actions/{runId}/artifacts:
 *   get:
 *     tags: [GitHub]
 *     summary: Get workflow artifacts
 *     description: Returns artifacts generated by a specific workflow run
 *     parameters:
 *       - in: path
 *         name: runId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^\d+$'
 *           example: '123456789'
 *         description: Numeric workflow run ID
 *     responses:
 *       200:
 *         description: List of artifacts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Artifact'
 *       400:
 *         description: Invalid run ID format
 *       404:
 *         description: Run not found
 *       500:
 *         description: Server error
 */
router.get('/actions/:runId/artifacts', validateRunId, async (req, res) => {
  try {
    const githubService = await initializeGitHubService();
    if (!githubService) {
      return res.status(503).json({
        success: false,
        error: 'GitHub service not initialized',
        timestamp: new Date().toISOString()
      });
    }
    console.log(`Fetching artifacts for run ${req.params.runId}`);
    const artifacts = await githubService.getWorkflowArtifacts(req.params.runId);
    res.set({
      'Cache-Control': 'public, max-age=300',
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '99'
    });
    res.json({
      success: true,
      artifacts: artifacts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch artifacts',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/actions/status', async (req, res) => {
  try {
    const githubService = await initializeGitHubService();
    if (!githubService) {
      return res.status(503).json({
        success: false,
        error: 'GitHub service not initialized',
        timestamp: new Date().toISOString()
      });
    }
    const status = await githubService.getRepoStatus();
    res.set('Cache-Control', 'public, max-age=300');
    res.json({
      success: true,
      status: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch repository status',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/webhook', githubWebhookLimiter, async (req, res) => {
  try {
    const githubService = await initializeGitHubService();
    if (!githubService) {
      return res.status(503).json({
        success: false,
        error: 'GitHub service not initialized',
        timestamp: new Date().toISOString()
      });
    }

    const eventType = req.headers['x-github-event'];
    if (!eventType) {
      return res.status(400).json({
        success: false,
        error: 'Missing GitHub event type header',
        timestamp: new Date().toISOString()
      });
    }
    switch (eventType) {
      case 'workflow_run':
        await githubService.handleWorkflowRunEvent(req.body);
        break;
      case 'push':
        await githubService.handlePushEvent(req.body);
        break;
      case 'pull_request':
        await githubService.handlePullRequestEvent(req.body);
        break;
      case 'check_run':
        await githubService.handleCheckRunEvent(req.body);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Unsupported GitHub event type',
          timestamp: new Date().toISOString()
        });
    }
    res.json({
      success: true,
      message: 'Webhook event processed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /actions/{runId}/artifacts/{artifactId}/download:
 *   get:
 *     tags: [GitHub]
 *     summary: Download workflow artifact
 *     description: Downloads a specific artifact from a workflow run
 *     parameters:
 *       - in: path
 *         name: runId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^\d+$'
 *           example: '123456789'
 *         description: Numeric workflow run ID
 *       - in: path
 *         name: artifactId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^\d+$'
 *           example: '987654'
 *         description: Numeric artifact ID
 *     responses:
 *       200:
 *         description: Artifact file download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid run ID or artifact ID format
 *       404:
 *         description: Artifact not found
 *       500:
 *         description: Server error
 */
router.get('/actions/:runId/artifacts/:artifactId/download', validateRunId, async (req, res) => {
  try {
    const githubService = await initializeGitHubService();
    if (!githubService) {
      return res.status(503).json({
        success: false,
        error: 'GitHub service not initialized',
        timestamp: new Date().toISOString()
      });
    }
    const { stream, filename } = await githubService.downloadArtifact(
      req.params.runId,
      req.params.artifactId
    );
    res.set({
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': 'application/octet-stream'
    });
    stream.pipe(res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to download artifact',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
