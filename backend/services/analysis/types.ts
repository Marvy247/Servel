export interface SlitherAnalysisResult {
  success: boolean
  errors: string[]
  warnings: string[]
  informational: string[]
  lowIssues: string[]
  mediumIssues: string[]
  highIssues: string[]
  jsonReport: object
  markdownReport: string
}

export interface SlitherConfig {
  target: string
  rootPath?: string
  excludeInheritance?: boolean
  excludeAssembly?: boolean
  filterPaths?: string[]
}

export interface BatchSlitherConfig {
  targets: string[]
  rootPath?: string
  commonOptions?: {
    excludeInheritance?: boolean
    excludeAssembly?: boolean
    filterPaths?: string[]
  }
}

export interface FuzzTestResult {
  status: 'success' | 'failure'
  testName: string
  duration: number
  error?: string
  runs?: number
  seed?: number
}

export interface InvariantTestResult {
  status: 'success' | 'failure'
  invariantName: string
  duration: number
  error?: string
  runs?: number
  calls?: number
  reverts?: number
}

export interface FuzzAnalysisResult {
  totalTests: number
  passedFuzz: number
  failedFuzz: number
  passedInvariant: number
  failedInvariant: number
  fuzzCoverage: number
  invariantCoverage: number
  testResults: FuzzTestResult[]
  invariantResults: InvariantTestResult[]
}
