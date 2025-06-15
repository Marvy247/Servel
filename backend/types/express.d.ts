import { User as CustomUser } from './user';

declare global {
  namespace Express {
    interface User extends CustomUser {
      id: string;
      githubToken: string;
      username: string;
      displayName?: string;
      emails?: Array<{ value: string }>;
      profile: {
        id: number;
        login: string;
        name?: string;
        email?: string;
        avatar_url?: string;
        html_url?: string;
      };
      token: string;
    }
  }
}
