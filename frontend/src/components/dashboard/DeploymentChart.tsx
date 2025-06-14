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
  const [wsConnected, setWsConnected] = useState(false)

  useEffect(() => {
    let reconnectAttempts = 0;
    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;

    const connectWebSocket = () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        return;
      }
      
      ws = new WebSocket(`ws://${window.location.host}/ws/deployments?projectId=${projectId}&token=${token}`);
      
      ws.onopen = () => {
        setWsConnected(true);
        reconnectAttempts = 0;
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const newData = JSON.parse(event.data);
          setData(prev => [...prev, newData]);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
        
        if (error instanceof CloseEvent && error.code === 1008) { // 1008 = Policy Violation (auth failed)
          localStorage.removeItem('authToken');
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        console.log('WebSocket disconnected');
        
        // Exponential backoff for reconnection
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        reconnectTimer = setTimeout(() => {
          reconnectAttempts++;
          connectWebSocket();
        }, delay);
      };
    };

    connectWebSocket();

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
          return;
        }

        const response = await fetch(`/api/dashboard/deployments/history?projectId=${projectId}&days=30`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const result = await response.json()
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch deployment history')
        }

        setData(result)
      } catch (err) {
        if (!navigator.onLine) {
          setError('Network error - please check your internet connection')
        } else if (err instanceof Error) {
          if (err.message.includes('401') || (err as any).response?.status === 401) {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
            return
          }
          setError(`Failed to load deployment data: ${err.message}`)
        } else {
          setError('Failed to load deployment data - please try again later')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData();

    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
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
        {!wsConnected && (
          <div className="ml-4 text-gray-500">Connecting to real-time updates...</div>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-500 font-medium mb-2">Error loading deployment history</div>
        <div className="text-gray-600">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <Bar options={options} data={chartData} />
    </div>
  )
}
