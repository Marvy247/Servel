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

  // Mock analysis data matching AnalysisResult interface
  const analysis = [
    {
      tool: "Slither",
      issues: {
        critical: 0,
        high: 0,
        medium: 1,
        low: 2
      },
      lastRun: new Date(Date.now() - 3600000).toISOString(),
      status: 'passed'
    },
    {
      tool: "Mythril",
      issues: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 1
      },
      lastRun: new Date(Date.now() - 7200000).toISOString(),
      status: 'passed'
    }
  ]

  await new Promise(resolve => setTimeout(resolve, 500))

  return NextResponse.json(analysis, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  })
}
