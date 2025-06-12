import { NextResponse } from 'next/server';

// Mock data matching the Deployment interface
const mockDeployments = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    environment: 'production',
    status: 'success',
    commit: {
      hash: 'a1b2c3d4',
      message: 'Fix login page styling',
      author: 'dev@example.com',
      url: 'https://github.com/example/repo/commit/a1b2c3d4'
    },
    duration: 120,
    metadata: {
      branch: 'main',
      trigger: 'auto',
      buildId: 'build-123',
      deploymentUrl: 'https://app.example.com'
    }
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    environment: 'staging',
    status: 'failed',
    commit: {
      hash: 'e5f6g7h8',
      message: 'Add new analytics dashboard',
      author: 'dev@example.com',
      url: 'https://github.com/example/repo/commit/e5f6g7h8'
    },
    duration: 95,
    metadata: {
      branch: 'feature/new-ui',
      trigger: 'manual',
      buildId: 'build-124'
    }
  }
];

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = params.projectId;
    
    // Basic validation
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required', success: false },
        { status: 400 }

      );
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';
    const environments = searchParams.get('environments')?.split(',') || [];
    const statuses = searchParams.get('statuses')?.split(',') || [];
    const branch = searchParams.get('branch');

    // Filter deployments based on query params
    let filtered = mockDeployments;

    if (range === '7d') {
      const sevenDaysAgo = Date.now() - 7 * 86400000;
      filtered = filtered.filter(d => new Date(d.timestamp) >= new Date(sevenDaysAgo));
    } else if (range === '30d') {
      const thirtyDaysAgo = Date.now() - 30 * 86400000;
      filtered = filtered.filter(d => new Date(d.timestamp) >= new Date(thirtyDaysAgo));
    }

    if (environments.length) {
      filtered = filtered.filter(d => environments.includes(d.environment));
    }

    if (statuses.length) {
      filtered = filtered.filter(d => statuses.includes(d.status));
    }

    if (branch) {
      filtered = filtered.filter(d => d.metadata?.branch === branch);
    }

    return NextResponse.json({
      deployments: filtered,
      success: true
    });

  } catch (error) {
    console.error('Deployments API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch deployments',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }

    );
  }
}
