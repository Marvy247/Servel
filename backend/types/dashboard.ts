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

export interface GitHubRepoMetadata {
  description: string;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  license: string | null;
  createdAt: string;
  updatedAt: string;
  defaultBranch: string;
  visibility: 'public' | 'private';
  archived: boolean;
  topics: string[];
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
    avatar_url?: string;
  };
  committer: {
    name: string;
    email: string;
    date: string;
  };
  html_url: string;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
  files?: {
    filename: string;
    changes: number;
    status: 'added' | 'removed' | 'modified' | 'renamed';
  }[];
}

export interface GitHubWorkflowRun {
  id: string | number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | 'stale' | null;
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
  labels: {
    name: string;
    color: string;
  }[];
  reviewStatus?: 'approved' | 'changes_requested' | 'pending';
  branchName: string;
  baseBranch: string;
  additions: number;
  deletions: number;
  changed_files: number;
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

export interface SlitherDetector {
  check: string;
  impact: string;
  confidence: string;
  description: string;
  extra?: {
    solution?: string;
    reference?: string;
    lines?: number[];
    file?: string;
    contract?: string;
    function?: string;
    variables?: string[];
  };
}

export interface BaseSlitherAnalysisResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  informational: string[];
  lowIssues: string[];
  mediumIssues: string[];
  highIssues: string[];
  jsonReport: Record<string, any>;
  markdownReport: string;
}

export interface FullSlitherAnalysisResult extends BaseSlitherAnalysisResult {
  vulnerabilities: string[];
  detectors: SlitherDetector[];
  summary: {
    high: number;
    medium: number;
    low: number;
    informational: number;
  };
}

export type SlitherAnalysisResult = BaseSlitherAnalysisResult | FullSlitherAnalysisResult;

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
