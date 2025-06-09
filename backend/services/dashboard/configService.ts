import type { DashboardConfig } from '../../types/dashboard';
import { validateGitHubRepoUrl, validateRefreshInterval } from '../../utils/validators';
import { readConfig, writeConfig } from './configStorage.js';

const defaultConfig: DashboardConfig = {
  projectId: '',
  githubRepo: '',
  defaultWorkflow: 'ci',
  refreshInterval: 60000,
  features: {
    securityAnalysis: true,
    testCoverage: true,
    deploymentTracking: true,
    githubIntegration: true
  }
};

export async function getConfig(): Promise<DashboardConfig> {
  try {
    const storedConfig = await readConfig();
    return { ...defaultConfig, ...storedConfig };
  } catch (error) {
    console.error('Failed to read config, using defaults:', error);
    return { ...defaultConfig };
  }
}

export async function updateConfig(updates: Partial<DashboardConfig>): Promise<DashboardConfig> {
  // Validate GitHub repo URL if provided
  if (updates.githubRepo && !validateGitHubRepoUrl(updates.githubRepo)) {
    throw new Error('Invalid GitHub repository format. Use owner/repo or full GitHub URL');
  }

  // Validate refresh interval
  if (updates.refreshInterval && !validateRefreshInterval(updates.refreshInterval)) {
    throw new Error('Refresh interval must be between 1000ms (1s) and 3600000ms (1h)');
  }

  // Validate workflow type
  if (updates.defaultWorkflow && !['ci', 'deploy', 'test'].includes(updates.defaultWorkflow)) {
    throw new Error('Invalid workflow type. Must be one of: ci, deploy, test');
  }

  // Validate features object structure
  if (updates.features) {
    const validFeatures = Object.keys(defaultConfig.features);
    for (const key of Object.keys(updates.features)) {
      if (!validFeatures.includes(key)) {
        throw new Error(`Invalid feature flag: ${key}`);
      }
    }
  }

  const currentConfig = await getConfig();
  const newConfig = { 
    ...currentConfig,
    ...updates,
    features: {
      ...currentConfig.features,
      ...updates.features
    }
  };

  await writeConfig(newConfig);
  return newConfig;
}
