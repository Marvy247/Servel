import { Status } from '../components/dashboard/StatusBadge';

export interface GitHubStatusProps {
  repo: string;
  workflow?: string;
  branch?: string;
}

export interface Artifact {
  id: number;
  name: string;
  size: number;
  url: string;
}

export interface SlitherFinding {
  id: string;
  contract: string;
  description: string;
  severity: 'high' | 'medium' | 'low' | 'informational';
  impact: string;
  confidence: string;
  reference: string;
}

export interface WorkflowRun {
  id: string;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required';
  deployment_status?: {
    state: 'queued' | 'in_progress' | 'success' | 'failure' | 'error' | 'waiting';
    environment: string;
    updated_at: string;
    target_url?: string;
  };
  created_at: string;
  updated_at: string;
  html_url: string;
  branch: string;
  duration: number;
  artifacts?: Artifact[];
  test_summary?: {
    passed: number;
    failed: number;
    coverage: number;
    details?: {
      testFile: string;
      testCase: string;
      error?: string;
    }[];
  };
  deployment_id?: string;
  commit_hash?: string;
  commit_message?: string;
}

export interface RunHistoryStats {
  successRate: number;
  avgDuration: number;
  failureTrend: {
    date: string;
    count: number;
  }[];
  testStats: {
    totalPassed: number;
    totalFailed: number;
    flakyTests: {
      name: string;
      failRate: number;
    }[];
  };
}

export type ActiveTab = 'ci' | 'security' | 'deployments' | 'artifacts';
export type StatsTimeRange = '7d' | '30d';

export const getWorkflowStatus = (status: string, conclusion: string): Status => {
  if (status === 'queued') return 'queued';
  if (status === 'in_progress') return 'in_progress';
  if (status === 'completed') {
    switch (conclusion) {
      case 'success': return 'success';
      case 'failure': return 'error';
      case 'neutral': return 'neutral';
      case 'cancelled': return 'cancelled';
      case 'timed_out': return 'timed_out';
      case 'action_required': return 'action_required';
      default: return 'neutral';
    }
  }
  return 'idle';
};
