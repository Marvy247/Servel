import { StatusBadge, type WorkflowStatus } from './StatusBadge';
import type { WorkflowRun } from '../../types/github';

interface RunListProps {
  runs: WorkflowRun[];
  expandedRun: string | null;
  onRunClick: (runId: string) => void;
}

export const RunList = ({ runs, expandedRun, onRunClick }: RunListProps) => (
  <div className="space-y-2">
    {runs.map((run) => (
      <div 
        key={run.id}
        className="p-4 border rounded cursor-pointer hover:bg-gray-50"
        onClick={() => onRunClick(run.id.toString())}
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
            {run.conclusion && <p>Result: {run.conclusion}</p>}
          </div>
        )}
      </div>
    ))}
  </div>
);
