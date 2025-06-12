import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/request';

export function login(req: Request, res: Response) {
  res.json({ 
    success: true,
    message: 'Login endpoint',
    url: '/auth/github'
  });
}

export function callback(req: AuthenticatedRequest, res: Response) {
  res.json({ 
    success: true,
    message: 'Authentication successful',
    user: req.user 
  });
}

export function logout(req: AuthenticatedRequest, res: Response) {
  req.session?.destroy((err: Error) => {
    if (err) {
      return res.status(500).json({ 
        success: false,
        message: 'Logout failed' 
      });
    }
    res.clearCookie('connect.sid');
    res.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  });
}
