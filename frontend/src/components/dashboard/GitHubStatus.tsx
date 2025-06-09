import { useState, useEffect, useCallback } from 'react';
import { StatusBadge, type Status } from './StatusBadge';

interface GitHubStatusProps {
  repo: string;
  workflow?: string;
  branch?: string;
}

interface Artifact {
  id: number;
  name: string;
  size: number;
  url: string;
}

interface WorkflowRun {
  id: string;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required';
  created_at: string;
  updated_at: string;
  html_url: string;
  branch: string;
  duration: number;
  artifacts?: Artifact[];
}

export function GitHubStatus({ repo, workflow, branch }: GitHubStatusProps) {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(branch || '');
  const [selectedWorkflow, setSelectedWorkflow] = useState(workflow || '');

  const fetchRuns = useCallback(async (forceRefresh = false) => {
    try {
      const params = new URLSearchParams();
      if (selectedWorkflow) params.append('workflow', selectedWorkflow);
      if (selectedBranch) params.append('branch', selectedBranch);
      if (forceRefresh) params.append('forceRefresh', 'true');
      
      const response = await fetch(`/api/dashboard/github/actions?${params.toString()}`);
      const { runs } = await response.json();
      setRuns(runs || []);
    } catch (err) {
      setError('Failed to load GitHub Actions data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [repo, selectedWorkflow, selectedBranch]);

  useEffect(() => {
    fetchRuns();
    const interval = setInterval(fetchRuns, 60000); // Refresh every minute
    
    return () => {
      clearInterval(interval);
    };
  }, [fetchRuns]);

  const downloadArtifact = async (runId: string, artifactId: number) => {
    try {
      const response = await fetch(`/api/dashboard/github/actions/${runId}/artifacts/${artifactId}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `artifact-${artifactId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download artifact');
      console.error(err);
    }
  };

  const getStatus = (status: string, conclusion: string): Status => {
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

  if (loading) return <div>Loading GitHub Actions...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  const branches = [...new Set(runs.map(run => run.branch))];
  const workflows = [...new Set(runs.map(run => run.name))];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">GitHub Actions</h3>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-4">
        <select 
          value={selectedWorkflow}
          onChange={(e) => setSelectedWorkflow(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">All Workflows</option>
          {workflows.map(wf => (
            <option key={wf} value={wf}>{wf}</option>
          ))}
        </select>

        <select 
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">All Branches</option>
          {branches.map(br => (
            <option key={br} value={br}>{br}</option>
          ))}
        </select>
        </div>
        <button 
          onClick={() => fetchRuns(true)}
          className="p-2 bg-blue-100 hover:bg-blue-200 rounded"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-2">
        {runs.length === 0 ? (
          <div className="text-gray-500">No workflow runs found</div>
        ) : (
          runs.map((run) => (
            <div key={run.id} className="p-3 border rounded hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <StatusBadge 
                    status={getStatus(run.status, run.conclusion)} 
                  />
                  <div>
                    <a 
                      href={run.html_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {run.name}
                    </a>
                    <div className="text-xs text-gray-500">{run.branch}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    {new Date(run.updated_at).toLocaleString()}
                  </div>
                  {run.duration > 0 && (
                    <div className="text-sm text-gray-500">
                      {run.duration < 60000 
                        ? `${Math.round(run.duration / 1000)} sec`
                        : `${Math.round(run.duration / 1000 / 60)} min`}
                    </div>
                  )}
                </div>
              </div>
              
              {run.artifacts && run.artifacts.length > 0 && (
                <div className="mt-2 pt-2 border-t">
                  <h4 className="text-sm font-medium mb-1">Artifacts:</h4>
                  <div className="flex flex-wrap gap-2">
                    {run.artifacts.map(artifact => (
                      <button
                        key={artifact.id}
                        onClick={() => downloadArtifact(run.id, artifact.id)}
                        className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                      >
                        {artifact.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
