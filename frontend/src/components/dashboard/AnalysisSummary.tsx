'use client'

import { useState, useEffect } from 'react'
import { FiAlertTriangle, FiCheckCircle, FiClock, FiLoader } from 'react-icons/fi'
import { FaShieldAlt, FaBug, FaExclamationTriangle } from 'react-icons/fa'

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
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
        <div className="flex items-center">
          <FiAlertTriangle className="text-red-500 mr-2" />
          <h3 className="text-sm font-medium text-red-800">{error}</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Security Analysis</h2>
          <p className="text-sm text-gray-500">Results from automated security scanners</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {results.map((result) => (
          <div key={result.tool} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-50 rounded-lg mr-3">
                    <FaShieldAlt className="text-blue-500 text-lg" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">{result.tool}</h3>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  result.status === 'passed' ? 'bg-green-100 text-green-800' :
                  result.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {result.status === 'running' ? (
                    <>
                      <FiLoader className="mr-1 animate-spin" />
                      Running
                    </>
                  ) : result.status === 'passed' ? (
                    <>
                      <FiCheckCircle className="mr-1" />
                      Passed
                    </>
                  ) : (
                    <>
                      <FiAlertTriangle className="mr-1" />
                      Failed
                    </>
                  )}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaBug className="text-red-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Critical</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">{result.issues.critical}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaExclamationTriangle className="text-orange-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">High</span>
                  </div>
                  <span className="text-lg font-bold text-orange-500">{result.issues.high}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaExclamationTriangle className="text-yellow-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Medium</span>
                  </div>
                  <span className="text-lg font-bold text-yellow-500">{result.issues.medium}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaExclamationTriangle className="text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Low</span>
                  </div>
                  <span className="text-lg font-bold text-gray-500">{result.issues.low}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
              <div className="flex items-center text-sm text-gray-500">
                <FiClock className="mr-2 text-gray-400" />
                Last run: {new Date(result.lastRun).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}