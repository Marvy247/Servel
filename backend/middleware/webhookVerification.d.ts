import { Request, Response, NextFunction } from 'express';

export function verifyGitHubWebhook(
  req: Request,
  res: Response,
  buf: Buffer,
  encoding: string
): void;

export function webhookVerificationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void;
