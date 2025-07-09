import React, { useState, useEffect, useMemo } from 'react';
import { FiClock, FiChevronDown, FiChevronUp, FiLink, FiZap, FiFilter, FiX } from 'react-icons/fi';
import { FaEthereum } from 'react-icons/fa';
import { EventLog, EventFilters, PaginationOptions } from '../../types/events';
import eventSocketService from '../../services/eventSocketService';

const EventLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<EventLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [contractAddress, setContractAddress] = useState('');
  const [subscribedContracts, setSubscribedContracts] = useState<string[]>([]);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [filters, setFilters] = useState<EventFilters>({
    contractAddress: '',
    eventName: '',
    fromAddress: '',
    toAddress: '',
  });
  const [pagination, setPagination] = useState<PaginationOptions>({
    page: 1,
    pageSize: 25,
  });
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const filteredLogs = useMemo(() => {
    setIsUpdating(true);
    const filtered = logs.filter(log => {
      if (filters.contractAddress && !log.contractAddress.toLowerCase().includes(filters.contractAddress.toLowerCase())) return false;
      if (filters.eventName && !log.eventName.toLowerCase().includes(filters.eventName.toLowerCase())) return false;
      if (filters.fromAddress && !log.args.from?.toLowerCase().includes(filters.fromAddress.toLowerCase())) return false;
      if (filters.toAddress && !log.args.to?.toLowerCase().includes(filters.toAddress.toLowerCase())) return false;
      return true;
    });
    setIsUpdating(false);
    return filtered;
  }, [logs, filters]);

  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice(
      (pagination.page - 1) * pagination.pageSize,
      pagination.page * pagination.pageSize
    );
  }, [filteredLogs, pagination]);

  useEffect(() => {
    setIsLoading(true);
    setIsConnected(true);
    setSubscribedContracts(['0x742d35Cc6634C0532925a3b844Bc454e4438f44e']);
    
    const mockEvents: EventLog[] = [
      {
        contractAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        blockNumber: 123456,
        transactionHash: '0xabc123def456abc123def456abc123def456abc123',
        eventName: 'Transfer',
        args: {
          from: '0x1111111111111111111111111111111111111111',
          to: '0x2222222222222222222222222222222222222222',
          value: '1000000000000000000'
        },
        timestamp: new Date().toISOString()
      },
      {
        contractAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        blockNumber: 123455,
        transactionHash: '0xdef456abc123def456abc123def456abc123def456',
        eventName: 'Approval',
        args: {
          owner: '0x1111111111111111111111111111111111111111',
          spender: '0x3333333333333333333333333333333333333333',
          value: '500000000000000000'
        },
        timestamp: new Date().toISOString()
      }
    ];
    setLogs(mockEvents);
    setIsLoading(false);

    const interval = setInterval(() => {
      if (isLiveMode) {
        setIsUpdating(true);
        setLogs(prev => [{
          contractAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          blockNumber: Math.floor(Math.random() * 1000000),
          transactionHash: `0x${Math.random().toString(16).substr(2, 10)}${Math.random().toString(16).substr(2, 10)}`,
          eventName: ['Transfer', 'Approval', 'Deposit'][Math.floor(Math.random() * 3)],
          args: {
            from: `0x${Math.random().toString(16).substr(2, 10)}${Math.random().toString(16).substr(2, 10)}`,
            to: `0x${Math.random().toString(16).substr(2, 10)}${Math.random().toString(16).substr(2, 10)}`,
            value: Math.floor(Math.random() * 1000000000).toString()
          },
          timestamp: new Date().toISOString()
        }, ...prev].slice(0, 100));
        setIsUpdating(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isLiveMode]);

  const handleSubscribe = () => {
    if (!contractAddress) return;
    setIsUpdating(true);
    if (typeof eventSocketService.subscribe === 'function') {
      eventSocketService.subscribe(contractAddress, (message) => {
        // Handle incoming event message
      });
    }
    setContractAddress('');
    setIsUpdating(false);
  };

  const handleUnsubscribe = (address: string) => {
    setIsUpdating(true);
    if (typeof eventSocketService.unsubscribe === 'function') {
      eventSocketService.unsubscribe(address);
    }
    setSubscribedContracts(prev => prev.filter(addr => addr !== address));
    setIsUpdating(false);
  };

  const toggleLogExpansion = (index: number) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedLogs(newExpanded);
  };

  const truncateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Event Log Viewer</h2>
          <p className="text-sm text-gray-500">Monitor and filter smart contract events in real-time</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={isLiveMode}
                onChange={(e) => setIsLiveMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
              <div className="absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow-sm transform transition-transform peer-checked:translate-x-5"></div>
            </div>
            <span className="text-sm font-medium">{isLiveMode ? 'Live' : 'Paused'}</span>
          </label>
        </div>
      </div>

      {/* Subscription Form */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="text-sm font-medium text-blue-800 mb-3">Subscribe to Contract Events</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              placeholder="Enter contract address (0x...)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSubscribe}
            disabled={isUpdating || !contractAddress}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Subscribing...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <FiZap className="mr-2" />
                Subscribe
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Subscribed Contracts */}
      {subscribedContracts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Active Subscriptions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {subscribedContracts.map((address) => (
              <div key={address} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <FaEthereum className="text-gray-500 mr-2" />
                  <span className="text-sm font-mono">{truncateAddress(address)}</span>
                </div>
                <button
                  onClick={() => handleUnsubscribe(address)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                  disabled={isUpdating}
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 mb-2"
        >
          <FiFilter />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
        
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Contract Address</label>
                <input
                  type="text"
                  value={filters.contractAddress}
                  onChange={(e) => setFilters(prev => ({ ...prev, contractAddress: e.target.value }))}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Event Name</label>
                <input
                  type="text"
                  value={filters.eventName}
                  onChange={(e) => setFilters(prev => ({ ...prev, eventName: e.target.value }))}
                  placeholder="Transfer, Approval, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From Address</label>
                <input
                  type="text"
                  value={filters.fromAddress}
                  onChange={(e) => setFilters(prev => ({ ...prev, fromAddress: e.target.value }))}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">To Address</label>
                <input
                  type="text"
                  value={filters.toAddress}
                  onChange={(e) => setFilters(prev => ({ ...prev, toAddress: e.target.value }))}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Events List */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">
            Showing {paginatedLogs.length} of {filteredLogs.length} events
          </h3>
          {isUpdating && (
            <div className="flex items-center text-xs text-gray-500">
              <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </div>
          )}
        </div>

        {filteredLogs.length > 0 ? (
          <div className="space-y-3">
            {paginatedLogs.map((log, index) => (
              <div 
                key={index} 
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => toggleLogExpansion(index)}
              >
                <div className="p-4 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        log.eventName === 'Transfer' ? 'bg-green-100 text-green-800' :
                        log.eventName === 'Approval' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {log.eventName}
                      </span>
                      <span className="text-xs text-gray-500">
                        Block #{log.blockNumber}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <FiClock className="text-gray-400" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-gray-400">
                    {expandedLogs.has(index) ? <FiChevronUp /> : <FiChevronDown />}
                  </div>
                </div>
                
                {expandedLogs.has(index) && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 mb-1">Contract</h4>
                        <div className="flex items-center gap-2 text-sm">
                          <FaEthereum className="text-gray-500" />
                          <span className="font-mono">{truncateAddress(log.contractAddress)}</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 mb-1">Transaction</h4>
                        <div className="flex items-center gap-2 text-sm">
                          <FiLink className="text-gray-500" />
                          <span className="font-mono">{truncateAddress(log.transactionHash)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Event Data</h4>
                    <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-x-auto">
                      {JSON.stringify(log.args, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-3">
              <FaEthereum className="w-full h-full" />
            </div>
            <h3 className="text-sm font-medium text-gray-900">No events found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or subscribe to more contracts</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredLogs.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, filteredLogs.length)} of{' '}
            {filteredLogs.length} events
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= Math.ceil(filteredLogs.length / pagination.pageSize)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventLogViewer;