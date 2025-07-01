import React, { useState } from 'react';
import ContractInteraction from './ContractInteraction';
import EventLogViewer from './EventLogViewer';
import QuickActions from './QuickActions';
import NetworkStatus from './NetworkStatus';
import GasUsage from './GasUsage';

const DashboardLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'interaction' | 'events' | 'monitor'>('interaction');
  const [ciStatus, setCiStatus] = useState<'success' | 'failed' | 'running'>('running');
  const [network, setNetwork] = useState<'sepolia' | 'anvil'>('sepolia');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
      {/* Project Overview Section */}
      <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Project Overview</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Smart Contracts</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">2 deployed contracts</p>
          </div>
          <div>
            <h3 className="font-medium">CI/CD Status</h3>
            <div className="space-y-2">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                ciStatus === 'success' ? 'bg-green-100 text-green-800' :
                ciStatus === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800 animate-pulse'
              }`}>
                {ciStatus === 'success' ? '✓ Success' : ciStatus === 'failed' ? '✗ Failed' : '⟳ Running'}
              </div>
              <div className="text-xs text-gray-500">
                {ciStatus === 'running' ? 'Deploying contract...' : 
                 ciStatus === 'success' ? 'Last deployment succeeded' : 
                 'Last deployment failed'}
              </div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Network</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setNetwork('sepolia')}
                  className={`px-2 py-1 text-xs rounded ${
                    network === 'sepolia' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  Sepolia
                </button>
                <button
                  onClick={() => setNetwork('anvil')}
                  className={`px-2 py-1 text-xs rounded ${
                    network === 'anvil' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  Anvil
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Last deployment: 2 minutes ago</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-2 space-y-6">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`px-4 py-2 font-medium text-sm focus:outline-none ${
              activeTab === 'interaction' 
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('interaction')}
          >
            Contract Interaction
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm focus:outline-none ${
              activeTab === 'events' 
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('events')}
          >
            Event Logs
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm focus:outline-none ${
              activeTab === 'monitor' 
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('monitor')}
          >
            Monitor
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {activeTab === 'interaction' ? (
            <ContractInteraction />
          ) : activeTab === 'events' ? (
            <EventLogViewer />
          ) : (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <QuickActions />
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <NetworkStatus />
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <GasUsage />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h3 className="font-medium mb-2">Contract Health</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm">Security: Excellent</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                    <span className="text-sm">Gas Usage: Moderate</span>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h3 className="font-medium mb-2">Recent Transactions</h3>
                <EventLogViewer />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
