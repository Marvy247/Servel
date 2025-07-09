import { useState, useEffect } from 'react';
import { StatusBadge, type Status } from './StatusBadge';
import { Tooltip } from '../ui/Tooltip';
import { FiClock, FiGitBranch, FiUser, FiPlay, FiZap, FiCalendar, FiExternalLink, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { FaRegDotCircle } from 'react-icons/fa';

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
        
        const stats: DeploymentStats = {
          totalDeployments: deployments.length,
          successRate: 0,
          averageDuration: 0,
          environmentBreakdown: {},
          recentTrends: [],
          triggerTypes: { manual: 0, auto: 0 }
        };

        const successful = deployments.filter((d: Deployment) => d.status === 'success').length;
        stats.successRate = deployments.length ? (successful / deployments.length) * 100 : 0;

        const totalDuration = deployments.reduce((sum: number, d: Deployment) => sum + (d.duration || 0), 0);
        stats.averageDuration = deployments.length ? totalDuration / deployments.length : 0;

        deployments.forEach((d: Deployment) => {
          stats.environmentBreakdown[d.environment] = (stats.environmentBreakdown[d.environment] || 0) + 1;
        });

        deployments.forEach((d: Deployment) => {
          if (d.metadata?.trigger === 'manual') stats.triggerTypes.manual++;
          if (d.metadata?.trigger === 'auto') stats.triggerTypes.auto++;
        });

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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
        <div className="flex items-center">
          <FiAlertCircle className="text-red-500 mr-2" />
          <h3 className="text-sm font-medium text-red-800">{error}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Deployment History</h2>
          <p className="text-sm text-gray-500">Track and analyze your deployment activity</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col min-w-[180px]">
            <label className="text-xs font-medium text-gray-500 mb-1">Time Range</label>
            <div className="inline-flex rounded-md shadow-sm">
              <button
                onClick={() => setTimeRange('7d')}
                className={`px-3 py-1.5 text-sm font-medium rounded-l-md ${
                  timeRange === '7d' 
                    ? 'bg-blue-50 text-blue-600 border-blue-100 border' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200 border'
                }`}
              >
                7 days
              </button>
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-3 py-1.5 text-sm font-medium -ml-px ${
                  timeRange === '30d' 
                    ? 'bg-blue-50 text-blue-600 border-blue-100 border' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200 border'
                }`}
              >
                30 days
              </button>
              <button
                onClick={() => setTimeRange('all')}
                className={`px-3 py-1.5 text-sm font-medium rounded-r-md -ml-px ${
                  timeRange === 'all' 
                    ? 'bg-blue-50 text-blue-600 border-blue-100 border' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200 border'
                }`}
              >
                All
              </button>
            </div>
          </div>

          <div className="flex flex-col min-w-[180px]">
            <label className="text-xs font-medium text-gray-500 mb-1">Environment</label>
            <select
              multiple
              value={selectedEnvironments}
              onChange={(e) => setSelectedEnvironments(
                Array.from(e.target.selectedOptions, option => option.value)
              )}
              className="border-gray-200 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {environments.map(env => (
                <option key={env} value={env} className="capitalize">{env}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col min-w-[180px]">
            <label className="text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              multiple
              value={selectedStatuses}
              onChange={(e) => setSelectedStatuses(
                Array.from(e.target.selectedOptions, option => option.value)
              )}
              className="border-gray-200 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {statuses.map(status => (
                <option key={status} value={status} className="capitalize">{status.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col min-w-[180px]">
            <label className="text-xs font-medium text-gray-500 mb-1">Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="border-gray-200 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All branches</option>
              {branches.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500">Success Rate</h3>
              <StatusBadge status={stats.successRate > 90 ? 'success' : stats.successRate > 70 ? 'action_required' : 'error'} />
            </div>
            <div className="flex items-end space-x-2">
              <span className="text-3xl font-bold text-gray-900">{stats.successRate.toFixed(1)}%</span>
              <span className="text-sm text-gray-500 pb-1">of {stats.totalDeployments} deploys</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Average Duration</h3>
            <div className="flex items-center space-x-2">
              <FiClock className="text-gray-400" />
              <span className="text-3xl font-bold text-gray-900">{formatDuration(stats.averageDuration)}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Trigger Types</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FiPlay className="text-blue-500" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Manual</div>
                  <div className="text-xl font-bold text-gray-900">{stats.triggerTypes.manual}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <FiZap className="text-green-500" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Automated</div>
                  <div className="text-xl font-bold text-gray-900">{stats.triggerTypes.auto}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {deployments.length === 0 ? (
          <div className="p-12 text-center">
            <FaRegDotCircle className="mx-auto h-10 w-10 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No deployments found</h3>
            <p className="mt-1 text-sm text-gray-500">Adjust your filters or make your first deployment.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {deployments.map((deployment) => (
              <li key={deployment.id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`mt-1 flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full ${
                      deployment.status === 'success' ? 'bg-green-100 text-green-600' :
                      deployment.status === 'failed' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {deployment.status === 'success' ? (
                        <FiCheckCircle className="h-4 w-4" />
                      ) : deployment.status === 'failed' ? (
                        <FiAlertCircle className="h-4 w-4" />
                      ) : (
                        <FiClock className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {deployment.environment}
                        </span>
                        <StatusBadge status={getStatus(deployment.status)} />
                        {deployment.duration && (
                          <span className="text-xs text-gray-500">
                            {formatDuration(deployment.duration)}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-medium text-gray-900 truncate">
                        {deployment.commit.message}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <FiCalendar className="text-gray-400" />
                          <span>{formatDate(deployment.timestamp)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FiUser className="text-gray-400" />
                          <span>{deployment.commit.author}</span>
                        </div>
                        {deployment.metadata?.branch && (
                          <div className="flex items-center space-x-1">
                            <FiGitBranch className="text-gray-400" />
                            <span>{deployment.metadata.branch}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Tooltip content={deployment.commit.hash}>
                      <a
                        href={deployment.commit.url}
                        className="text-xs font-mono bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-md transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {deployment.commit.hash.substring(0, 7)}
                      </a>
                    </Tooltip>
                    {deployment.metadata?.deploymentUrl && (
                      <a
                        href={deployment.metadata.deploymentUrl}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FiExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}