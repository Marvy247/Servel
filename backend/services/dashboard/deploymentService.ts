import type { Deployment } from '../../types/dashboard';

const mockDeployments: Deployment[] = [
  {
    id: "1",
    environment: "production",
    status: "success",
    timestamp: new Date().toISOString(),
    commit: {
      hash: "a1b2c3d4",
      message: "Initial production release",
      author: "system",
      url: "https://github.com/example/commit/a1b2c3d4"
    },
    duration: 120,
    metadata: {
      branch: "main",
      trigger: "manual",
      buildId: "build-123",
      deployedBy: "admin@example.com"
    }
  },
  {
    id: "2",
    environment: "staging",
    status: "success",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    commit: {
      hash: "e5f6g7h8",
      message: "Add new feature X",
      author: "developer",
      url: "https://github.com/example/commit/e5f6g7h8"
    },
    duration: 95,
    metadata: {
      branch: "feature-x",
      trigger: "auto",
      buildId: "build-124"
    }
  },
  {
    id: "3",
    environment: "development",
    status: "failed",
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    commit: {
      hash: "i9j0k1l2",
      message: "Fix bug in module Y",
      author: "developer",
      url: "https://github.com/example/commit/i9j0k1l2"
    },
    duration: 85,
    metadata: {
      branch: "bugfix-y",
      trigger: "manual",
      buildId: "build-125"
    }
  },
  {
    id: "4",
    environment: "production",
    status: "success",
    timestamp: new Date(Date.now() - 259200000).toISOString(),
    commit: {
      hash: "m3n4o5p6",
      message: "Performance improvements",
      author: "devops",
      url: "https://github.com/example/commit/m3n4o5p6"
    },
    duration: 110,
    metadata: {
      branch: "main",
      trigger: "auto",
      buildId: "build-126"
    }
  },
  {
    id: "5",
    environment: "staging",
    status: "failed",
    timestamp: new Date(Date.now() - 345600000).toISOString(),
    commit: {
      hash: "q7r8s9t0",
      message: "Update dependencies",
      author: "system",
      url: "https://github.com/example/commit/q7r8s9t0"
    },
    duration: 75,
    metadata: {
      branch: "main",
      trigger: "manual",
      buildId: "build-127"
    }
  }
];

export interface DeploymentFilters {
  environment?: Deployment['environment'][];
  status?: Deployment['status'][];
  branch?: string;
  fromDate?: string;
  toDate?: string;
}

export async function getDeployments(filters?: DeploymentFilters): Promise<Deployment[]> {
  if (!filters) {
    return mockDeployments;
  }

  return mockDeployments.filter(deployment => {
    if (filters.environment && !filters.environment.includes(deployment.environment)) {
      return false;
    }
    if (filters.status && !filters.status.includes(deployment.status)) {
      return false;
    }
    if (filters.branch && deployment.metadata.branch !== filters.branch) {
      return false;
    }
    if (filters.fromDate && deployment.timestamp < filters.fromDate) {
      return false;
    }
    if (filters.toDate && deployment.timestamp > filters.toDate) {
      return false;
    }
    return true;
  });
}

export async function getDeploymentById(id: string): Promise<Deployment | undefined> {
  return mockDeployments.find(d => d.id === id);
}

export async function getEnvironments(): Promise<string[]> {
  return Array.from(new Set(mockDeployments.map(d => d.environment)));
}

export async function getBranches(): Promise<string[]> {
  return Array.from(new Set(mockDeployments.map(d => d.metadata.branch)));
}
