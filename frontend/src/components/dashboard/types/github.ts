export interface WorkflowRun {
  id: number;
  name: string;
  status: 'completed' | 'in_progress' | 'queued' | 'failed';
  conclusion: string | null;
  branch: string;
  created_at: string;
  duration: number;
}

export interface Deployment {
  id: number;
  environment: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  created_at: string;
  sha: string;
  description?: string;
}
