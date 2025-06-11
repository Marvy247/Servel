'use client'

import { useState, useEffect } from 'react'

interface AnalysisResult {
  tool: string
  issues: {
    critical: number
    high: number
    medium: number
    low: number
  }
  lastRun: string
  status: 'passed' | 'failed' | 'running'
}

interface AnalysisSummaryProps {
  projectId: string
}

export function AnalysisSummary({ projectId }: AnalysisSummaryProps) {
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch(`/api/dashboard/analysis?projectId=${projectId}`)
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch analysis results')
        }

        setResults(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analysis results')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysis()
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
      <h3 className="text-lg font-medium">Security Analysis</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {results.map((result) => (
          <div key={result.tool} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">{result.tool}</h4>
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
                <span className="text-red-600">Critical: {result.issues.critical}</span>
                <span className="text-orange-600">High: {result.issues.high}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-yellow-600">Medium: {result.issues.medium}</span>
                <span className="text-gray-600">Low: {result.issues.low}</span>
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
