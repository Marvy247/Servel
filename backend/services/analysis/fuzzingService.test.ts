import { runFuzzTests, runInvariantTests, analyzeFuzzResults } from './fuzzingService'
import { FuzzTestResult, InvariantTestResult } from './types'
import path from 'path'
import { execSync } from 'child_process'

jest.mock('child_process', () => ({
  execSync: jest.fn()
}))

describe('FuzzingService', () => {
  const testContractPath = path.join(__dirname, '../../../contracts/test/Counter.t.sol')
  const mockFuzzResults: FuzzTestResult[] = [
    { status: 'success', testName: 'test1', duration: 100 },
    { status: 'failure', testName: 'test2', duration: 200, error: 'failed' }
  ]
  const mockInvariantResults: InvariantTestResult[] = [
    { status: 'success', invariantName: 'invariant1', duration: 150 },
    { status: 'failure', invariantName: 'invariant2', duration: 250, error: 'failed' }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should run fuzz tests', async () => {
    (execSync as jest.Mock).mockReturnValue(JSON.stringify({
      testResults: mockFuzzResults
    }))
    const results = await runFuzzTests(testContractPath)
    expect(results).toEqual(mockFuzzResults)
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('forge test --fuzz-runs 100 --json')
    )
  })

  test('should run invariant tests', async () => {
    (execSync as jest.Mock).mockReturnValue(JSON.stringify({
      testResults: mockInvariantResults
    }))
    const results = await runInvariantTests(testContractPath)
    expect(results).toEqual(mockInvariantResults)
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('forge test --match-test "invariant" --json')
    )
  })

  test('should handle empty test results', async () => {
    (execSync as jest.Mock).mockReturnValue(JSON.stringify({}))
    const results = await runFuzzTests(testContractPath)
    expect(results).toEqual([])
  })

  test('should analyze results', () => {
    const analysis = analyzeFuzzResults({
      fuzz: mockFuzzResults,
      invariant: mockInvariantResults
    })
    
    expect(analysis).toEqual({
      totalTests: 4,
      passedFuzz: 1,
      failedFuzz: 1,
      passedInvariant: 1,
      failedInvariant: 1,
      fuzzCoverage: 50,
      invariantCoverage: 50,
      testResults: mockFuzzResults,
      invariantResults: mockInvariantResults
    })
  })
})
