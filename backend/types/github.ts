export interface GitHubWebhookEvent {
  type: 'push' | 'pull_request' | 'workflow_run' | 'check_run';
  action?: string;
  repository: {
    name: string;
    owner: {
      login: string;
    };
  };
  sender: {
    login: string;
    avatar_url: string;
  };
}

export interface GitHubPushEvent extends GitHubWebhookEvent {
  type: 'push';
  ref: string;
  before: string;
  after: string;
  commits: Array<{
    id: string;
    message: string;
    timestamp: string;
    author: {
      name: string;
      email: string;
    };
  }>;
}

export interface GitHubPullRequestEvent extends GitHubWebhookEvent {
  type: 'pull_request';
  action: 'opened' | 'closed' | 'reopened' | 'synchronize';
  pull_request: {
    number: number;
    title: string;
    body: string;
    state: 'open' | 'closed';
    merged: boolean;
    head: {
      ref: string;
      sha: string;
    };
    base: {
      ref: string;
      sha: string;
    };
  };
}

export interface GitHubWorkflowRunEvent extends GitHubWebhookEvent {
  type: 'workflow_run';
  action: 'completed' | 'requested' | 'in_progress';
  workflow_run: {
    id: number;
    name: string;
    status: 'completed' | 'in_progress';
    conclusion: 'success' | 'failure' | 'cancelled' | 'skipped';
    head_branch: string;
    head_sha: string;
  };
}

export interface GitHubCheckRunEvent extends GitHubWebhookEvent {
  type: 'check_run';
  action: 'created' | 'completed' | 'rerequested';
  check_run: {
    id: number;
    name: string;
    status: 'queued' | 'in_progress' | 'completed';
    conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required';
    head_sha: string;
  };
}
