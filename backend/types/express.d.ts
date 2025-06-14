import { GitHubUser } from './github';

declare global {
  namespace Express {
    interface User {
      id: string;
      githubToken: string;
      username: string;
      displayName?: string;
      emails?: Array<{ value: string }>;
      profile: GitHubUser;
      token: string;
    }
  }
}
