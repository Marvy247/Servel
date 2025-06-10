import { Octokit } from '@octokit/rest';
import * as crypto from 'crypto';
import type { DashboardConfig, GitHubWorkflowRun, GitHubPullRequest, TestResult, CoverageData, TestResultsHistory, GitHubRepoMetadata, GitHubCommit } from '../../types/dashboard';
import { getConfig } from './configService';

interface GitHubRepoStatus {
  lastCommit: {
    sha: string;
    message: string;
    author: string;
    date: string;
    url: string;
  };
  lastWorkflowRun?: GitHubWorkflowRun;
  openPullRequests: GitHubPullRequest[];
  defaultBranchStatus: {
    status: 'clean' | 'unstable' | 'failing';
    lastCheckTime: string;
  };
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface GitHubServiceCache {
  repoStatus?: CacheEntry<GitHubRepoStatus>;
  testResults?: CacheEntry<TestResult[]>;
  coverage?: CacheEntry<CoverageData>;
  repoMetadata?: CacheEntry<GitHubRepoMetadata>;
  commits?: CacheEntry<GitHubCommit[]>;
}


export class GitHubService {
  async parseSlitherReport(artifactId: number): Promise<any> {
    if (!this.repoDetails) {
      throw new Error('GitHub repository not configured');
    }
    // Download the artifact zip file
    const artifactData = await this.processArtifact(artifactId);
    // In a real implementation, extract and parse the slither report JSON from the zip
    // Here, we mock the parsed report for demonstration
    const mockReport = {
      vulnerabilities: [],
      detectors: [],
      summary: {
        high: 0,
        medium: 0,
        low: 0,
        informational: 0
      }
    };
    return mockReport;
  }

  async getTestResults(runId: string): Promise<TestResult[]> {
    const results = await this._getTestResults(runId);
    return results.map(result => ({
      ...result,
      runId,
      timestamp: new Date().toISOString()
    }));
  }

  private async _getTestResults(runId: string): Promise<TestResult[]> {
    if (!this.repoDetails) {
      throw new Error('GitHub repository not configured');
    }

    // Check cache first
    if (this.cache?.testResults && 
        Date.now() - this.cache.testResults.timestamp < CACHE_TTL) {
      return this.cache.testResults.data;
    }

    const { owner, repo } = this.repoDetails;
    const artifacts = await this.octokit.rest.actions.listWorkflowRunArtifacts({
      owner,
      repo,
      run_id: parseInt(runId)
    });

    const testArtifact = artifacts.data.artifacts.find(a => 
      a.name.includes('test-results')
    );

    if (!testArtifact) {
      return [];
    }

    // In a real implementation, we would download and parse the artifact
    // This is a simplified mock implementation
    const mockResults: TestResult[] = [
      {
        name: 'Example Test 1',
        status: 'passed',
        duration: 120,
        output: 'Test passed successfully'
      },
      {
        name: 'Example Test 2',
        status: 'failed',
        duration: 45,
        output: 'Assertion failed on line 42'
      }
    ];

    // Update cache
    this.cache.testResults = {
      data: mockResults,
      timestamp: Date.now()
    };

    return mockResults;
  }

  async getTestResultsHistory(options: {
    branch?: string;
    status?: 'queued' | 'in_progress' | 'completed';
    per_page?: number;
    page?: number;
  } = {}): Promise<TestResultsHistory> {
    if (!this.repoDetails) {
      throw new Error('GitHub repository not configured');
    }

    // Get workflow runs matching criteria
    const { workflow_runs: runs } = await this.getWorkflowRuns(options);
    
    // Get test results for each run
    const results = await Promise.all(
      runs.map(async run => {
        const testResults = await this._getTestResults(run.id);
        return {
          run,
          testResults
        };
      })
    );

    // Calculate statistics
    const flakyTests = this._findFlakyTests(results);
    const totalRuns = results.length;
    const successRate = totalRuns > 0 
      ? results.filter(r => r.run.conclusion === 'success').length / totalRuns
      : 0;
    const avgDuration = totalRuns > 0
      ? results.reduce((sum, r) => sum + (r.testResults.reduce((sum, t) => sum + t.duration, 0) / r.testResults.length || 0), 0) / totalRuns
      : 0;

    return {
      runs: results.map(({ run, testResults }) => ({
        id: run.id,
        timestamp: run.created_at,
        branch: run.branch,
        conclusion: run.conclusion || 'unknown',
        totalTests: testResults.length,
        passed: testResults.filter(t => t.status === 'passed').length,
        failed: testResults.filter(t => t.status === 'failed').length,
        skipped: testResults.filter(t => t.status === 'skipped').length
      })),
      stats: {
        totalRuns,
        successRate,
        avgDuration,
        flakyTests
      }
    };
  }

  private _findFlakyTests(results: {run: GitHubWorkflowRun; testResults: TestResult[]}[]): string[] {
    const testStatuses = new Map<string, Set<string>>();
    
    results.forEach(({ testResults }) => {
      testResults.forEach(test => {
        if (!testStatuses.has(test.name)) {
          testStatuses.set(test.name, new Set());
        }
        testStatuses.get(test.name)?.add(test.status);
      });
    });

    return Array.from(testStatuses.entries())
      .filter(([_, statuses]) => statuses.size > 1)
      .map(([name]) => name);
  }

  async getWorkflowArtifacts(runId: string) {
    if (!this.repoDetails) {
      throw new Error('GitHub repository not configured');
    }

    const { owner, repo } = this.repoDetails;
    const response = await this.octokit.rest.actions.listWorkflowRunArtifacts({
      owner,
      repo,
      run_id: parseInt(runId)
    });

    return response.data.artifacts.map(artifact => ({
      id: artifact.id,
      name: artifact.name,
      size: artifact.size_in_bytes,
      url: artifact.url,
      createdAt: artifact.created_at
    }));
  }

  async parseCoverageData(artifactId: number): Promise<CoverageData> {
    // In a real implementation, we would download and parse the coverage artifact
    // This is a simplified mock implementation
    return {
      total: 85,
      lines: 82,
      functions: 88,
      statements: 85,
      branches: 80
    };
  }
  private octokit: Octokit;
  private repoDetails: { owner: string; repo: string } | null = null;
  private cache: GitHubServiceCache = {};

  constructor(private config: DashboardConfig) {
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GitHub token not configured');
    }
    this.octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    this.parseRepoUrl();
  }

  private parseRepoUrl() {
    if (!this.config.githubRepo) return;
    
    const matches = this.config.githubRepo.match(/github\.com\/([^/]+)\/([^/]+)/) || 
                    this.config.githubRepo.match(/([^/]+)\/([^/]+)/);
    
    if (matches) {
      this.repoDetails = { owner: matches[1], repo: matches[2] };
    }
  }

  async getWorkflowRunJobs(runId: string): Promise<Array<{
    id: number;
    name: string;
    status: 'queued' | 'in_progress' | 'completed' | 'pending' | 'waiting' | 'requested';
    conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null;
    started_at: string;
    completed_at: string | null;
    created_at: string;
    steps?: Array<{
      name: string;
      status: 'queued' | 'in_progress' | 'completed';
      conclusion: string | null;
      number: number;
    }>;
  }>> {
    if (!this.repoDetails) {
      throw new Error('GitHub repository not configured');
    }

    const { owner, repo } = this.repoDetails;
    const response = await this.octokit.rest.actions.listJobsForWorkflowRun({
      owner,
      repo,
      run_id: parseInt(runId)
    });

    return response.data.jobs.map(job => ({
      id: job.id,
      name: job.name,
      status: job.status,
      conclusion: job.conclusion,
      started_at: job.started_at,
      completed_at: job.completed_at,
      created_at: job.created_at,
      steps: job.steps?.map(step => ({
        name: step.name,
        status: step.status,
        conclusion: step.conclusion,
        number: step.number
      }))
    }));
  }

  async getWorkflowRunTiming(runId: string): Promise<{
    queue_duration_ms: number;
    execution_duration_ms: number;
    total_duration_ms: number;
  }> {
    const jobs = await this.getWorkflowRunJobs(runId);
    if (jobs.length === 0 || !jobs[0].started_at) {
      return {
        queue_duration_ms: 0,
        execution_duration_ms: 0,
        total_duration_ms: 0
      };
    }

    const mainJob = jobs[0];
    const queueDuration = new Date(mainJob.started_at).getTime() - 
                         new Date(mainJob.created_at).getTime();
    const executionDuration = mainJob.completed_at ? 
                            new Date(mainJob.completed_at).getTime() - 
                            new Date(mainJob.started_at).getTime() : 0;

    return {
      queue_duration_ms: queueDuration,
      execution_duration_ms: executionDuration,
      total_duration_ms: queueDuration + executionDuration
    };
  }

  async getWorkflowRuns(options: {
    branch?: string;
    status?: 'queued' | 'in_progress' | 'completed';
    conclusion?: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required';
    per_page?: number;
    page?: number;
  } = {}): Promise<{
    total_count: number;
    workflow_runs: GitHubWorkflowRun[];
  }> {
    if (!this.repoDetails) {
      throw new Error('GitHub repository not configured');
    }

    const { owner, repo } = this.repoDetails;
    const { branch, status, conclusion, per_page = 30, page = 1 } = options;

    const response = await this.octokit.rest.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      branch,
      status,
      ...(conclusion ? { conclusion } : {}),
      per_page,
      page
    });

    return {
      total_count: response.data.total_count,
      workflow_runs: response.data.workflow_runs.map(run => ({
        id: run.id.toString(),
        name: run.name || 'Unknown Workflow',
        status: (run.status as 'queued' | 'in_progress' | 'completed') || 'completed',
        conclusion: (run.conclusion as 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required') || 'neutral',
        created_at: run.created_at,
        updated_at: run.updated_at,
        html_url: run.html_url,
        branch: run.head_branch || 'main',
        duration: run.updated_at && run.created_at 
          ? new Date(run.updated_at).getTime() - new Date(run.created_at).getTime()
          : 0,
        commit: {
          id: run.head_sha,
          message: run.head_commit?.message || '',
          author: run.head_commit?.author?.name || ''
        }
      }))
    };
  }

  async getRepoStatus(options: { 
    forceRefresh?: boolean 
  } = {}): Promise<GitHubRepoStatus> {
    if (!this.repoDetails) {
      throw new Error('GitHub repository not configured');
    }

    if (options.forceRefresh) {
      this.cache.repoStatus = undefined;
    }

    // First check if we have cached recent results
    if (this.cache?.repoStatus && 
        Date.now() - this.cache.repoStatus.timestamp < CACHE_TTL) {
      return this.cache.repoStatus.data;
    }

    const { owner, repo } = this.repoDetails;

    const [commits, runs, pulls] = await Promise.all([
      this.octokit.rest.repos.listCommits({
        owner,
        repo,
        per_page: 1
      }),
      this.octokit.rest.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        per_page: 1
      }),
      this.octokit.rest.pulls.list({
        owner,
        repo,
        state: 'open'
      })
    ]);

    const branchStatus = await this.octokit.rest.repos.getCombinedStatusForRef({
      owner,
      repo,
      ref: 'main'
    });

    const result = {
      lastCommit: {
        sha: commits.data[0].sha,
        message: commits.data[0].commit.message,
        author: commits.data[0].commit.author?.name || '',
        date: commits.data[0].commit.author?.date || '',
        url: commits.data[0].html_url
      },
      lastWorkflowRun: runs.data.workflow_runs[0] ? {
        id: runs.data.workflow_runs[0].id.toString(),
        name: runs.data.workflow_runs[0].name || 'Unknown Workflow',
        status: (runs.data.workflow_runs[0].status as 'queued' | 'in_progress' | 'completed') || 'completed',
        conclusion: (runs.data.workflow_runs[0].conclusion as 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required') || 'neutral',
        created_at: runs.data.workflow_runs[0].created_at,
        updated_at: runs.data.workflow_runs[0].updated_at,
        html_url: runs.data.workflow_runs[0].html_url,
        branch: runs.data.workflow_runs[0].head_branch || 'main',
        commit: {
          id: runs.data.workflow_runs[0].head_sha,
          message: runs.data.workflow_runs[0].head_commit?.message || '',
          author: runs.data.workflow_runs[0].head_commit?.author?.name || ''
        }
      } : undefined,
      openPullRequests: pulls.data.map((pr: any) => ({
        number: pr.number,
        title: pr.title,
        state: pr.state as 'open' | 'closed' | 'merged',
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        html_url: pr.html_url,
        user: {
          login: pr.user?.login || '',
          avatar_url: pr.user?.avatar_url || ''
        },
        labels: pr.labels?.map((label: any) => ({
          name: label.name,
          color: label.color
        })) || [],
        reviewStatus: (pr as any).review_decision === 'approved' ? 'approved' :
                     (pr as any).review_decision === 'changes_requested' ? 'changes_requested' : 'pending',
        branchName: pr.head?.ref || '',
        baseBranch: pr.base?.ref || '',
        additions: (pr as any).additions || 0,
        deletions: (pr as any).deletions || 0,
        changed_files: (pr as any).changed_files || 0,
        mergeable: (pr as any).mergeable || null
      })),
      defaultBranchStatus: {
        status: (branchStatus.data.state === 'success' ? 'clean' : 
               branchStatus.data.state === 'failure' ? 'failing' : 'unstable') as 'clean' | 'unstable' | 'failing',
        lastCheckTime: branchStatus.data.statuses[0]?.updated_at || ''
      }
    };

    // Update cache
    this.cache.repoStatus = {
      data: result,
      timestamp: Date.now()
    };

    return result;
  }

  async setupWebhook(webhookUrl: string): Promise<void> {
    if (!this.repoDetails) {
      throw new Error('GitHub repository not configured');
    }

    if (!process.env.GITHUB_WEBHOOK_SECRET) {
      throw new Error('GitHub webhook secret not configured');
    }

    // First check if webhook already exists
    const existingHooks = await this.octokit.rest.repos.listWebhooks({
      owner: this.repoDetails.owner,
      repo: this.repoDetails.repo
    });

    const existingHook = existingHooks.data.find(hook => 
      hook.config.url === webhookUrl
    );

    if (existingHook) {
      return; // Webhook already exists
    }

    await this.octokit.rest.repos.createWebhook({
      owner: this.repoDetails.owner,
      repo: this.repoDetails.repo,
      config: {
        url: webhookUrl,
        content_type: 'json',
        secret: process.env.GITHUB_WEBHOOK_SECRET,
        insecure_ssl: process.env.NODE_ENV === 'development' ? '1' : '0'
      },
      events: ['push', 'pull_request', 'workflow_run', 'check_run'],
      active: true
    });
  }

  async downloadArtifact(runId: string, artifactId: string): Promise<{ stream: NodeJS.ReadableStream; filename: string }> {
    if (!this.repoDetails) {
      throw new Error('GitHub repository not configured');
    }

    const { owner, repo } = this.repoDetails;
    const response = await this.octokit.rest.actions.downloadArtifact({
      owner,
      repo,
      artifact_id: parseInt(artifactId),
      archive_format: 'zip'
    });

    // Get artifact details to get the filename
    const artifactDetails = await this.octokit.rest.actions.getArtifact({
      owner,
      repo,
      artifact_id: parseInt(artifactId)
    });

    return {
      stream: response.data as unknown as NodeJS.ReadableStream,
      filename: `${artifactDetails.data.name}.zip`
    };
  }

  async processArtifact(artifactId: number): Promise<any> {
    if (!this.repoDetails) {
      throw new Error('GitHub repository not configured');
    }

    const { owner, repo } = this.repoDetails;
    const artifact = await this.octokit.rest.actions.downloadArtifact({
      owner,
      repo,
      artifact_id: artifactId,
      archive_format: 'zip'
    });

    return artifact.data;
  }

  async handleWorkflowRunEvent(payload: any): Promise<void> {
    // Clear cache when workflow run events occur
    this.cache.repoStatus = undefined;
    this.cache.testResults = undefined;
    this.cache.coverage = undefined;
  }

  async handlePushEvent(payload: any): Promise<void> {
    // Clear cache on push events since they may affect test results
    this.cache.repoStatus = undefined;
    this.cache.testResults = undefined;
    this.cache.repoMetadata = undefined;
    this.cache.commits = undefined;
  }

  async handlePullRequestEvent(payload: any): Promise<void> {
    // Clear cache when PRs are opened/updated/merged
    this.cache.repoStatus = undefined;
    this.cache.testResults = undefined;
    this.cache.repoMetadata = undefined;
    this.cache.commits = undefined;
  }

  async handleCheckRunEvent(payload: any): Promise<void> {
    // Clear cache when check runs complete
    if (payload.action === 'completed') {
      this.cache.repoStatus = undefined;
    }
  }

  async getRepoMetadata(options: { 
    forceRefresh?: boolean 
  } = {}): Promise<GitHubRepoMetadata> {
    if (!this.repoDetails) {
      throw new Error('GitHub repository not configured');
    }

    if (options.forceRefresh) {
      this.cache.repoMetadata = undefined;
    }

    if (this.cache?.repoMetadata && 
        Date.now() - this.cache.repoMetadata.timestamp < CACHE_TTL) {
      return this.cache.repoMetadata.data;
    }

    const { owner, repo } = this.repoDetails;
    const response = await this.octokit.rest.repos.get({
      owner,
      repo
    });

    const metadata: GitHubRepoMetadata = {
      description: response.data.description || '',
      stars: response.data.stargazers_count,
      forks: response.data.forks_count,
      watchers: response.data.watchers_count,
      openIssues: response.data.open_issues_count,
      license: response.data.license?.name || null,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
      defaultBranch: response.data.default_branch,
      visibility: response.data.visibility as 'public' | 'private',
      archived: response.data.archived,
      topics: response.data.topics || []
    };

    this.cache.repoMetadata = {
      data: metadata,
      timestamp: Date.now()
    };

    return metadata;
  }

  async getCommitHistory(options: {
    branch?: string;
    path?: string;
    author?: string;
    since?: string;
    until?: string;
    per_page?: number;
    page?: number;
  } = {}): Promise<GitHubCommit[]> {
    if (!this.repoDetails) {
      throw new Error('GitHub repository not configured');
    }

    const { owner, repo } = this.repoDetails;
    const { 
      branch,
      path,
      author,
      since,
      until,
      per_page = 30,
      page = 1
    } = options;

    const response = await this.octokit.rest.repos.listCommits({
      owner,
      repo,
      sha: branch,
      path,
      author,
      since,
      until,
      per_page,
      page
    });

    return response.data.map(commit => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: {
        name: commit.commit.author?.name || '',
        email: commit.commit.author?.email || '',
        date: commit.commit.author?.date || '',
        avatar_url: commit.author?.avatar_url
      },
      committer: {
        name: commit.commit.committer?.name || '',
        email: commit.commit.committer?.email || '',
        date: commit.commit.committer?.date || ''
      },
      html_url: commit.html_url,
  stats: commit.stats ? {
    additions: commit.stats.additions || 0,
    deletions: commit.stats.deletions || 0,
    total: (commit.stats.additions || 0) + (commit.stats.deletions || 0)
  } : undefined,

      files: commit.files?.map(file => ({
        filename: file.filename,
        changes: file.changes,
        status: file.status as 'added' | 'removed' | 'modified' | 'renamed'
      }))
    }));
  }

  async cancelWorkflowRun(runId: string): Promise<void> {
    if (!this.repoDetails) {
      throw new Error('GitHub repository not configured');
    }

    const { owner, repo } = this.repoDetails;
    await this.octokit.rest.actions.cancelWorkflowRun({
      owner,
      repo,
      run_id: parseInt(runId)
    });
  }

  async rerunWorkflow(runId: string): Promise<void> {
    if (!this.repoDetails) {
      throw new Error('GitHub repository not configured');
    }

    const { owner, repo } = this.repoDetails;
    await this.octokit.rest.actions.reRunWorkflow({
      owner,
      repo,
      run_id: parseInt(runId)
    });
  }

  async getWorkflowRunLogs(runId: string): Promise<string> {
    if (!this.repoDetails) {
      throw new Error('GitHub repository not configured');
    }

    const { owner, repo } = this.repoDetails;
    const response = await this.octokit.rest.actions.downloadWorkflowRunLogs({
      owner,
      repo,
      run_id: parseInt(runId)
    });

    return response.data as unknown as string;
  }
}

export async function getGitHubService(): Promise<GitHubService> {
  const config = await getConfig();
  return new GitHubService(config);
}

// Cache configuration
const CACHE_TTL = 30000; // 30 seconds
