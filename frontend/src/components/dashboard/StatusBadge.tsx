'use client'

import { ReactNode } from 'react';

export type Status = 'idle' | 'pending' | 'success' | 'error' | 
                   'queued' | 'in_progress' | 'completed' |
                   'neutral' | 'cancelled' | 'skipped' | 
                   'timed_out' | 'action_required' |
                   'deploying' | 'rolled_back';

interface StatusBadgeProps {
  status: Status;
}

const statusColors: Record<Status, string> = {
  idle: 'bg-gray-100 text-gray-800',
  pending: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
  queued: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  neutral: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-yellow-100 text-yellow-800',
  skipped: 'bg-gray-100 text-gray-800',
  timed_out: 'bg-red-100 text-red-800',
  action_required: 'bg-yellow-100 text-yellow-800',
  deploying: 'bg-purple-100 text-purple-800',
  rolled_back: 'bg-orange-100 text-orange-800'
};

const statusText: Record<Status, string> = {
  idle: 'Idle',
  pending: 'Pending',
  success: 'Success',
  error: 'Error',
  queued: 'Queued',
  in_progress: 'In Progress',
  completed: 'Completed',
  neutral: 'Neutral',
  cancelled: 'Cancelled',
  skipped: 'Skipped',
  timed_out: 'Timed Out',
  action_required: 'Action Required',
  deploying: 'Deploying',
  rolled_back: 'Rolled Back'
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
      {statusText[status]}
    </span>
  );
}
