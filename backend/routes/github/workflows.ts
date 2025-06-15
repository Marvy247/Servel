import { Router } from 'express';
import axios from 'axios';
import { AuthenticatedRequest } from '../../types/request';
import { authenticate } from '../../middleware/auth';
import { Response } from 'express-serve-static-core';

interface WorkflowRun {
  id: number;
  name: string;
  event: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
  html_url: string;
  jobs_url: string;
  artifacts_url?: string;
  rerun_url?: string;
}

interface WorkflowJob {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  started_at: string;
  completed_at: string | null;
  html_url: string;
  steps: Array<{
    name: string;
    status: string;
    conclusion: string | null;
    number: number;
  }>;
}

const router = Router();

// Get workflow runs for a repository
router.get('/:owner/:repo/workflows', authenticate(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { owner, repo } = req.params;
    const { data } = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=100`,
      {
        headers: {
          'Authorization': `token ${req.user?.githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    res.json({
      success: true,
      workflow_runs: data.workflow_runs.map((run: any) => ({
        id: run.id,
        name: run.name || 'Untitled Workflow',
        event: run.event,
        status: run.status,
        conclusion: run.conclusion,
        created_at: run.created_at,
        updated_at: run.updated_at,
        html_url: run.html_url,
        jobs_url: run.jobs_url,
        artifacts_url: run.artifacts_url,
        rerun_url: run.rerun_url
      }))
    });
  } catch (error) {
    console.error('GitHub workflows error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch GitHub workflow runs'
    });
  }
});

// Get workflow run jobs
router.get('/:owner/:repo/runs/:run_id/jobs', authenticate(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { owner, repo, run_id } = req.params;
    const { data } = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs/${run_id}/jobs`,
      {
        headers: {
          'Authorization': `token ${req.user?.githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    res.json({
      success: true,
      jobs: data.jobs.map((job: any) => ({
        id: job.id,
        name: job.name,
        status: job.status,
        conclusion: job.conclusion,
        started_at: job.started_at,
        completed_at: job.completed_at,
        html_url: job.html_url,
        steps: job.steps
      }))
    });
  } catch (error) {
    console.error('GitHub jobs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch GitHub workflow jobs'
    });
  }
});

// Rerun a workflow
router.post('/:owner/:repo/runs/:run_id/rerun', authenticate(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { owner, repo, run_id } = req.params;
    await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs/${run_id}/rerun`,
      {},
      {
        headers: {
          'Authorization': `token ${req.user?.githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    res.json({
      success: true,
      message: 'Workflow rerun triggered successfully'
    });
  } catch (error) {
    console.error('GitHub rerun error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rerun GitHub workflow'
    });
  }
});

// Get workflow artifacts
router.get('/:owner/:repo/runs/:run_id/artifacts', authenticate(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { owner, repo, run_id } = req.params;
    const { data } = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs/${run_id}/artifacts`,
      {
        headers: {
          'Authorization': `token ${req.user?.githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    res.json({
      success: true,
      artifacts: data.artifacts.map((artifact: any) => ({
        id: artifact.id,
        name: artifact.name,
        size_in_bytes: artifact.size_in_bytes,
        url: artifact.url,
        archive_download_url: artifact.archive_download_url,
        expired: artifact.expired,
        created_at: artifact.created_at,
        expires_at: artifact.expires_at
      }))
    });
  } catch (error) {
    console.error('GitHub artifacts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch GitHub workflow artifacts'
    });
  }
});

export default router;
