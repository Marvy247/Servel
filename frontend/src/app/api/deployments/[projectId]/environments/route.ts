import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    // Mock data - in a real app this would come from a database or API
    const environments = ['production', 'staging', 'development'];
    
    return NextResponse.json(environments);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch environments' },
      { status: 500 }
    );
  }
}
