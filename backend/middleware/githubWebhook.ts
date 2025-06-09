import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export const verifyGitHubWebhook = (secret: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const signature = req.headers['x-hub-signature-256'];
    const payload = JSON.stringify(req.body);
    
    if (!signature || typeof signature !== 'string') {
      return res.status(401).send('Missing or invalid signature header');
    }

    const hmac = crypto.createHmac('sha256', secret);
    const digest = `sha256=${hmac.update(payload).digest('hex')}`;
    
    if (!crypto.timingSafeEqual(
      Buffer.from(signature), 
      Buffer.from(digest)
    )) {
      return res.status(401).send('Invalid signature');
    }

    next();
  };
};
