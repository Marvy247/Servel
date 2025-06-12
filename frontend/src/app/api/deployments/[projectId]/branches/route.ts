import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    // Mock data - in a real app this would come from Git or a database
    const branches = ['main', 'develop', 'feature/new-ui', 'feature/auth'];
    
    return NextResponse.json(branches);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}
