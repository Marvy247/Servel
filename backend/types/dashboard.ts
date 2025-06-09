export interface Deployment {
  id: string;
  environment: 'production' | 'staging' | 'development';
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  commit: {
    hash: string;
    message: string;
    author: string;
    url: string;
  };
  duration: number;
  metadata: {
    branch: string;
    trigger: 'manual' | 'auto';
    buildId: string;
    deployedBy?: string;
    rollback?: {
      status: 'pending' | 'success' | 'failed';
      timestamp?: string;
      originalDeploymentId?: string;
    };
  };
}

export interface GitHubWorkflowRun {
  id: string;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null;
  created_at: string;
  updated_at: string;
  html_url: string;
  branch: string;
  commit: {
    id: string;
    message: string;
    author: string;
  };
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  created_at: string;
  updated_at: string;
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
  mergeable: boolean | null;
}

export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'pending';
  duration: number;
  type?: 'unit' | 'integration' | 'e2e' | 'fuzz';
  output?: string;
  artifactUrl?: string;
  logUrl?: string;
  runId?: string;
  timestamp?: string;
}

export interface TestResultsHistory {
  runs: {
    id: string;
    timestamp: string;
    branch: string;
    conclusion: string;
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
  }[];
  stats: {
    totalRuns: number;
    successRate: number;
    avgDuration: number;
    flakyTests: string[];
  };
}

export interface CoverageData {
  total: number;
  lines: number;
  functions: number;
  statements: number;
  branches: number;
}

export interface DashboardConfig {
  projectId: string;
  githubRepo: string;
  defaultWorkflow?: string;
  refreshInterval?: number;
  features: {
    securityAnalysis: boolean;
    testCoverage: boolean;
    deploymentTracking: boolean;
    githubIntegration: boolean;
    [key: string]: boolean;
  };
}
