export type TestResultEvent = {
  type: 'test_result'
  projectId: string
  status: 'started' | 'completed' | 'failed'
  timestamp: number
  results?: {
    id: string
    name: string
    status: 'passed' | 'failed' | 'skipped' | 'pending'
    duration: number
    details?: string
    type?: 'unit' | 'integration' | 'e2e' | 'fuzz' | 'invariant' | 'security'
    gasUsed?: number
    fuzzRuns?: number
    invariantChecks?: number
    coverage?: {
      lines: number
      branches: number
      functions: number
    }
  }[]
  stats?: {
    total: number
    passed: number
    coverage: number
    avgDuration: number
    avgGasUsed?: number
    maxGasUsed?: number
    slitherFindings?: number
    fuzzCoverage?: number
    invariantViolations?: number
  }
}

export type TestEventFilter = {
  projectId: string
  eventTypes?: Array<'test_result'>
}

export type TestEventSubscription = {
  id: string
  filter: TestEventFilter
  callback: (event: TestResultEvent) => void
}
