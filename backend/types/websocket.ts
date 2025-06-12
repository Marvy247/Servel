import { GitHubWorkflowRun } from './dashboard';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface SubscribeMessage extends WebSocketMessage {
  type: 'subscribe';
  repositories: string[];
}

export interface WorkflowUpdateMessage extends WebSocketMessage {
  type: 'workflow_update';
  repository: string;
  data: GitHubWorkflowRun;
}

export interface ErrorMessage extends WebSocketMessage {
  type: 'error';
  message: string;
  code: number;
}
