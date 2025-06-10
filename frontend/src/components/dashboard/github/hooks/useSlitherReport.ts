import { useState, useCallback, useEffect } from 'react';
import type { SlitherFinding } from '@/types/github';

interface UseSlitherReportProps {
  repo: string;
}

export function useSlitherReport({ repo }: UseSlitherReportProps) {
  const [report, setReport] = useState<{results: SlitherFinding[]} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSlitherReport = useCallback(async (repo: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/github/${repo}/slither`);
      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError('Failed to fetch slither report');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (repo) {
      fetchSlitherReport(repo);
    }
  }, [repo, fetchSlitherReport]);

  return { report, loading, error, refetch: fetchSlitherReport };
}
