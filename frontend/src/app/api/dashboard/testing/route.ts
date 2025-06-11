import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json(
      { error: 'Project ID is required' },
      { status: 400 }
    )
  }

  // Mock test results data
  const testResults = [
    {
      testType: 'unit',
      lastRun: new Date(Date.now() - 3600000).toISOString(),
      passed: 42,
      failed: 2,
      skipped: 0,
      duration: '1m 23s',
      status: 'passed'
    },
    {
      testType: 'fuzz',
      lastRun: new Date(Date.now() - 86400000).toISOString(),
      passed: 1250,
      failed: 8,
      skipped: 0,
      duration: '4m 12s',
      status: 'passed'
    },
    {
      testType: 'invariant',
      lastRun: new Date(Date.now() - 172800000).toISOString(),
      passed: 18,
      failed: 1,
      skipped: 0,
      duration: '2m 45s',
      status: 'failed'
    }
  ]

  // Add artificial delay to simulate network request
  await new Promise(resolve => setTimeout(resolve, 500))

  return NextResponse.json(testResults, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  })
}
