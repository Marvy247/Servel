/**
 * Functions for calculating statistics from GitHub data
 */

import { WorkflowRun } from '../../../../types/github';

export interface RunStats {
  successCount: number;
  failureCount: number;
  totalDuration: number;
  avgDuration: number;
  successRate: number;
}

export const calculateRunStats = (runs: WorkflowRun[]): RunStats => {
  const stats: RunStats = {
    successCount: 0,
    failureCount: 0,
    totalDuration: 0,
    avgDuration: 0,
    successRate: 0
  };

  if (!runs.length) return stats;

  runs.forEach(run => {
    if (run.conclusion === 'success') {
      stats.successCount++;
    } else {
      stats.failureCount++;
    }
    stats.totalDuration += run.duration;
  });

  stats.avgDuration = stats.totalDuration / runs.length;
  stats.successRate = (stats.successCount / runs.length) * 100;

  return stats;
};

export const filterRecentRuns = (runs: WorkflowRun[], days = 7): WorkflowRun[] => {
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
  return runs.filter(run => new Date(run.created_at).getTime() > cutoff);
};
