import express from 'express';
import http from 'http';
import { initWebSocketServer } from './services/events/websocketServer';
import authRoutes from './routes/auth';
import githubRoutes from './routes/github';
import dashboardRoutes from './routes/dashboard';
import { requireAuth } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
const webhookService = initWebSocketServer(server);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/github', requireAuth, githubRoutes);
app.use('/api/dashboard', requireAuth, dashboardRoutes);

// Webhook endpoint
app.post('/api/webhooks/github', (req, res) => {
  try {
    const event = req.headers['x-github-event'];
    if (event === 'workflow_run') {
      webhookService.processGitHubWebhook(req.body);
    }
    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Error processing webhook');
  }
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Cleanup on shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { app, server };
