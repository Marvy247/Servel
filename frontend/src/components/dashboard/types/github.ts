export interface WorkflowRun {
  id: string;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required';
  created_at: string;
  updated_at: string;
  html_url: string;
  branch: string;
  duration: number;
  test_summary?: {
    passed: number;
    failed: number;
    coverage: number;
  };
}

export interface Deployment {
  id: number;
  environment: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  created_at: string;
  sha: string;
  description?: string;
}

export type ActiveTab = 'ci' | 'security' | 'deployments';
export type StatsTimeRange = '7d' | '30d';

export interface GitHubStatusProps {
  repo: string;
  workflow?: string;
  branch?: string;
}

export interface RunHistoryStats {
  avgDuration: number;
  successRate: number;
  failureRate: number;
  totalRuns: number;
  successCount: number;
  failureCount: number;
  totalDuration: number;
  testStats?: {
    totalPassed: number;
    totalFailed: number;
    flakyTests: { name: string; failRate: number }[];
  };
}
