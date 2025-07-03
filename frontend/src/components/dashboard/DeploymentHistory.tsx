import { useState, useEffect } from 'react';
import { StatusBadge, type Status } from './StatusBadge';
import { Tooltip } from '../ui/Tooltip';

interface Deployment {
  id: string;
  timestamp: string;
  environment: 'production' | 'staging' | 'development';
  status: 'success' | 'failed' | 'pending' | 'in_progress';
  commit: {
    hash: string;
    message: string;
    author: string;
    url: string;
  };
  duration?: number;
  metadata?: {
    branch?: string;
    trigger?: 'manual' | 'auto';
    buildId?: string;
    deploymentUrl?: string;
  };
}

interface DeploymentStats {
  totalDeployments: number;
  successRate: number;
  averageDuration: number;
  environmentBreakdown: Record<string, number>;
  recentTrends: {
    date: string;
    successful: number;
    failed: number;
  }[];
  triggerTypes: {
    manual: number;
    auto: number;
  };
}

interface DeploymentHistoryProps {
  projectId: string;
}

export function DeploymentHistory({ projectId }: DeploymentHistoryProps) {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [stats, setStats] = useState<DeploymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [environments, setEnvironments] = useState<string[]>([]);
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [envRes, branchRes] = await Promise.all([
          fetch(`/api/dashboard/deployments/${projectId}/environments`),
          fetch(`/api/dashboard/deployments/${projectId}/branches`)
        ]);
        setEnvironments(await envRes.json());
        setBranches(await branchRes.json());
        setStatuses(['success', 'failed', 'pending', 'in_progress']);
      } catch (err) {
        console.error('Failed to load filters', err);
      }
    };

    const fetchDeployments = async () => {
      try {
        const params = new URLSearchParams();
        params.append('range', timeRange);
        if (selectedEnvironments.length) params.append('environments', selectedEnvironments.join(','));
        if (selectedStatuses.length) params.append('statuses', selectedStatuses.join(','));
        if (selectedBranch) params.append('branch', selectedBranch);

        const response = await fetch(`/api/dashboard/deployments/${projectId}?${params.toString()}`);
        const data = await response.json();
        const deployments = data.deployments || [];
        setDeployments(deployments);
        
        // Calculate stats
        const stats: DeploymentStats = {
          totalDeployments: deployments.length,
          successRate: 0,
          averageDuration: 0,
          environmentBreakdown: {},
          recentTrends: [],
          triggerTypes: { manual: 0, auto: 0 }
        };

        // Calculate success rate
        const successful = deployments.filter((d: Deployment) => d.status === 'success').length;
        stats.successRate = deployments.length ? (successful / deployments.length) * 100 : 0;

        // Calculate average duration
        const totalDuration = deployments.reduce((sum: number, d: Deployment) => sum + (d.duration || 0), 0);
        stats.averageDuration = deployments.length ? totalDuration / deployments.length : 0;

        // Environment breakdown
        deployments.forEach((d: Deployment) => {
          stats.environmentBreakdown[d.environment] = (stats.environmentBreakdown[d.environment] || 0) + 1;
        });

        // Trigger types
        deployments.forEach((d: Deployment) => {
          if (d.metadata?.trigger === 'manual') stats.triggerTypes.manual++;
          if (d.metadata?.trigger === 'auto') stats.triggerTypes.auto++;
        });

        // Recent trends (last 7 days)
        const last7Days = [...Array(7)].map((_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date.toISOString().split('T')[0];
        });

        stats.recentTrends = last7Days.map(date => ({
          date,
          successful: deployments.filter((d: Deployment) => 
            d.timestamp.startsWith(date) && d.status === 'success'
          ).length,
          failed: deployments.filter((d: Deployment) => 
            d.timestamp.startsWith(date) && d.status === 'failed'
          ).length
        }));

        setStats(stats);
      } catch (err) {
        setError('Failed to load deployment history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFilters();
    fetchDeployments();
  }, [projectId, timeRange, selectedEnvironments, selectedStatuses, selectedBranch]);

  const getStatus = (status: string): Status => {
    switch (status) {
      case 'success': return 'success';
      case 'failed': return 'error';
      case 'pending': return 'pending';
      case 'in_progress': return 'deploying';
      default: return 'neutral';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 
      ? `${minutes}m ${remainingSeconds}s`
      : `${remainingSeconds}s`;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) return <div>Loading deployment history...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Deployment History</h3>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center space-x-1">
            <label className="text-sm">Environments:</label>
            <select
              multiple
              value={selectedEnvironments}
              onChange={(e) => setSelectedEnvironments(
                Array.from(e.target.selectedOptions, option => option.value)
              )}
              className="border rounded px-2 py-1 text-sm"
            >
              {environments.map(env => (
                <option key={env} value={env}>{env}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <label className="text-sm">Status:</label>
            <select
              multiple
              value={selectedStatuses}
              onChange={(e) => setSelectedStatuses(
                Array.from(e.target.selectedOptions, option => option.value)
              )}
              className="border rounded px-2 py-1 text-sm"
            >
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <label className="text-sm">Branch:</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">All</option>
              {branches.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>

          <div className="flex space-x-2">
            <button
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1 text-sm rounded ${timeRange === '7d' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
          >
            Last 7 days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1 text-sm rounded ${timeRange === '30d' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
          >
            Last 30 days
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-3 py-1 text-sm rounded ${timeRange === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
          >
            All
          </button>
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 border rounded-lg">
            <h4 className="text-sm font-medium mb-2">Deployment Success Rate</h4>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
              <StatusBadge status={stats.successRate > 90 ? 'success' : stats.successRate > 70 ? 'action_required' : 'error'} />
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Total: {stats.totalDeployments} deployments
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="text-sm font-medium mb-2">Average Duration</h4>
            <div className="text-2xl font-bold">
              {formatDuration(stats.averageDuration)}
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Across all environments
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="text-sm font-medium mb-2">Deployment Triggers</h4>
            <div className="flex justify-between">
              <div>
                <div className="text-sm">Manual</div>
                <div className="text-xl font-bold">{stats.triggerTypes.manual}</div>
              </div>
              <div>
                <div className="text-sm">Automated</div>
                <div className="text-xl font-bold">{stats.triggerTypes.auto}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {deployments.length === 0 ? (
          <div className="text-gray-500">No deployments found</div>
        ) : (
          <div className="border-l border-gray-200 pl-4 space-y-8">
            {deployments.map((deployment) => (
              <div key={deployment.id} className="relative">
                <div className={`absolute w-3 h-3 rounded-full -left-[1.4rem] top-1.5 border border-white ${
                  deployment.status === 'success' ? 'bg-green-500' :
                  deployment.status === 'failed' ? 'bg-red-500' :
                  deployment.status === 'pending' || deployment.status === 'in_progress' ? 'bg-blue-500' :
                  'bg-gray-500'
                }`}></div>
                <div className="p-4 border rounded-lg bg-white">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={getStatus(deployment.status)} />
                        <span className="font-medium capitalize">{deployment.environment}</span>
                        {deployment.duration && (
                          <span className="text-sm text-gray-500">
                            {formatDuration(deployment.duration)}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDate(deployment.timestamp)}
                      </div>
                    </div>
                    <div className="text-sm">
                      <Tooltip content={deployment.commit.hash}>
                        <a
                          href={deployment.commit.url}
                          className="text-blue-500 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {deployment.commit.hash.substring(0, 7)}
                        </a>
                      </Tooltip>
                      {deployment.metadata?.deploymentUrl && (
                        <a
                          href={deployment.metadata.deploymentUrl}
                          className="ml-2 text-blue-500 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Deployment
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 text-sm">
                    <p className="font-medium">{deployment.commit.message}</p>
                    <p className="text-gray-500">by {deployment.commit.author}</p>
                  </div>

                  {deployment.metadata && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex flex-wrap gap-2 text-xs">
                        {deployment.metadata.branch && (
                          <span className="px-2 py-1 bg-gray-100 rounded">
                            Branch: {deployment.metadata.branch}
                          </span>
                        )}
                        {deployment.metadata.trigger && (
                          <span className="px-2 py-1 bg-gray-100 rounded capitalize">
                            Trigger: {deployment.metadata.trigger}
                          </span>
                        )}
                        {deployment.metadata.buildId && (
                          <span className="px-2 py-1 bg-gray-100 rounded">
                            Build: {deployment.metadata.buildId}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
