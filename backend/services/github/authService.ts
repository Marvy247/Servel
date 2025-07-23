import { Octokit } from '@octokit/rest';
import * as crypto from 'crypto';
import { getConfig } from '../dashboard/configService';

interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  access_token: string;
}

interface GitHubAuthState {
  state: string;
  redirectUri: string;
  timestamp: number;
}

class GitHubAuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private authStates: Map<string, GitHubAuthState> = new Map();
  private userSessions: Map<string, GitHubUser> = new Map();

  constructor() {
    this.clientId = process.env.GITHUB_CLIENT_ID || '';
    this.clientSecret = process.env.GITHUB_CLIENT_SECRET || '';
    this.redirectUri = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/api/github/auth/callback';
    
    if (!this.clientId || !this.clientSecret) {
      throw new Error('GitHub OAuth credentials not configured');
    }
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(redirectUri?: string): { url: string; state: string } {
    const state = crypto.randomBytes(16).toString('hex');
    const finalRedirectUri = redirectUri || this.redirectUri;
    
    // Store state for validation
    this.authStates.set(state, {
      state,
      redirectUri: finalRedirectUri,
      timestamp: Date.now()
    });

    // Clean up old states (older than 10 minutes)
    this.cleanupOldStates();

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: finalRedirectUri,
      scope: 'repo user:email',
      state,
      allow_signup: 'true'
    });

    return {
      url: `https://github.com/login/oauth/authorize?${params.toString()}`,
      state
    };
  }

  /**
   * Exchange code for access token
   */
  async exchangeCodeForToken(code: string, state: string): Promise<GitHubUser> {
    // Validate state
    const authState = this.authStates.get(state);
    if (!authState || Date.now() - authState.timestamp > 600000) { // 10 minutes
      throw new Error('Invalid or expired state parameter');
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: authState.redirectUri
      })
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      throw new Error(tokenData.error_description || 'Failed to obtain access token');
    }

    // Get user information
    const octokit = new Octokit({ auth: tokenData.access_token });
    const { data: userData } = await octokit.rest.users.getAuthenticated();
    const { data: emails } = await octokit.rest.users.listEmailsForAuthenticated();

    const primaryEmail = emails.find(email => email.primary)?.email || emails[0]?.email || '';

    const user: GitHubUser = {
      id: userData.id,
      login: userData.login,
      name: userData.name || userData.login,
      email: primaryEmail,
      avatar_url: userData.avatar_url,
      access_token: tokenData.access_token
    };

    // Store user session
    const sessionId = crypto.randomBytes(32).toString('hex');
    this.userSessions.set(sessionId, user);

    // Clean up used state
    this.authStates.delete(state);

    return { ...user, access_token: sessionId };
  }

  /**
   * Get user by session token
   */
  getUserBySession(sessionToken: string): GitHubUser | null {
    const user = this.userSessions.get(sessionToken);
    if (!user) return null;

    // Don't expose the actual access token
    return {
      ...user,
      access_token: sessionToken
    };
  }

  /**
   * Get user's repositories
   */
  async getUserRepositories(sessionToken: string, options: {
    per_page?: number;
    page?: number;
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    type?: 'all' | 'owner' | 'public' | 'private' | 'member';
  } = {}): Promise<any[]> {
    const user = this.userSessions.get(sessionToken);
    if (!user) {
      throw new Error('Invalid session token');
    }

    const octokit = new Octokit({ auth: user.access_token });
    
    const { data: repositories } = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: options.per_page || 30,
      page: options.page || 1,
      sort: options.sort || 'updated',
      type: options.type || 'all'
    });

    return repositories.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      private: repo.private,
      owner: {
        login: repo.owner.login,
        avatar_url: repo.owner.avatar_url
      },
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      default_branch: repo.default_branch,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      watchers_count: repo.watchers_count,
      forks_count: repo.forks_count,
      size: repo.size,
      updated_at: repo.updated_at,
      created_at: repo.created_at,
      pushed_at: repo.pushed_at
    }));
  }

  /**
   * Get repository contents
   */
  async getRepositoryContents(
    sessionToken: string,
    owner: string,
    repo: string,
    path: string = '',
    branch?: string
  ): Promise<any[]> {
    const user = this.userSessions.get(sessionToken);
    if (!user) {
      throw new Error('Invalid session token');
    }

    const octokit = new Octokit({ auth: user.access_token });
    
    const { data: contents } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch || 'main'
    });

    // Handle both single file and directory responses
    if (Array.isArray(contents)) {
      return contents.map(item => ({
        name: item.name,
        path: item.path,
        type: item.type,
        size: item.size,
        download_url: item.download_url,
        html_url: item.html_url
      }));
    } else {
      return [{
        name: contents.name,
        path: contents.path,
        type: contents.type,
        size: contents.size,
        download_url: contents.download_url,
        html_url: contents.html_url,
        content: contents.type === 'file' && 'content' in contents && contents.content
          ? Buffer.from(contents.content, 'base64').toString()
          : null
      }];
    }
  }

  /**
   * Get repository branches
   */
  async getRepositoryBranches(
    sessionToken: string,
    owner: string,
    repo: string
  ): Promise<any[]> {
    const user = this.userSessions.get(sessionToken);
    if (!user) {
      throw new Error('Invalid session token');
    }

    const octokit = new Octokit({ auth: user.access_token });
    
    const { data: branches } = await octokit.rest.repos.listBranches({
      owner,
      repo,
      per_page: 100
    });

    return branches.map(branch => ({
      name: branch.name,
      commit: {
        sha: branch.commit.sha,
        url: branch.commit.url
      },
      protected: branch.protected
    }));
  }

  /**
   * Get file content
   */
  async getFileContent(
    sessionToken: string,
    owner: string,
    repo: string,
    path: string,
    branch?: string
  ): Promise<string> {
    const user = this.userSessions.get(sessionToken);
    if (!user) {
      throw new Error('Invalid session token');
    }

    const octokit = new Octokit({ auth: user.access_token });
    
    const { data: file } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch || 'main'
    });

    if (Array.isArray(file)) {
      throw new Error('Path is a directory, not a file');
    }

    if (file.type !== 'file') {
      throw new Error('Path is not a file');
    }

    if (!('content' in file) || !file.content) {
      throw new Error('File content not available');
    }

    return Buffer.from(file.content, 'base64').toString();
  }

  /**
   * Logout user
   */
  logout(sessionToken: string): boolean {
    return this.userSessions.delete(sessionToken);
  }

  /**
   * Clean up old authentication states
   */
  private cleanupOldStates(): void {
    const now = Date.now();
    for (const [state, authState] of this.authStates.entries()) {
      if (now - authState.timestamp > 600000) { // 10 minutes
        this.authStates.delete(state);
      }
    }
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    // In a real implementation, you might want to store sessions in Redis
    // with TTL. For now, we'll just clean up old auth states.
    this.cleanupOldStates();
  }
}

// Singleton instance
let authService: GitHubAuthService | null = null;

export async function getGitHubAuthService(): Promise<GitHubAuthService> {
  if (!authService) {
    authService = new GitHubAuthService();
  }
  return authService;
}

export { GitHubAuthService, GitHubUser };
