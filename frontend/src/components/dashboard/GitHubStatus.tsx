import { useState, useCallback, useEffect } from 'react';
import { SecurityTab } from './github/tabs/SecurityTab';
import { StatusBadge } from './github/components/StatusBadge';
import { StatsSection } from './github/components/StatsSection';
import { RunList } from './github/components/RunList';
import { useGitHubRuns } from './github/hooks/useGitHubRuns';
import { useDeployments } from './github/hooks/useDeployments';
import { calculateRunStats, filterRecentRuns } from './github/utils/calculateStats';
import type { 
  GitHubStatusProps, 
  ActiveTab, 
  StatsTimeRange,
  WorkflowRun,
  Deployment,
  RunHistoryStats
} from './types/github';

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
  testStats: stats.testStats && {
    totalPassed: stats.testStats.totalPassed,
    totalFailed: stats.testStats.totalFailed, 
    flakyTests: stats.testStats.flakyTests || []
  }
});

export function GitHubStatus({ repo, workflow, branch }: GitHubStatusProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ci');
  const [selectedBranch, setSelectedBranch] = useState(branch || '');
  const [selectedWorkflow, setSelectedWorkflow] = useState(workflow || '');
  const { runs, loading, error, refetch } = useGitHubRuns({
    repo,
    workflow: selectedWorkflow,
    branch: selectedBranch
  });
  const { deployments, loading: deploymentLoading } = useDeployments(repo);
  const fetchRuns = useCallback(() => refetch(), [refetch]);
  const [statsTimeRange, setStatsTimeRange] = useState<StatsTimeRange>('7d');
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  useEffect(() => {
    fetchRuns();
    if (activeTab === 'deployments') {
      // Deployments are automatically fetched by the useDeployments hook
    }
  }, [fetchRuns, activeTab]);

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
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-1 border rounded"
          >
            {branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
          <select
            value={selectedWorkflow}
            onChange={(e) => setSelectedWorkflow(e.target.value)}
            className="px-3 py-1 border rounded"
          >
            {workflows.map((workflow) => (
              <option key={workflow} value={workflow}>
                {workflow}
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

      <StatsSection stats={stats} testCoverage={testCoverage.replace('%', '')} />

      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('ci')}
          className={`px-4 py-2 ${activeTab === 'ci' ? 'border-b-2 border-blue-500' : ''}`}
        >
          CI Runs
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 ${activeTab === 'security' ? 'border-b-2 border-blue-500' : ''}`}
        >
          Security
        </button>
        <button
          onClick={() => setActiveTab('deployments')}
          className={`px-4 py-2 ${activeTab === 'deployments' ? 'border-b-2 border-blue-500' : ''}`}
        >
          Deployments
        </button>
      </div>

      {activeTab === 'ci' && (
        <RunList 
          runs={recentRuns} 
          expandedRun={expandedRun} 
          onRunClick={handleRunClick} 
        />
      )}

      {activeTab === 'security' && <SecurityTab repo={repo} />}

      {activeTab === 'deployments' && (
        <div className="space-y-2">
          {deploymentLoading ? (
            <div>Loading deployments...</div>
          ) : deployments && deployments.length > 0 ? (
            deployments.map((deployment) => (
              <div key={deployment.id} className="p-3 border rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{deployment.environment}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(deployment.created_at).toLocaleString()}
                    </div>
                  </div>
                  <StatusBadge
                    status={deployment.status === 'active' ? 'completed' : 'in_progress'}
                  />
                </div>
              </div>
            ))
          ) : null}
        </div>
      )}
    </div>
  );
}
