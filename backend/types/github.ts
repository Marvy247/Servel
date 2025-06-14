interface WorkflowRun {
  id: number;
  name: string;
  run_number: number;
  status: 'queued'|'in_progress'|'completed';
  conclusion: 'success'|'failure'|'neutral'|'cancelled'|'timed_out'|'action_required'|'skipped'|null;
  created_at: string;
  updated_at: string;
  html_url: string;
  head_sha: string;
  head_branch?: string;
  head_commit?: {
    message?: string;
    author?: {
      name?: string;
    };
  };
}

interface Job {
  id: number;
  run_id: number;
  status: 'queued'|'in_progress'|'completed';
  conclusion: 'success'|'failure'|'neutral'|'cancelled'|'timed_out'|'action_required'|'skipped'|null;
  started_at: string;
  completed_at: string|null;
  name: string;
  steps: Array<{
    name: string;
    status: 'queued'|'in_progress'|'completed';
    conclusion: 'success'|'failure'|'neutral'|'cancelled'|'timed_out'|'action_required'|'skipped'|null;
    number: number;
  }>;
}

interface Artifact {
  id: number;
  name: string;
  size_in_bytes: number;
  archive_download_url: string;
  expired: boolean;
  created_at: string;
  expires_at: string;
}

interface TestResult {
  total_count: number;
  passed: number;
  failed: number;
  skipped: number;
  suites: Array<{
    name: string;
    total_count: number;
    passed: number;
    failed: number;
    skipped: number;
  }>;
}

interface RepoStatus {
  state: 'pending'|'success'|'failure'|'error';
  total_count: number;
  statuses: Array<{
    state: 'pending'|'success'|'failure'|'error';
    context: string;
    description: string|null;
    target_url: string|null;
  }>;
}

interface GitHubUser {
  id: number;
  login: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  html_url?: string;
}

interface Contributor {
  login: string;
  contributions: number;
  avatar_url: string;
  html_url: string;
}

interface GitHubError {
  status: number;
  message: string;
  documentation_url?: string;
  errors?: Array<{
    resource: string;
    field: string;
    code: string;
  }>;
}

// New stricter types with GitHub prefix
interface GitHubWorkflowRun extends Omit<WorkflowRun, 'conclusion'> {
  branch: string;
  commit: {
    id: string;
    message: string;
    author: string;
  };
  conclusion: 'success'|'failure'|'neutral'|'cancelled'|'timed_out'|'action_required'|'skipped'| 'stale' | null;
}

interface GitHubJob extends Job {}
interface GitHubArtifact extends Artifact {}
interface GitHubTestResult extends TestResult {}
interface GitHubRepoStatus extends RepoStatus {}

export {
  WorkflowRun,
  Job,
  Artifact,
  TestResult,
  RepoStatus,
  GitHubError,
  GitHubUser,
  Contributor,
  GitHubWorkflowRun,
  GitHubJob,
  GitHubArtifact,
  GitHubTestResult,
  GitHubRepoStatus
};
