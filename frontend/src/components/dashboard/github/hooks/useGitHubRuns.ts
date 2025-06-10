import { useState, useEffect, useCallback } from 'react';
import type { WorkflowRun } from '../../types/github';

interface UseGitHubRunsProps {
  repo: string;
  workflow: string;
  branch: string;
}

export const useGitHubRuns = ({ repo, workflow, branch }: UseGitHubRunsProps) => {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/github/${repo}/actions/runs?workflow=${workflow}&branch=${branch}`
      );
      const data = await response.json();
      setRuns(data.workflow_runs || []);
    } catch (err) {
      setError('Failed to fetch workflow runs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [repo, workflow, branch]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  return { runs, loading, error, refetch: fetchRuns };
};
