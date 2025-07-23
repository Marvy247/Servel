import express from 'express';
import { getGitHubAuthService } from '../../services/github/authService';

const router = express.Router();

// Repository browsing routes
router.get('/repos', async (req, res) => {
  try {
    const authService = await getGitHubAuthService();
    const { per_page = 30, page = 1, sort = 'updated', type = 'all' } = req.query;
    
    // In a real implementation, you'd get the user from the session
    const repos = await authService.getUserRepositories(
      'session_token_placeholder',
      {
        per_page: parseInt(per_page as string),
        page: parseInt(page as string),
        sort: ['updated', 'created', 'pushed', 'full_name'].includes(sort as string)
          ? (sort as 'updated' | 'created' | 'pushed' | 'full_name')
          : 'updated',
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
