import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDeploymentEvents } from '../../hooks/useDeploymentEvents';
import { 
  FileText,
  QrCode,
  Cube,
  Type,
  Cpu,
  Database,
  Zap,
  ArrowRight
} from 'lucide-react';

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

// Map contract types to icons and colors
const contractCategories = {
  'token': {
    icon: Zap,
    color: 'from-purple-500 to-pink-500'
  },
  'nft': {
    icon: Database,
    color: 'from-blue-500 to-cyan-500'
  },
  'governance': {
    icon: FileText,
    color: 'from-green-500 to-emerald-500'
  },
  'staking': {
    icon: Cube,
    color: 'from-yellow-500 to-amber-500'
  },
  'default': {
    icon: QrCode,
    color: 'from-gray-500 to-gray-600'
  },
  'factory': {
    icon: Cube,
    color: 'from-indigo-500 to-blue-500'
  },
  'registry': {
    icon: Cpu,
    color: 'from-red-500 to-orange-500'
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Smart Contract Deployment</h1>
          <p className="text-gray-600 mt-2">Deploy your smart contracts to Ethereum networks</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contract Selection Panel */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Available Contracts</h2>
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
                        ? 'ring-2 ring-offset-2 ring-blue-500' 
                        : 'hover:shadow-lg'
                    }`}
                  >
                    <div className="bg-white rounded-lg p-4 h-full w-full flex flex-col">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${category.color}`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-left truncate">{contract.name}</h3>
                          <p className="text-sm text-gray-500 text-left line-clamp-2">{contract.description}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
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
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${getContractCategory(selectedContract).color}`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-800">{selectedContract.name}</h2>
                        <p className="text-gray-600">{selectedContract.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="border-b border-gray-200 mb-4">
                    <nav className="-mb-px flex space-x-8">
                      <button
                        onClick={() => setActiveTab('parameters')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'parameters'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Deployment Parameters
                      </button>
                      <button
                        onClick={() => setActiveTab('logs')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'logs'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Deployment Logs
                      </button>
                    </nav>
                  </div>

                  {/* Tab Content */}
                  {activeTab === 'parameters' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Network</label>
                        <select
                          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
                              <div key={param.name}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  <div className="flex items-center">
                                    <Type className="w-4 h-4 mr-1 text-gray-400" />
                                    {param.name} <span className="text-gray-500 font-normal">({param.type})</span>
                                  </div>
                                </label>
                                <input
                                  type="text"
                                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                  placeholder={param.description || `Enter ${param.name} (${param.type})`}
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
                    <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
                      {logs.length === 0 ? (
                        <p className="text-gray-500 italic">No logs yet. Deployment logs will appear here.</p>
                      ) : (
                        <div className="space-y-1">
                          {logs.map((log, idx) => (
                            <div key={idx} className="text-sm font-mono text-gray-800">
                              <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {log}
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
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeploy}
                    disabled={deploying || !selectedContract}
                    className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      deploying
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
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
                      'Deploy Contract'
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No contract selected</h3>
                <p className="mt-1 text-sm text-gray-500">Select a contract from the list to begin deployment.</p>
              </div>
            )}

            {/* Deployment Info */}
            {deployedInfo && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="bg-green-50 px-6 py-4 border-b border-green-100">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <h3 className="ml-2 text-lg font-medium text-green-800">Deployment Successful</h3>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Contract Name</p>
                      <p className="mt-1 text-sm text-gray-900">{deployedInfo.contractName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Network</p>
                      <p className="mt-1 text-sm text-gray-900">{deployedInfo.network}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Contract Address</p>
                      <p className="mt-1 text-sm text-gray-900 font-mono break-all">{deployedInfo.address}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Transaction Hash</p>
                      <p className="mt-1 text-sm text-gray-900 font-mono break-all">{deployedInfo.txHash}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Gas Used</p>
                      <p className="mt-1 text-sm text-gray-900">{deployedInfo.gasEstimate || 'N/A'}</p>
                    </div>
                  </div>

                  {deployedInfo.optimizationSuggestions && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Optimization Suggestions</h4>
                      <ul className="space-y-2">
                        {deployedInfo.optimizationSuggestions.map((suggestion: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <svg className="flex-shrink-0 h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="ml-2 text-sm text-gray-700">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
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
