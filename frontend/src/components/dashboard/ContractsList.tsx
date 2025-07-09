'use client'

import { useState, useEffect } from 'react'
import VerificationForm from '../../app/dashboard/contracts/VerificationForm'
import { useDeploymentEvents } from '../../hooks/useDeploymentEvents'
import { FiCheckCircle, FiAlertCircle, FiClock, FiCopy, FiExternalLink } from 'react-icons/fi'
import { FaEthereum } from 'react-icons/fa'
import { toast } from '../../hooks/use-toast'

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied to clipboard',
      variant: 'default',
    })
  }

  useDeploymentEvents((deployment) => {
    setContracts((prevContracts) => {
      const exists = prevContracts.some(
        (c) => c.address === deployment.address && c.network === deployment.network
      )
      if (exists) {
        return prevContracts.map((c) =>
          c.address === deployment.address && c.network === deployment.network
            ? { ...c, lastDeployed: deployment.timestamp }
            : c
        )
      } else {
        return [
          ...prevContracts,
          {
            name: deployment.contractName,
            address: deployment.address,
            network: deployment.network,
            verified: false,
            lastDeployed: deployment.timestamp
          }
        ]
      }
    })
  })

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/deployment/${projectId}/addresses`)
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch contracts')
        }

        const flattenedContracts: Contract[] = []
        for (const network in data.data) {
          if (Array.isArray(data.data[network])) {
            data.data[network].forEach((contract: any) => {
              flattenedContracts.push({
                name: contract.contractName || 'Unknown',
                address: contract.address,
                network: network,
                verified: false,
                lastDeployed: contract.lastDeployed || ''
              })
            })
          }
        }

        setContracts(flattenedContracts)
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
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
        <div className="flex items-center">
          <FiAlertCircle className="text-red-500 mr-2" />
          <h3 className="text-sm font-medium text-red-800">{error}</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Contract Verification</h2>
        </div>
        <VerificationForm projectId={projectId} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Deployed Contracts</h2>
          <p className="text-sm text-gray-500 mt-1">{contracts.length} contracts deployed</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Network</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Deployed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contracts.map((contract) => (
                <tr key={`${contract.address}-${contract.network}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                        <FaEthereum className="text-blue-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{contract.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900 font-mono">
                        {contract.address.substring(0, 6)}...{contract.address.substring(38)}
                      </span>
                      <button 
                        onClick={() => copyToClipboard(contract.address)}
                        className="ml-2 text-gray-400 hover:text-gray-500 transition-colors"
                      >
                        <FiCopy className="h-4 w-4" />
                      </button>
                      <a 
                        href={`https://etherscan.io/address/${contract.address}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-2 text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        <FiExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 capitalize">
                      {contract.network}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {contract.verified ? (
                        <FiCheckCircle className="text-green-500 mr-1.5" />
                      ) : (
                        <FiClock className="text-yellow-500 mr-1.5" />
                      )}
                      <span className="text-sm text-gray-900">
                        {contract.verified ? 'Verified' : 'Pending Verification'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <FiClock className="mr-1.5 text-gray-400" />
                      {contract.lastDeployed ? (() => {
                        const date = new Date(contract.lastDeployed);
                        if (isNaN(date.getTime())) {
                          return contract.lastDeployed;
                        }
                        return date.toLocaleString();
                      })() : 'N/A'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {contracts.length === 0 && !loading && (
          <div className="p-12 text-center">
            <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
              <FaEthereum className="w-full h-full" />
            </div>
            <h3 className="text-sm font-medium text-gray-900">No contracts deployed</h3>
            <p className="mt-1 text-sm text-gray-500">Deploy your first contract to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}