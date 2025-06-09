import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import logger from '../utils/logger';

// General rate limiter for all routes
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip} on path: ${req.path}`);
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    });
  }
});

// Stricter rate limiter for GitHub webhooks
export const githubWebhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`GitHub webhook rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many GitHub webhook requests',
      message: 'You have exceeded the GitHub webhook request limit. Please try again later.',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      docs: 'https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting'
    });
  }
});

// Default export remains the general limiter for backward compatibility
export default generalLimiter;
