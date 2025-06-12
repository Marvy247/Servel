import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    githubToken: string;
    id: string;
  };
  session?: {
    destroy: (callback: (err: Error) => void) => void;
    [key: string]: any;
  };
}
