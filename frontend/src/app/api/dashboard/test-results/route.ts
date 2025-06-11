import { NextResponse } from 'next/server'
import TestResultEventService from '@/services/events/testResultEventService'
import { EventListenerService } from '@/services/events/eventListenerService'
import type { TestResultEvent, TestResult, TestStats } from '@/types/testEvents'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json(
      { error: 'Project ID is required' },
      { status: 400 }
    )
  }

  try {
    const testResultService = new TestResultEventService(new EventListenerService())
    const latestResults = await testResultService.getLatestResults()
    
    if (!latestResults.length) {
      return NextResponse.json(
        { error: 'No test results available' },
        { status: 404 }
      )
    }

    const transformedResults: TestResult[] = latestResults.flatMap((event: TestResultEvent) => 
      event.results?.map((result: TestResult) => ({
        ...result,
        timestamp: new Date(event.timestamp).toISOString(),
        type: result.type || 'unit',
        details: result.details || (result.status === 'failed' ? 'Test failed' : undefined)
      })) || []
    )

    const stats: TestStats = {
      total: transformedResults.length,
      passed: transformedResults.filter((r: TestResult) => r.status === 'passed').length,
      coverage: latestResults[0].stats?.coverage || 0,
      avgDuration: latestResults[0].stats?.avgDuration || 0,
      avgGasUsed: latestResults[0].stats?.avgGasUsed,
      maxGasUsed: latestResults[0].stats?.maxGasUsed,
      slitherFindings: latestResults[0].stats?.slitherFindings,
      fuzzCoverage: latestResults[0].stats?.fuzzCoverage,
      invariantViolations: latestResults[0].stats?.invariantViolations,
      history: latestResults[0].stats?.history || []
    }

    return NextResponse.json({ 
      results: transformedResults, 
      stats 
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch test results' },
      { status: 500 }
    )
  }
}
