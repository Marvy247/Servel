import { Request } from 'express';
import { User as CustomUser } from './user';

declare global {
  namespace Express {
    interface User extends CustomUser {} // Merge our User type with Express.User
    interface Request {
      user?: User;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user?: CustomUser; // Use our custom User type
}
