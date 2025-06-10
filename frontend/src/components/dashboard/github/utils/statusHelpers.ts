/**
 * Helper functions for GitHub status calculations and formatting
 */

export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'success':
      return 'green';
    case 'failure':
      return 'red';
    case 'pending':
      return 'yellow';
    case 'error':
      return 'orange';
    default:
      return 'gray';
  }
};

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
};

export const isRecentRun = (timestamp: string, thresholdHours = 24): boolean => {
  const runTime = new Date(timestamp).getTime();
  const now = Date.now();
  return (now - runTime) < (thresholdHours * 60 * 60 * 1000);
};
