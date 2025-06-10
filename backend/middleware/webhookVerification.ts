import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function verifyGitHubWebhook(
  req: Request,
  res: Response,
  buf: Buffer,
  encoding: string
) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) {
    throw new Error('No signature provided');
  }

  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('GITHUB_WEBHOOK_SECRET not configured');
  }

  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(buf).digest('hex');
  const expectedSignature = `sha256=${digest}`;

  if (signature !== expectedSignature) {
    throw new Error('Invalid signature');
  }
}

export function webhookVerificationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    verifyGitHubWebhook(req, res, req.body, 'utf8');
    next();
  } catch (error) {
    res.status(401).send('Invalid webhook signature');
  }
}
