'use client'

import { useEffect, useState } from 'react'
import { GitHubStatus } from '../../components/dashboard/GitHubStatus'
import { TestResults } from '../../components/dashboard/TestResults'
import { SlitherReport } from '../../components/dashboard/SlitherReport'
import { DeploymentHistory } from '../../components/dashboard/DeploymentHistory'
import { ContractsList } from '../../components/dashboard/ContractsList'
import { AnalysisSummary } from '../../components/dashboard/AnalysisSummary'
import { TestingSummary } from '../../components/dashboard/TestingSummary'

interface DashboardConfig {
  projectId: string
  githubRepo: string
  defaultWorkflow?: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  details?: string
  timestamp: string
}

export default function DashboardPage() {
  const [config, setConfig] = useState<DashboardConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchConfig = async () => {
    try {
      // Mock config data since we don't have this endpoint
      const mockConfig = {
        projectId: 'test-project',
        githubRepo: 'example/repo',
        defaultWorkflow: 'ci.yml'
      }
      setConfig(mockConfig)
      

      } catch (err) {
        setError('Failed to load dashboard configuration')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  )

  if (error) return (
    <div className="text-red-500 p-4">
      {error}
    </div>
  )

  if (!config) return (
    <div className="text-gray-500 p-4">
      No dashboard configuration found
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Project Dashboard</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <ContractsList projectId={config.projectId} />
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <AnalysisSummary projectId={config.projectId} />
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <TestingSummary projectId={config.projectId} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <GitHubStatus 
              repo={config.githubRepo}
              workflow={config.defaultWorkflow}
            />
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <TestResults projectId={config.projectId} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <SlitherReport projectId={config.projectId} />
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <DeploymentHistory projectId={config.projectId} />
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium mb-2">Test Coverage</h3>
          <div className="text-3xl font-bold text-green-600">92%</div>
          <p className="text-sm text-gray-500">Last 7 days</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium mb-2">Security Score</h3>
          <div className="text-3xl font-bold text-blue-600">A+</div>
          <p className="text-sm text-gray-500">No critical issues</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium mb-2">Deployment Success</h3>
          <div className="text-3xl font-bold text-green-600">98%</div>
          <p className="text-sm text-gray-500">Last 30 days</p>
        </div>
      </div>
    </div>
  )
}
