'use client'

import React, { useState, useEffect } from 'react'

interface DashboardMetrics {
  deployments: {
    total: number
    successRate: number
    last7Days: number
  }
  coverage: {
    current: number
    trend: 'up' | 'down' | 'stable'
    diff: number
  }
  issues: {
    critical: number
    total: number
    resolved24h: number
  }
}

export function SummaryCards({ projectId }: { projectId: string }) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(`/api/dashboard/metrics?projectId=${projectId}`)
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch dashboard metrics')
        }

        setMetrics(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [projectId])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-4 h-32 animate-pulse"></div>
        ))}
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

  if (!metrics) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Deployments Card */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium mb-2">Deployments</h3>
        <div className="space-y-1">
          <p className="text-2xl font-bold">{metrics.deployments.total}</p>
          <p className="text-sm text-gray-600">
            {metrics.deployments.successRate}% success rate
          </p>
          <p className="text-sm text-gray-600">
            {metrics.deployments.last7Days} in last 7 days
          </p>
        </div>
      </div>

      {/* Coverage Card */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium mb-2">Test Coverage</h3>
        <div className="space-y-1">
          <p className="text-2xl font-bold">{metrics.coverage.current}%</p>
          <p className="text-sm text-gray-600">
            {metrics.coverage.trend === 'up' ? '↑' : metrics.coverage.trend === 'down' ? '↓' : '→'} 
            {metrics.coverage.diff}% from last week
          </p>
        </div>
      </div>

      {/* Issues Card */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium mb-2">Security Issues</h3>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-red-600">{metrics.issues.critical}</p>
          <p className="text-sm text-gray-600">
            {metrics.issues.total} total issues
          </p>
          <p className="text-sm text-gray-600">
            {metrics.issues.resolved24h} resolved in last 24h
          </p>
        </div>
      </div>
    </div>
  )
}
