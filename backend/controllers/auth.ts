import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/request';
import { generateToken } from '../services/auth/jwtService';

export function login(req: Request, res: Response) {
  if (process.env.NODE_ENV === 'development') {
    return res.json({ 
      success: true,
      message: 'Development mode - auth bypassed',
      user: { githubToken: 'dev-bypass-token' }
    });
  }
  
  // Redirect to GitHub OAuth
  res.redirect('/auth/github');
}

export function callback(req: AuthenticatedRequest, res: Response) {
  if (process.env.NODE_ENV === 'development') {
    return res.json({ 
      success: true,
      message: 'Development mode - auth bypassed',
      user: { githubToken: 'dev-bypass-token' }
    });
  }

  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication failed' 
    });
  }

  // Store user session if exists
  // Return JWT token to frontend
  const token = req.user.token;
  const redirectUrl = new URL(`${process.env.FRONTEND_URL}/auth/callback`);
  redirectUrl.searchParams.set('token', token);
  
  if (req.user.username) {
    redirectUrl.searchParams.set('username', req.user.username);
  }

  res.redirect(redirectUrl.toString());
}

export function logout(req: AuthenticatedRequest, res: Response) {
  if (process.env.NODE_ENV === 'development') {
    return res.json({ 
      success: true,
      message: 'Development mode - logout bypassed' 
    });
  }

  // For token-based auth, logout is handled client-side by removing the token
  res.json({ 
    success: true,
    message: 'Logged out successfully' 
  });
}
