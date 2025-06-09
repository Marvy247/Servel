import express from 'express';

/**
 * Validates GitHub repository URL or owner/repo format
 * @param repo - GitHub repository URL or owner/repo string
 * @returns boolean - true if valid format
 */
export function validateGitHubRepoUrl(repo: string): boolean {
  // Match owner/repo format
  if (/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/.test(repo)) {
    return true;
  }

  // Match GitHub URLs
  const githubUrlPattern = /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+(\/)?$/;
  return githubUrlPattern.test(repo);
}

/**
 * Validates refresh interval in milliseconds
 * @param interval - Refresh interval in ms
 * @returns boolean - true if valid (between 1s and 1h)
 */
export function validateRefreshInterval(interval: number): boolean {
  return interval >= 1000 && interval <= 3600000;
}

/**
 * Express middleware to validate GitHub workflow run IDs
 * @param req - Express request
 * @param res - Express response 
 * @param next - Next middleware
 */
export function validateRunId(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.params.runId || !/^\d+$/.test(req.params.runId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid run ID format',
      timestamp: new Date().toISOString()
    });
  }
  next();
}
