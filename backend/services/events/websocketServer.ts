import { Server } from 'http';
import GitHubWebhookService from './githubWebhookService';

let webhookService: GitHubWebhookService | null = null;

export function initWebSocketServer(server: Server): GitHubWebhookService {
  webhookService = new GitHubWebhookService(server);
  return webhookService;
}

export function getWebhookService(): GitHubWebhookService {
  if (!webhookService) {
    throw new Error('WebSocket service not initialized');
  }
  return webhookService;
}

export function cleanupWebSocketServer() {
  if (webhookService) {
    webhookService.cleanup();
    webhookService = null;
  }
}
