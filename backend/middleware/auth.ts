import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/request';

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.githubToken) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  next();
};
