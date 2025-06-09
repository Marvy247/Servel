import { validateGitHubRepoUrl, validateRefreshInterval } from '../validators';

describe('GitHub Repo URL Validator', () => {
  test('validates owner/repo format', () => {
    expect(validateGitHubRepoUrl('owner/repo')).toBe(true);
    expect(validateGitHubRepoUrl('owner123/repo-456')).toBe(true);
    expect(validateGitHubRepoUrl('OWNER/REPO')).toBe(true);
  });

  test('validates full GitHub URLs', () => {
    expect(validateGitHubRepoUrl('https://github.com/owner/repo')).toBe(true);
    expect(validateGitHubRepoUrl('http://github.com/owner/repo')).toBe(true);
    expect(validateGitHubRepoUrl('www.github.com/owner/repo')).toBe(true);
  });

  test('rejects invalid formats', () => {
    expect(validateGitHubRepoUrl('owner')).toBe(false);
    expect(validateGitHubRepoUrl('owner/repo/extra')).toBe(false);
    expect(validateGitHubRepoUrl('https://example.com/owner/repo')).toBe(false);
  });
});

describe('Refresh Interval Validator', () => {
  test('validates within bounds', () => {
    expect(validateRefreshInterval(1000)).toBe(true); // min
    expect(validateRefreshInterval(3600000)).toBe(true); // max
    expect(validateRefreshInterval(30000)).toBe(true); // mid-range
  });

  test('rejects out of bounds', () => {
    expect(validateRefreshInterval(999)).toBe(false); // below min
    expect(validateRefreshInterval(3600001)).toBe(false); // above max
    expect(validateRefreshInterval(-1000)).toBe(false); // negative
  });
});
