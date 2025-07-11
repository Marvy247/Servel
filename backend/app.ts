import express from 'express';
import cors from 'cors';
import { verifyGitHubWebhook } from './middleware/githubWebhook';
import apiRoutes from './routes/api';
import dashboardRoutes from './routes/dashboard';
import { EventListenerService } from './services/events/eventListenerService';

import { TestResultEventService } from './services/events/testResultEventService';
import quickActionsRoutes from './routes/quickActions';
import deploymentRoutes from './routes/deployment';
import notificationRoutes from './routes/notification';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({
  strict: true,
  type: 'application/json'
}));

// GitHub webhook verification middleware
const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || '';
if (webhookSecret) {
  app.use('/api/dashboard/github/webhook', verifyGitHubWebhook(webhookSecret));
}

// Routes
app.use('/api', apiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/quickActions', quickActionsRoutes);
app.use('/api/deployment', deploymentRoutes);
app.use('/api/notification', notificationRoutes);

// Initialize WebSocket EventListenerService
const providerUrl = process.env.PROVIDER_URL || 'http://localhost:8545';
const wssPort = parseInt(process.env.WSS_PORT || '8080', 10);
const eventListenerService = new EventListenerService(providerUrl, wssPort);

// Set eventListenerService instance in DeploymentService
import { DeploymentService } from './services/deployment';
const deploymentService = DeploymentService.getInstance();
deploymentService.setEventListenerService(eventListenerService);

// Initialize test result event handling
const testResultEventService = new TestResultEventService(eventListenerService);

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server running on port ${wssPort}`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('Shutting down server...');
  eventListenerService.close();
  testResultEventService.clearSubscriptions();
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
