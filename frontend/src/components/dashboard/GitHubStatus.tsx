import { useState, useEffect, useCallback } from 'react';
import { SecurityTab } from './github/tabs/SecurityTab';
import { StatusBadge } from './StatusBadge';
import { getWorkflowStatus } from '../../types/github';
import StatsCard from './github/components/StatsCard';
import { calculateRunStats, filterRecentRuns } from './github/utils/calculateStats';
import WorkflowRunItem from './github/components/WorkflowRunItem';
import type { 
  GitHubStatusProps, 
  SlitherFinding, 
  RunHistoryStats, 
  ActiveTab, 
  StatsTimeRange,
  WorkflowRun 
} from '../../types/github';

interface RunStats {
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

const createStats = (
  stats: Partial<RunHistoryStats>,
  calculated: ReturnType<typeof calculateRunStats>
): RunStats => ({
  avgDuration: calculated.avgDuration,
  successRate: calculated.successRate,
  failureRate: calculated.failureCount / (calculated.successCount + calculated.failureCount) * 100,
  totalRuns: calculated.successCount + calculated.failureCount,
  successCount: calculated.successCount,
  failureCount: calculated.failureCount,
  totalDuration: calculated.totalDuration,
  testStats: stats.testStats ? {
    totalPassed: stats.testStats.totalPassed,
    totalFailed: stats.testStats.totalFailed,
    flakyTests: stats.testStats.flakyTests || []
  } : undefined
});


export function GitHubStatus({ repo, workflow, branch }: GitHubStatusProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ci');
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(branch || '');
  const [selectedWorkflow, setSelectedWorkflow] = useState(workflow || '');
  const [deployments, setDeployments] = useState<any[]>([]);
  const [deploymentLoading, setDeploymentLoading] = useState(false);

  const [statsTimeRange, setStatsTimeRange] = useState<StatsTimeRange>('7d');
  const [expandedRun, setExpandedRun] = useState<string | null>(null);


  const fetchRuns = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/github/${repo}/actions/runs?workflow=${selectedWorkflow}&branch=${selectedBranch}`
      );
      const data = await response.json();
      setRuns(data.workflow_runs || []);
    } catch (err) {
      setError('Failed to fetch workflow runs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [repo, selectedWorkflow, selectedBranch]);

  const fetchDeployments = useCallback(async () => {
    setDeploymentLoading(true);
    try {
      const response = await fetch(`/api/github/${repo}/deployments`);
      const data = await response.json();
      setDeployments(data.deployments || []);
    } catch (err) {
      console.error('Failed to fetch deployments:', err);
    } finally {
      setDeploymentLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    fetchRuns();
    if (activeTab === 'deployments') {
      fetchDeployments();
    }
  }, [fetchRuns, fetchDeployments, activeTab]);

  const handleRunClick = (runId: string) => {
    setExpandedRun(expandedRun === runId ? null : runId);
  };

  if (loading) return <div>Loading GitHub Actions...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  const branches = [...new Set(runs.map(run => run.branch))];
  const workflows = [...new Set(runs.map(run => run.name))];
  const calculatedStats = calculateRunStats(runs);
  
  const stats = createStats({
    testStats: runs[0]?.test_summary ? {
      totalPassed: runs[0].test_summary.passed,
      totalFailed: runs[0].test_summary.failed,
      flakyTests: []
    } : undefined
  }, calculatedStats);

  const testCoverage = runs[0]?.test_summary?.coverage ? `${runs[0].test_summary.coverage}%` : '0%';
  const recentRuns = filterRecentRuns(runs, statsTimeRange === '7d' ? 7 : 30);

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <nav className="flex space-x-4">
          {['ci', 'security', 'deployments'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as ActiveTab)}
              className={`px-4 py-2 rounded ${
                activeTab === tab ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex space-x-4">
          <select
            value={selectedWorkflow}
            onChange={(e) => setSelectedWorkflow(e.target.value)}
            className="border rounded px-3 py-1"
          >
            {workflows.map((wf) => (
              <option key={wf} value={wf}>
                {wf}
              </option>
            ))}
          </select>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="border rounded px-3 py-1"
          >
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setStatsTimeRange('7d')}
            className={`px-3 py-1 rounded ${statsTimeRange === '7d' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            7 Days
          </button>
          <button
            onClick={() => setStatsTimeRange('30d')}
            className={`px-3 py-1 rounded ${statsTimeRange === '30d' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            30 Days
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Success Rate"
          stats={{
            ...stats,
            successRate: stats.successRate,
            avgDuration: stats.avgDuration
          }}
          icon={<span>✅</span>}
        />
        <StatsCard
          title="Duration"
          stats={{
            ...stats,
            successRate: 100, // Not used for duration card
            avgDuration: stats.avgDuration
          }}
          icon={<span>⏱️</span>}
        />
        <StatsCard
          title="Coverage"
          stats={{
            ...stats,
            successRate: parseFloat(testCoverage.replace('%', '')),
            avgDuration: 0 // Not used for coverage card
          }}
          icon={<span>📊</span>}
        />
      </div>

      {activeTab === 'security' && <SecurityTab repo={repo} />}

      {activeTab === 'ci' && (
        <div className="space-y-2">
          {recentRuns.map((run) => (
            <div 
              key={run.id}
              className="p-4 border rounded cursor-pointer hover:bg-gray-50"
              onClick={() => handleRunClick(run.id.toString())}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{run.name}</span>
                <StatusBadge status={run.status} />
              </div>
              {expandedRun === run.id.toString() && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>Branch: {run.branch}</p>
                  <p>Duration: {(run.duration / 60).toFixed(1)} minutes</p>
                  <p>Started: {new Date(run.created_at).toLocaleString()}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
