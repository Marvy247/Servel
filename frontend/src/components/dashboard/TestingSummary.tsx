'use client'

import { useState, useEffect } from 'react'
import { FiCheckCircle, FiXCircle, FiClock, FiSkipForward, FiZap, FiTrendingUp } from 'react-icons/fi'

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

const testTypeIcons = {
  unit: <FiZap className="text-purple-500" />,
  integration: <FiTrendingUp className="text-green-500" />,
  e2e: <FiCheckCircle className="text-blue-500" />,
  security: <FiXCircle className="text-red-500" />
}

export function TestingSummary({ projectId }: TestingSummaryProps) {
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchTestResults = async () => {
      try {
        setLoading(true)
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
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
        <div className="flex items-center">
          <FiXCircle className="text-red-500 mr-2" />
          <h3 className="text-sm font-medium text-red-800">{error}</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900">Test Execution Summary</h2>
        <p className="text-sm text-gray-500 mt-1">Overview of test results across all test types</p>
      </div>

      {/* Content */}
      <div className="p-6">
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <FiCheckCircle className="text-3xl mb-2" />
            <p>No test results available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {results.map((result) => (
              <div 
                key={result.testType} 
                className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {testTypeIcons[result.testType as keyof typeof testTypeIcons] || <FiCheckCircle />}
                    </div>
                    <h3 className="font-medium capitalize text-gray-900">
                      {result.testType.replace(/-/g, ' ')}
                    </h3>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    result.status === 'passed' ? 'bg-green-100 text-green-800' :
                    result.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {result.status === 'running' ? (
                      <>
                        <FiClock className="mr-1 animate-spin" />
                        Running
                      </>
                    ) : result.status}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FiCheckCircle className="text-green-500" />
                      <span className="text-sm text-gray-600">Passed</span>
                    </div>
                    <span className="font-medium text-gray-900">{result.passed}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FiXCircle className="text-red-500" />
                      <span className="text-sm text-gray-600">Failed</span>
                    </div>
                    <span className="font-medium text-gray-900">{result.failed}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FiSkipForward className="text-yellow-500" />
                      <span className="text-sm text-gray-600">Skipped</span>
                    </div>
                    <span className="font-medium text-gray-900">{result.skipped}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FiClock className="text-blue-500" />
                      <span className="text-sm text-gray-600">Duration</span>
                    </div>
                    <span className="font-medium text-gray-900">{result.duration}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FiClock className="text-gray-400" />
                    <span>Last run: {new Date(result.lastRun).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}