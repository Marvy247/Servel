import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../types/request'
import logger from '../utils/logger'

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
    const user = (req as AuthenticatedRequest).user
    if (user) {
      logger.debug('Authenticated request', {
        path: req.path,
        userId: user.id
      })
    }

    next()
  }
}
