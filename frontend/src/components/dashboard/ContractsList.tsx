'use client'

import { useState, useEffect } from 'react'

interface Contract {
  name: string
  address: string
  network: string
  verified: boolean
  lastDeployed: string
}

interface ContractsListProps {
  projectId: string
}

export function ContractsList({ projectId }: ContractsListProps) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await fetch(`/api/dashboard/contracts?projectId=${projectId}`)
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch contracts')
        }

        setContracts(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch contracts')
      } finally {
        setLoading(false)
      }
    }

    fetchContracts()
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
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Network</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Deployed</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {contracts.map((contract) => (
            <tr key={`${contract.address}-${contract.network}`}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contract.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{contract.address}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.network}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  contract.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {contract.verified ? 'Verified' : 'Unverified'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(contract.lastDeployed).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
