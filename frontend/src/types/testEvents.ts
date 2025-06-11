export interface TestResult {
  id: string
  name: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  type: 'unit' | 'integration' | 'e2e'
  gasUsed?: number
  details?: string
}

export interface TestStats {
  total: number
  passed: number
  coverage: number
  avgDuration: number
  avgGasUsed?: number
  maxGasUsed?: number
  slitherFindings?: number
  fuzzCoverage?: number
  invariantViolations?: number
  history: any[]
}

export interface TestResultEvent {
  type: 'test_result'
  projectId: string
  timestamp: number
  results: TestResult[]
  stats: TestStats
}
