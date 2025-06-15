import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import session from 'express-session';
import { initWebSocketServer } from './services/events/websocketServer';
import authRouter from './routes/auth';
import githubRouter from './routes/github';
import dashboardRouter from './routes/dashboard';
import { authenticate } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { generateToken } from './services/auth/jwtService';
import type { GitHubUser } from './types/github';
/// <reference path="./types/express.d.ts" />

declare module 'express-session' {
  interface SessionData {
    passport?: {
      user: Express.User;
    };
  }
}

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
initWebSocketServer(server);

// Session configuration
const sessionOptions: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24
  }
};

// Middleware with explicit typing
app.use(session(sessionOptions));
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport configuration
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID || '',
  clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback',
  scope: ['user:email']
}, (accessToken: string, refreshToken: string, profile: any, done: (error: any, user?: Express.User) => void) => {
    const user: Express.User = {
      id: profile.id,
      githubToken: accessToken,
      username: profile.username,
      displayName: profile.displayName,
      emails: profile.emails ? [{ value: profile.emails[0]?.value }] : undefined,
      profile: {
        id: parseInt(profile.id),
        login: profile.username,
        name: profile.displayName,
        email: profile.emails?.[0]?.value,
        avatar_url: profile.photos?.[0]?.value,
        html_url: profile.profileUrl
      } as GitHubUser,
      token: generateToken({
        id: profile.id,
        username: profile.username,
        githubToken: accessToken
      })
    };

  done(null, user);
}));

passport.serializeUser<Express.User>((user, done) => done(null, user));
passport.deserializeUser<Express.User>((user, done) => done(null, user));

app.use(passport.initialize());
app.use(passport.session());

// Routes with proper typing
const apiRouter = express.Router();
apiRouter.use('/auth', authRouter);
apiRouter.use('/github', authenticate({ devBypass: process.env.NODE_ENV !== 'production' }), githubRouter);
apiRouter.use('/dashboard', dashboardRouter);
app.use('/api', apiRouter);

// GitHub webhook endpoint
app.post('/api/webhooks/github', (req: express.Request, res: express.Response) => {
  const event = req.headers['x-github-event'];
  if (event === 'workflow_run') {
    console.log('GitHub workflow_run event received');
    return res.status(200).send('Webhook received');
  }
  return res.status(400).send('Unsupported event type');
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('🛑 Server closed');
    process.exit(0);
  });
});

export { app, server };
