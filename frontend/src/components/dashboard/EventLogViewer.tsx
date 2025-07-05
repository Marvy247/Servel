import React, { useState, useEffect, useMemo } from 'react';
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
    // TODO: Improve log viewer UI for better readability and usability
    // Mock data setup
    setIsLoading(true);
    setIsConnected(true);
    setSubscribedContracts(['0x742d35Cc6634C0532925a3b844Bc454e4438f44e']);
    
    // Mock events
    const mockEvents: EventLog[] = [
      {
        contractAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        blockNumber: 123456,
        transactionHash: '0xabc123...',
        eventName: 'Transfer',
        args: {
          from: '0x111...',
          to: '0x222...',
          value: '1000000000000000000'
        },
        timestamp: new Date().toISOString()
      },
      {
        contractAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        blockNumber: 123455,
        transactionHash: '0xdef456...',
        eventName: 'Approval',
        args: {
          owner: '0x111...',
          spender: '0x333...',
          value: '500000000000000000'
        },
        timestamp: new Date().toISOString()
      }
    ];
    setLogs(mockEvents);
    setIsLoading(false);

    // Simulate new events coming in (only in live mode)
    const interval = setInterval(() => {
      if (isLiveMode) {
        setIsUpdating(true);
        setLogs(prev => [{
          contractAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          blockNumber: Math.floor(Math.random() * 1000000),
          transactionHash: `0x${Math.random().toString(16).substr(2, 10)}...`,
          eventName: ['Transfer', 'Approval', 'Deposit'][Math.floor(Math.random() * 3)],
          args: {
            from: `0x${Math.random().toString(16).substr(2, 10)}...`,
            to: `0x${Math.random().toString(16).substr(2, 10)}...`,
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
        // Handle the incoming event message here if needed
        // For example, you could update logs or set state
        // setLogs(prev => [message, ...prev]);
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

  return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 bg-transparent rounded-lg border border-gray-200">
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-transparent p-4 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-center">Loading events...</p>
          </div>
        </div>
      )}

      {/* Mode Toggle */}
<div className="flex items-center gap-4 mb-6">
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <span className="text-sm font-medium text-gray-100">
          {isLiveMode ? 'Live Mode' : 'Historical Mode'}
        </span>
        <div className="relative">
          <input
            type="checkbox"
            checked={isLiveMode}
            onChange={(e) => setIsLiveMode(e.target.checked)}
            className="sr-only peer focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          />
          <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-600 transition-colors duration-300"></div>
          <div className="absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow-md transform transition-transform duration-300 peer-checked:translate-x-5"></div>
        </div>
      </label>

  {isUpdating && (
    <div className="text-sm text-gray-500 flex items-center gap-2">
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
      Updating...
    </div>
  )}
</div>


      {/* Filters */}
      <div className="mb-6 p-4 border border-gray-200 rounded bg-transparent">
        <h3 className="text-lg font-semibold mb-3">Filters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            value={filters.contractAddress}
            onChange={(e) => setFilters(prev => ({ ...prev, contractAddress: e.target.value }))}
            placeholder="Filter by contract address"
            className="p-2 border border-gray-300 rounded"
          />
          <input
            type="text"
            value={filters.eventName}
            onChange={(e) => setFilters(prev => ({ ...prev, eventName: e.target.value }))}
            placeholder="Filter by event type"
            className="p-2 border border-gray-300 rounded"
          />
          <input
            type="text"
            value={filters.fromAddress}
            onChange={(e) => setFilters(prev => ({ ...prev, fromAddress: e.target.value }))}
            placeholder="Filter by from address"
            className="p-2 border border-gray-300 rounded"
          />
          <input
            type="text"
            value={filters.toAddress}
            onChange={(e) => setFilters(prev => ({ ...prev, toAddress: e.target.value }))}
            placeholder="Filter by to address"
            className="p-2 border border-gray-300 rounded"
          />
        </div>
      </div>

      
      <div className={`p-2 mb-4 mx-2 sm:mx-0 border-l-4 ${isConnected ? 'bg-gray-800 border-blue-500' : 'bg-transparent border-gray-100'}`}>
        Status: {isConnected ? 'Connected' : 'Disconnected'}
      </div>

      {error && (
        <div className="p-2 mb-4 text-red-600 bg-red-50 border-l-4 border-red-500">
          Error: {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          type="text"
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
          placeholder="Enter contract address"
          className="flex-1 p-2 border border-gray-300 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        />
      <button 
          onClick={handleSubscribe}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isUpdating}
        >
          {isUpdating ? 'Subscribing...' : 'Subscribe'}
        </button>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Subscribed Contracts:</h3>
        {subscribedContracts.length > 0 ? (
          <ul className="space-y-2">
            {subscribedContracts.map((address) => (
              <li key={address} className="flex justify-between items-center p-2 bg-transparent border border-gray-100 rounded">
                <span className="font-mono text-xs sm:text-sm break-all">{address}</span>
                <button 
                  onClick={() => handleUnsubscribe(address)}
                  className="px-2 py-1 bg-red-500 text-white text-xs sm:text-sm rounded hover:bg-red-600 transition-colors ml-2"
                >
                  {isUpdating ? 'Unsubscribing...' : 'Unsubscribe'}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No active subscriptions</p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Recent Events:</h3>
        {filteredLogs.length > 0 ? (
          <>
            <ul className="max-h-96 overflow-y-auto space-y-2 md:space-y-3">
              {filteredLogs.map((log, index) => (
                <li 
                  key={index} 
                  className="p-3 bg-transparent border border-gray-100 rounded cursor-pointer sm:hover:border-blue-200"
                  onClick={() => toggleLogExpansion(index)}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-1 sm:gap-2 mb-2 px-1">
                    <span className="font-mono text-xs sm:text-sm">{log.eventName}</span>
                    <span className="text-gray-500 text-xs sm:text-sm">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <pre className={`text-xs md:text-sm whitespace-pre-wrap break-words ${expandedLogs.has(index) ? '' : 'max-h-20 overflow-hidden'}`}>
                    {JSON.stringify(log, null, 2)}
                  </pre>
                  {!expandedLogs.has(index) && (
                    <div className="text-center mt-1">
                      <span className="text-blue-500 text-xs sm:text-sm">Click to expand</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            
            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-4">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-2 bg-transparent border-2 rounded disabled:opacity-50 w-full sm:w-auto"
              >
                Previous
              </button>
              <span className="text-xs sm:text-sm text-center">
                Page {pagination.page} of {Math.ceil(filteredLogs.length / pagination.pageSize)}
              </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= Math.ceil(filteredLogs.length / pagination.pageSize)}
                  className="px-3 py-2 bg-transparent border-2 rounded disabled:opacity-50 w-full sm:w-auto"
                >

                Next
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-500">No events received yet</p>
        )}
      </div>
    </div>
  );
};

export default EventLogViewer;
