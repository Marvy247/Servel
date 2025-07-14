import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDeploymentEvents } from '../../hooks/useDeploymentEvents';
import { 
  DocumentTextIcon,
  CubeIcon,
  CubeTransparentIcon,
  VariableIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { QrCodeIcon } from '@heroicons/react/24/outline';
import { Cpu, Database, Zap, Code } from 'lucide-react';

interface ContractMetadata {
  name: string;
  description: string;
  constructorParams: { name: string; type: string; description?: string }[];
  icon?: string;
  category?: string;
}

interface DeploymentLog {
  type: string;
  data: string;
}

const networks = ['localhost', 'sepolia'];

// Enhanced color mapping with more vibrant gradients
const contractCategories = {
  'token': {
    icon: Zap,
    color: 'from-purple-600 to-pink-500',
    bgColor: 'bg-gradient-to-br from-purple-600 to-pink-500',
    textColor: 'text-purple-600'
  },
  'nft': {
    icon: Database,
    color: 'from-blue-600 to-cyan-400',
    bgColor: 'bg-gradient-to-br from-blue-600 to-cyan-400',
    textColor: 'text-blue-600'
  },
  'governance': {
    icon: DocumentTextIcon,
    color: 'from-emerald-600 to-teal-400',
    bgColor: 'bg-gradient-to-br from-emerald-600 to-teal-400',
    textColor: 'text-emerald-600'
  },
  'staking': {
    icon: CubeIcon,
    color: 'from-amber-500 to-yellow-400',
    bgColor: 'bg-gradient-to-br from-amber-500 to-yellow-400',
    textColor: 'text-amber-600'
  },
  'default': {
    icon: Code,
    color: 'from-slate-600 to-gray-500',
    bgColor: 'bg-gradient-to-br from-slate-600 to-gray-500',
    textColor: 'text-slate-600'
  },
  'factory': {
    icon: CubeTransparentIcon,
    color: 'from-indigo-600 to-blue-400',
    bgColor: 'bg-gradient-to-br from-indigo-600 to-blue-400',
    textColor: 'text-indigo-600'
  },
  'registry': {
    icon: Cpu,
    color: 'from-red-500 to-orange-400',
    bgColor: 'bg-gradient-to-br from-red-500 to-orange-400',
    textColor: 'text-red-600'
  }
};

const DeploymentPage: React.FC = () => {
  const [contracts, setContracts] = useState<ContractMetadata[]>([]);
  const [selectedContract, setSelectedContract] = useState<ContractMetadata | null>(null);
  const [constructorArgs, setConstructorArgs] = useState<Record<string, string>>({});
  const [network, setNetwork] = useState<string>(networks[0]);
  const [logs, setLogs] = useState<string[]>([]);
  const [deploying, setDeploying] = useState(false);
  const [deployedInfo, setDeployedInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'parameters' | 'logs'>('parameters');

  // Fetch contract metadata from backend on mount
  useEffect(() => {
    async function fetchContracts() {
      try {
        const response = await axios.get('/api/dashboard/contractsMetadata');
        setContracts(response.data.data);
      } catch (error) {
        console.error('Failed to fetch contracts metadata:', error);
        setLogs(prev => [...prev, `Error fetching contracts: ${error instanceof Error ? error.message : String(error)}`]);
      }
    }
    fetchContracts();
  }, []);

  // Handle deployment events via event streaming hook
  useDeploymentEvents((event: any) => {
    if (event.type === 'deployment-log') {
      setLogs((prev) => [...prev, event.data]);
    } else if (event.type === 'deployment') {
      setDeployedInfo(event.data);
      setDeploying(false);
      setLogs((prev) => [...prev, `Deployment completed: ${JSON.stringify(event.data)}`]);
    }
  });

  const handleContractSelect = (contractName: string) => {
    const contract = contracts.find(c => c.name === contractName) || null;
    setSelectedContract(contract);
    setConstructorArgs({});
    setDeployedInfo(null);
    setLogs([]);
    setActiveTab('parameters');
  };

  const handleInputChange = (paramName: string, value: string) => {
    setConstructorArgs(prev => ({ ...prev, [paramName]: value }));
  };

  const handleDeploy = async () => {
    if (!selectedContract) return;
    setDeploying(true);
    setLogs(['Starting deployment...']);
    setDeployedInfo(null);
    setActiveTab('logs');
    
    try {
      const argsArray = selectedContract.constructorParams.map(param => constructorArgs[param.name] || '');
      const response = await axios.post(`/api/deployment/default/deploy`, {
        contractName: selectedContract.name,
        constructorArgs: argsArray,
        network,
      });
      
      if (!response.data.success) {
        setLogs(prev => [...prev, `Deployment failed: ${response.data.error}`]);
        setDeploying(false);
      }
    } catch (error) {
      setLogs(prev => [...prev, `Deployment error: ${error instanceof Error ? error.message : String(error)}`]);
      setDeploying(false);
    }
  };

  // Get category info for contract
  const getContractCategory = (contract: ContractMetadata) => {
    const category = contract.category?.toLowerCase() || 'default';
    return {
      ...contractCategories[category as keyof typeof contractCategories] || contractCategories.default,
      name: category
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with gradient text */}
        <div className="mb-8 text-center lg:text-left">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Smart Contract Deployment
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Deploy your smart contracts to Ethereum networks with ease
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contract Selection Panel */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 w-2 h-6 rounded-full mr-2"></span>
              Available Contracts
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {contracts.map(contract => {
                const category = getContractCategory(contract);
                const IconComponent = category.icon;
                
                return (
                  <button
                    key={contract.name}
                    onClick={() => handleContractSelect(contract.name)}
                    className={`group relative p-0.5 rounded-xl bg-gradient-to-br ${category.color} transition-all duration-300 ${
                      selectedContract?.name === contract.name 
                        ? 'ring-2 ring-offset-2 ring-blue-500 shadow-lg' 
                        : 'hover:shadow-lg'
                    }`}
                  >
                    <div className="bg-white rounded-lg p-4 h-full w-full flex flex-col transition-all duration-200 hover:bg-opacity-90">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${category.bgColor} shadow-md`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-left truncate">{contract.name}</h3>
                          <p className="text-sm text-gray-500 text-left line-clamp-2">{contract.description}</p>
                        </div>
                        <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${category.textColor} bg-opacity-10 ${category.bgColor.replace('bg-gradient-to-br', 'bg')}`}>
                          {category.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {contract.constructorParams.length} params
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {selectedContract ? (
              <>
                {/* Contract Info Card */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-lg shadow-md ${getContractCategory(selectedContract).bgColor}`}>
                        {(() => {
                          const Icon = getContractCategory(selectedContract).icon;
                          return Icon ? <Icon className="w-6 h-6 text-white" /> : null;
                        })()}
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-800">{selectedContract.name}</h2>
                        <p className="text-gray-600">{selectedContract.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tabs with gradient indicator */}
                  <div className="border-b border-gray-200 mb-4 relative">
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100"></div>
                    <nav className="-mb-px flex space-x-8">
                      <button
                        onClick={() => setActiveTab('parameters')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm relative ${
                          activeTab === 'parameters'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Deployment Parameters
                        {activeTab === 'parameters' && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></span>
                        )}
                      </button>
                      <button
                        onClick={() => setActiveTab('logs')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm relative ${
                          activeTab === 'logs'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Deployment Logs
                        {activeTab === 'logs' && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></span>
                        )}
                      </button>
                    </nav>
                  </div>

                  {/* Tab Content */}
                  {activeTab === 'parameters' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Network</label>
                        <select
                          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white shadow-sm"
                          onChange={(e) => setNetwork(e.target.value)}
                          value={network}
                        >
                          {networks.map(net => (
                            <option key={net} value={net}>{net.charAt(0).toUpperCase() + net.slice(1)}</option>
                          ))}
                        </select>
                      </div>

                      {selectedContract.constructorParams.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-3">Constructor Parameters</h3>
                          <div className="space-y-4">
                            {selectedContract.constructorParams.map(param => (
                              <div key={param.name} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  <div className="flex items-center">
                                    <VariableIcon className="w-4 h-4 mr-1 text-blue-500" />
                                    <span className="font-semibold">{param.name}</span> 
                                    <span className="text-gray-500 font-normal ml-1">({param.type})</span>
                                  </div>
                                </label>
                                {param.description && (
                                  <p className="text-xs text-gray-500 mb-2">{param.description}</p>
                                )}
                                <input
                                  type="text"
                                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md px-3 py-2"
                                  placeholder={`Enter ${param.name} value`}
                                  value={constructorArgs[param.name] || ''}
                                  onChange={(e) => handleInputChange(param.name, e.target.value)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto border border-gray-200">
                      {logs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                          <DocumentTextIcon className="h-10 w-10 mb-2" />
                          <p>No logs yet. Deployment logs will appear here.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {logs.map((log, idx) => (
                            <div 
                              key={idx} 
                              className={`text-sm font-mono p-2 rounded ${log.toLowerCase().includes('error') ? 'bg-red-50 text-red-700' : log.toLowerCase().includes('completed') ? 'bg-green-50 text-green-700' : 'bg-white text-gray-800'}`}
                            >
                              <span className="text-gray-500 text-xs">[{new Date().toLocaleTimeString()}]</span> {log}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setSelectedContract(null);
                      setConstructorArgs({});
                      setLogs([]);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeploy}
                    disabled={deploying || !selectedContract}
                    className={`px-6 py-2 rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${
                      deploying
                        ? 'bg-gradient-to-r from-blue-400 to-blue-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                    }`}
                  >
                    {deploying ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deploying...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Zap className="w-4 h-4 mr-2" />
                        Deploy Contract
                      </span>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
                <div className="mx-auto h-24 w-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                  <DocumentTextIcon className="h-12 w-12 text-blue-500" />
                </div>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No contract selected</h3>
                <p className="mt-1 text-sm text-gray-500">Select a contract from the list to begin deployment</p>
                <div className="mt-4 h-1 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 rounded-full"></div>
              </div>
            )}

            {/* Deployment Info */}
            {deployedInfo && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className={`px-6 py-4 border-b ${getContractCategory(selectedContract!).bgColor}`}>
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <h3 className="ml-2 text-lg font-medium text-white">Deployment Successful</h3>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Contract Name</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{deployedInfo.contractName}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Network</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{deployedInfo.network}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Contract Address</p>
                      <p className="mt-1 text-sm font-mono text-gray-900 break-all">{deployedInfo.address}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Hash</p>
                      <p className="mt-1 text-sm font-mono text-gray-900 break-all">{deployedInfo.txHash}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gas Used</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{deployedInfo.gasEstimate || 'N/A'}</p>
                    </div>
                  </div>

                  {deployedInfo.optimizationSuggestions && (
                    <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">Optimization Suggestions</h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <ul className="list-disc pl-5 space-y-1">
                              {deployedInfo.optimizationSuggestions.map((suggestion: string, i: number) => (
                                <li key={i}>{suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentPage;