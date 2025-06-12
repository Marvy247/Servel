'use client'

import { useState, useEffect } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface DeploymentData {
  date: string
  total: number
  successful: number
}

export function DeploymentChart({ projectId }: { projectId: string }) {
  const [data, setData] = useState<DeploymentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/dashboard/deployments/history?projectId=${projectId}&days=30`)
        const result = await response.json()
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch deployment history')
        }

        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [projectId])

  const chartData = {
    labels: data.map(item => item.date),
    datasets: [
      {
        label: 'Successful Deployments',
        data: data.map(item => item.successful),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'Failed Deployments',
        data: data.map(item => item.total - item.successful),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      }
    ]
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Deployment History',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Deployments'
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 h-80 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-red-500">
        {error}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <Bar options={options} data={chartData} />
    </div>
  )
}
