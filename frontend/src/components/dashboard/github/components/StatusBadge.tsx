export type WorkflowStatus = 'completed' | 'in_progress' | 'queued' | 'failed';

export interface StatusBadgeProps {
  status: WorkflowStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusColors: Record<WorkflowStatus, string> = {
    completed: 'bg-green-100 text-green-800',
    in_progress: 'bg-blue-100 text-blue-800',
    queued: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
  };

  const statusText: Record<WorkflowStatus, string> = {
    completed: 'Completed',
    in_progress: 'In Progress',
    queued: 'Queued',
    failed: 'Failed',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
      {statusText[status]}
    </span>
  );
};
