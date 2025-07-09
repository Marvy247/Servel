import { useState, useCallback, useEffect } from 'react';
import { FiGitBranch, FiZap, FiShield, FiUploadCloud, FiClock, FiCheckCircle, FiXCircle, FiAlertTriangle } from 'react-icons/fi';
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
  }, [fetchRuns, activeTab, selectedBranch, selectedWorkflow]);

  const handleRunClick = (runId: string) => {
    setExpandedRun(expandedRun === runId ? null : runId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
        <div className="flex items-center">
          <FiAlertTriangle className="text-red-500 mr-2" />
          <h3 className="text-sm font-medium text-red-800">{error}</h3>
        </div>
      </div>
    );
  }

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">GitHub Workflow Status</h2>
            <p className="text-sm text-gray-500">Repository: {repo}</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiGitBranch className="text-gray-400" />
              </div>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                {branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiZap className="text-gray-400" />
              </div>
              <select
                value={selectedWorkflow}
                onChange={(e) => setSelectedWorkflow(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                {workflows.map((workflow) => (
                  <option key={workflow} value={workflow}>
                    {workflow}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-gray-700">Workflow Statistics</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setStatsTimeRange('7d')}
              className={`px-3 py-1 text-xs font-medium rounded-full ${
                statsTimeRange === '7d' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setStatsTimeRange('30d')}
              className={`px-3 py-1 text-xs font-medium rounded-full ${
                statsTimeRange === '30d' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Last 30 Days
            </button>
          </div>
        </div>
        
        <StatsSection stats={stats} testCoverage={testCoverage.replace('%', '')} />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('ci')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium ${
              activeTab === 'ci' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FiZap className="text-current" />
            CI Runs
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium ${
              activeTab === 'security' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FiShield className="text-current" />
            Security
          </button>
          <button
            onClick={() => setActiveTab('deployments')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium ${
              activeTab === 'deployments' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FiUploadCloud className="text-current" />
            Deployments
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'ci' && (
          <RunList 
            runs={recentRuns} 
            expandedRun={expandedRun} 
            onRunClick={handleRunClick} 
          />
        )}

        {activeTab === 'security' && <SecurityTab repo={repo} />}

        {activeTab === 'deployments' && (
          <div className="space-y-3">
            {deploymentLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : deployments && deployments.length > 0 ? (
              deployments.map((deployment) => (
                <div key={deployment.id} className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{deployment.environment}</span>
                        <StatusBadge
                          status={deployment.status === 'active' ? 'completed' : 'in_progress'}
                        />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <FiClock className="text-gray-400" />
                        <span>{new Date(deployment.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {deployment.status === 'active' ? (
                        <FiCheckCircle className="text-green-500" />
                      ) : (
                        <FiXCircle className="text-yellow-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No deployments found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}