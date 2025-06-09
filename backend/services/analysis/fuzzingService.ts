import { execSync } from 'child_process'
import path from 'path'
import { FuzzTestResult, InvariantTestResult, FuzzAnalysisResult } from './types'

export const runFuzzTests = (contractPath: string): FuzzTestResult[] => {
  try {
    const cmd = `cd ${path.dirname(contractPath)} && forge test --fuzz-runs 100 --json`
    const output = execSync(cmd).toString()
    const parsed = JSON.parse(output)
    return parsed?.testResults || []
  } catch (error) {
    throw new Error(`Fuzzing test failed: ${error}`)
  }
}

export const runInvariantTests = (contractPath: string): InvariantTestResult[] => {
  try {
    const cmd = `cd ${path.dirname(contractPath)} && forge test --match-test "invariant" --json`
    const output = execSync(cmd).toString()
    const parsed = JSON.parse(output)
    return parsed?.testResults || []
  } catch (error) {
    throw new Error(`Invariant test failed: ${error}`)
  }
}

export const analyzeFuzzResults = (results: {
  fuzz?: FuzzTestResult[]
  invariant?: InvariantTestResult[]
}): FuzzAnalysisResult => {
  const fuzzResults = results.fuzz || []
  const invariantResults = results.invariant || []
  
  const passedFuzz = fuzzResults.filter((r: any) => r.status === 'success').length
  const passedInvariant = invariantResults.filter((r: any) => r.status === 'success').length
  
  return {
    totalTests: fuzzResults.length + invariantResults.length,
    passedFuzz,
    failedFuzz: fuzzResults.length - passedFuzz,
    passedInvariant, 
    failedInvariant: invariantResults.length - passedInvariant,
    fuzzCoverage: passedFuzz / fuzzResults.length * 100 || 0,
    invariantCoverage: passedInvariant / invariantResults.length * 100 || 0,
    testResults: fuzzResults,
    invariantResults
  }
}
