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
    // For now, we'll return a mock response indicating authenticated
    res.json({
      authenticated: true,
      user: {
        id: 12345,
        login: 'githubuser',
        name: 'GitHub User',
        email: 'user@github.com',
        avatar_url: 'https://github.com/githubuser.png'
      },
      message: 'User authenticated'
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
      return res.redirect('http://localhost:3000/dashboard/github?error=missing_params');
    }

    const authService = await getGitHubAuthService();
    const user = await authService.exchangeCodeForToken(code as string, state as string);
    
    // Store user session (in a real app, you'd use Redis or similar)
    // For now, we'll redirect to GitHub tab
    res.redirect('http://localhost:3000/dashboard/github?success=true');
  } catch (error) {
    res.redirect(`http://localhost:3000/dashboard/github?error=${encodeURIComponent(error instanceof Error ? error.message : String(error))}`);
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
