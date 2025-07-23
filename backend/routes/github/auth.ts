import express from 'express';
import { getGitHubAuthService } from '../../services/github/authService';
import { githubWebhookLimiter } from '../../middleware/rateLimiter';

const router = express.Router();

// Apply rate limiting to auth routes
router.use(githubWebhookLimiter);

// Check authentication status
router.get('/status', async (req, res) => {
  try {
    // In a real implementation, this would check session/token validity
    // For now, we'll return a mock response indicating not authenticated
    res.json({
      authenticated: false,
      user: null,
      message: 'User not authenticated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check authentication status',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// GitHub OAuth routes
router.get('/', async (req, res) => {
  try {
    const authService = await getGitHubAuthService();
    const { url } = authService.getAuthorizationUrl();
    
    // Redirect directly to GitHub OAuth
    res.redirect(url);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate authorization URL',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.status(400).json({
        success: false,
        error: 'Missing code or state parameter'
      });
    }

    const authService = await getGitHubAuthService();
    const user = await authService.exchangeCodeForToken(code as string, state as string);
    
    // Store user session (in a real app, you'd use Redis or similar)
    // For now, we'll just return the user info
    res.json({
      success: true,
      user,
      message: 'GitHub OAuth authentication successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'OAuth authentication failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Repository browsing routes
router.get('/repos', async (req, res) => {
  try {
    const authService = await getGitHubAuthService();
    const { per_page = 30, page = 1, sort = 'updated', type = 'all' } = req.query;

    // Ensure sort is one of the allowed values
    const allowedSorts = ['updated', 'created', 'pushed', 'full_name'] as const;
    const sortValue = allowedSorts.includes(sort as any) ? sort as typeof allowedSorts[number] : 'updated';

    const repos = await authService.getUserRepositories(
      'session_token_placeholder', // In real implementation, get from auth
      {
        per_page: parseInt(per_page as string),
        page: parseInt(page as string),
        sort: sortValue,
        type: ['all', 'owner', 'public', 'private', 'member'].includes(type as string)
          ? (type as 'all' | 'owner' | 'public' | 'private' | 'member')
          : 'all'
      }
    );
    
    res.json({
      success: true,
      repositories: repos,
      pagination: {
        page: parseInt(page as string),
        per_page: parseInt(per_page as string),
        total: repos.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch repositories',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Contract detection routes
router.get('/repos/:owner/:repo/contents/*', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const path = (req.params as any)[0] || '';
    
    const authService = await getGitHubAuthService();
    const contents = await authService.getRepositoryContents(
      'session_token_placeholder',
      owner,
      repo,
      path
    );
    
    res.json({
      success: true,
      contents,
      message: 'Repository contents retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch repository contents',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
