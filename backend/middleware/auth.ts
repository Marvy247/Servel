import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../types/request'
import { User } from '../types/user'
import logger from '../utils/logger'

declare global {
  namespace Express {
    interface User {
      id: string;
      githubToken: string;
      username: string;
      displayName?: string;
      emails?: Array<{ value: string }>;
      profile: any;
      token: string;
    }
  }
}

function isCustomUser(user: Express.User | undefined): user is User {
  return !!user && 'id' in user && 'githubToken' in user
}

/**
 * Authentication middleware with enhanced features:
 * - Development mode bypass
 * - Detailed error logging
 * - Consistent response format
 */
export function authenticate(
  options: { devBypass?: boolean } = { devBypass: true }
) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Development mode bypass
    if (options.devBypass && process.env.NODE_ENV === 'development') {
      logger.debug('Development mode - authentication bypassed')
      return next()
    }

    // Check authentication
    if (!req.isAuthenticated()) {
      logger.warn('Unauthorized access attempt', {
        path: req.path,
        ip: req.ip
      })
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized',
        code: 'UNAUTHORIZED'
      })
    }

    // Type-safe user access
    if (!isCustomUser(req.user)) {
      logger.warn('Invalid user type in authenticated request', {
        path: req.path,
        ip: req.ip
      })
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized',
        code: 'UNAUTHORIZED'
      })
    }

    logger.debug('Authenticated request', {
      path: req.path,
      userId: req.user.id
    })

    next()
  }
}
