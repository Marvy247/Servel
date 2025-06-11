'use client'

import { useState, useEffect } from 'react'

interface TestResult {
  testType: string
  lastRun: string
  passed: number
  failed: number
  skipped: number
  duration: string
  status: 'passed' | 'failed' | 'running'
}

interface TestingSummaryProps {
  projectId: string
}

export function TestingSummary({ projectId }: TestingSummaryProps) {
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchTestResults = async () => {
      try {
        const response = await fetch(`/api/dashboard/testing?projectId=${projectId}`)
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch test results')
        }

        setResults(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch test results')
      } finally {
        setLoading(false)
      }
    }

    fetchTestResults()
  }, [projectId])

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Test Execution Summary</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {results.map((result) => (
          <div key={result.testType} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium capitalize">{result.testType}</h4>
              <span className={`px-2 py-1 text-xs rounded-full ${
                result.status === 'passed' ? 'bg-green-100 text-green-800' :
                result.status === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {result.status}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Passed: {result.passed}</span>
                <span className="text-red-600">Failed: {result.failed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Skipped: {result.skipped}</span>
                <span className="text-gray-600">Duration: {result.duration}</span>
              </div>
            </div>
            
            <div className="mt-2 text-xs text-gray-500">
              Last run: {new Date(result.lastRun).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
