import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { WebSocketMessage, ErrorMessage } from '../../types/websocket';
import GitHubWebhookService from './githubWebhookService';

let webhookService: GitHubWebhookService | null = null;

export function initWebSocketServer(server: Server): GitHubWebhookService {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    webhookService = new GitHubWebhookService(ws);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;
        // Handle different message types here
      } catch (err) {
        const errorMessage: ErrorMessage = {
          type: 'error',
          message: 'Invalid message format',
          code: 400
        };
        ws.send(JSON.stringify(errorMessage));
      }
    });

    ws.on('close', () => {
      if (webhookService) {
        webhookService.cleanup();
        webhookService = null;
      }
    });
  });

  return webhookService!;
}

export function getWebhookService(): GitHubWebhookService {
  if (!webhookService) {
    throw new Error('WebSocket service not initialized');
  }
  return webhookService;
}
