import WebSocket from 'ws';
import { IncomingMessage } from 'http';
import { WebSocketServer } from 'ws';
import { AuthenticatedRequest } from '../../types/request';
import axios from 'axios';
import { GitHubWorkflowRun } from '../../types/dashboard';
import { WorkflowRun } from '../../types/github';
import { WebSocketMessage, SubscribeMessage, WorkflowUpdateMessage } from '../../types/websocket';

interface GitHubWebhookPayload {
  action: string;
  repository: {
    full_name: string;
    html_url: string;
  };
  workflow_run: {
    id: number;
    url: string;
    head_branch?: string;
    head_sha: string;
    head_commit?: {
      message?: string;
      author?: {
        name?: string;
      };
    };
  };
}

interface Client {
  socket: WebSocket;
  userId: string;
  repositories: Set<string>;
}

class GitHubWebhookService {
  private wss: WebSocketServer;
  private clients: Map<string, Client> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(server: any) {
    this.wss = new WebSocketServer({ server });
    this.setupConnectionHandling();
    this.setupPingInterval();
  }

  private setupConnectionHandling() {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) {
        ws.close(1008, 'Unauthorized');
        return;
      }

      const clientId = this.generateClientId();
      this.clients.set(clientId, {
        socket: ws,
        userId,
        repositories: new Set()
      });

      ws.on('message', (message: string) => this.handleMessage(clientId, message));
      ws.on('close', () => this.handleClose(clientId));
    });
  }

  private setupPingInterval() {
    this.pingInterval = setInterval(() => {
      this.clients.forEach(client => {
        if (client.socket.readyState === WebSocket.OPEN) {
          client.socket.ping();
        }
      });
    }, 30000);
  }

  private generateClientId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private handleMessage(clientId: string, message: string) {
    try {
      const data: WebSocketMessage = JSON.parse(message);
      const client = this.clients.get(clientId);
      
      if (data.type === 'subscribe') {
        const subscribeMsg = data as SubscribeMessage;
        subscribeMsg.repositories.forEach((repo: string) => {
          client?.repositories.add(repo);
        });
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  private handleClose(clientId: string) {
    this.clients.delete(clientId);
  }

  private broadcastWorkflowUpdate(repository: string, workflowData: GitHubWorkflowRun) {
    const message: WorkflowUpdateMessage = {
      type: 'workflow_update',
      repository,
      data: workflowData
    };

    this.clients.forEach(client => {
      if (client.repositories.has(repository) && client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(JSON.stringify(message));
      }
    });
  }

  public async processGitHubWebhook(payload: GitHubWebhookPayload) {
    try {
      const { repository, workflow_run } = payload;
      const action = payload.action || 'completed';
      const repoFullName = repository.full_name;
      
      // Only process completed workflow runs
      if (action !== 'completed') return;

      const { data } = await axios.get<WorkflowRun>(workflow_run.url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      const workflowData: GitHubWorkflowRun = {
        id: data.id,
        name: data.name,
        status: data.status,
        conclusion: data.conclusion,
        created_at: data.created_at,
        updated_at: data.updated_at,
        html_url: data.html_url,
        branch: data.head_branch || 'main',
        commit: {
          id: data.head_sha,
          message: data.head_commit?.message || '',
          author: data.head_commit?.author?.name || ''
        }
      };

      this.broadcastWorkflowUpdate(repoFullName, workflowData);
      
      // Also broadcast to specific run subscribers
      this.broadcastToRunSubscribers(data.id, workflowData);
    } catch (error) {
      console.error('Error processing GitHub webhook:', error);
    }
  }

  public broadcastToRunSubscribers(runId: string | number, workflowData: GitHubWorkflowRun) {
    this.clients.forEach(client => {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(JSON.stringify({
          type: 'workflow_run_update',
          runId,
          data: workflowData
        }));
      }
    });
  }

  public cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    this.wss.close();
  }
}

export default GitHubWebhookService;
