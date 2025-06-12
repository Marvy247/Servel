import axios from 'axios';
import { GitHubWorkflowRun, GitHubJob } from '../../types/github';
import { GitHubError } from '../../types/github';
import { getWebhookService } from '../events/websocketServer';

interface GitHubApiOptions {
  token: string;
  owner: string;
  repo: string;
}

export class GitHubWorkflowService {
  private readonly apiBase = 'https://api.github.com';
  private readonly options: GitHubApiOptions;

  constructor(options: GitHubApiOptions) {
    this.options = options;
  }

  async getWorkflowRuns(branch?: string): Promise<GitHubWorkflowRun[]> {
    try {
      const url = `${this.apiBase}/repos/${this.options.owner}/${this.options.repo}/actions/runs`;
      const params = branch ? { branch } : {};
      
      const { data } = await axios.get<{ workflow_runs: GitHubWorkflowRun[] }>(url, {
        headers: this.getHeaders(),
        params
      });

      const runs = data.workflow_runs.map(run => ({
        ...run,
        branch: run.head_branch || 'main',
        commit: {
          id: run.head_sha,
          message: run.head_commit?.message || '',
          author: run.head_commit?.author?.name || ''
        }
      }));

      // Broadcast workflow runs update
      const webhookService = getWebhookService();
      runs.forEach(run => {
        webhookService.broadcastWorkflowUpdate(
          `${this.options.owner}/${this.options.repo}`,
          run as GitHubWorkflowRun
        );
      });

      return runs;
    } catch (error) {
      this.handleGitHubError(error);
    }
  }

  async getWorkflowRunJobs(runId: number): Promise<GitHubJob[]> {
    try {
      const url = `${this.apiBase}/repos/${this.options.owner}/${this.options.repo}/actions/runs/${runId}/jobs`;
      const { data } = await axios.get<{ jobs: GitHubJob[] }>(url, {
        headers: this.getHeaders()
      });
      return data.jobs;
    } catch (error) {
      this.handleGitHubError(error);
    }
  }

  async rerunWorkflow(runId: number): Promise<void> {
    try {
      const url = `${this.apiBase}/repos/${this.options.owner}/${this.options.repo}/actions/runs/${runId}/rerun`;
      await axios.post(url, {}, {
        headers: this.getHeaders()
      });
      
      // Broadcast workflow rerun event
      const webhookService = getWebhookService();
      webhookService.broadcastToRunSubscribers(runId, {
        id: runId,
        name: 'Workflow Rerun',
        status: 'queued',
        conclusion: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        html_url: `${this.apiBase}/repos/${this.options.owner}/${this.options.repo}/actions/runs/${runId}`,
        branch: 'main',
        commit: {
          id: '',
          message: 'Workflow rerun triggered',
          author: ''
        }
      } as GitHubWorkflowRun);
    } catch (error) {
      this.handleGitHubError(error);
    }
  }

  private getHeaders() {
    return {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `token ${this.options.token}`
    };
  }

  private handleGitHubError(error: unknown): never {
    if (axios.isAxiosError(error) && error.response) {
      const githubError = error.response.data as GitHubError;
      throw new Error(githubError.message || 'GitHub API error');
    }
    throw new Error('Failed to communicate with GitHub API');
  }
}
