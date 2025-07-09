import React, { useState } from 'react';
import { FaCogs, FaListAlt, FaChartLine, FaClipboardList, FaFileContract, FaRocket } from 'react-icons/fa';
import { FiActivity, FiCheckCircle, FiAlertTriangle, FiClock, FiGitBranch, FiPackage } from 'react-icons/fi';
import ContractInteraction from './ContractInteraction';
import EventLogViewer from './EventLogViewer';
import QuickActions from './QuickActions';
import NetworkStatus from './NetworkStatus';
import GasUsage from './GasUsage';
import { DeploymentHistory } from './DeploymentHistory';
import { FailureTrendChart } from './FailureTrendChart';
import { GitHubStatus } from './GitHubStatus';
import MetricsCard from './MetricsCard';
import { SlitherReport } from './SlitherReport';
import { TestingSummary } from './TestingSummary';
import { TestResults } from './TestResults';
import { ContractsList } from './ContractsList';
import DeploymentWizard from './DeploymentWizard';

const DashboardLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'interaction' | 'events' | 'monitor' | 'testing' | 'contracts' | 'deployment'>('interaction');
  const [ciStatus, setCiStatus] = useState<'success' | 'failed' | 'running'>('running');
  const [network, setNetwork] = useState<'sepolia' | 'anvil'>('sepolia');

  // Mock sample data for required props
  const sampleProjectId = 'project-123';
  const sampleRepo = 'user/repo';
  const sampleData = [{ date: '2023-01-01', count: 10 }, { date: '2023-01-02', count: 15 }];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <FiPackage className="text-white text-lg" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Servel</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              Documentation
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium">
              U
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Project Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-gray-500">Ethereum smart contract deployment and management</p>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2">
              <FiGitBranch className="text-gray-500" />
              <span>main</span>
            </button>
            <button className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors">
              New Deployment
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Project Overview Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Project Overview
              </h3>
              
              <div className="space-y-5">
                <div>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <FiPackage className="mr-2" />
                    Smart Contracts
                  </div>
                  <p className="text-lg font-medium text-gray-900">2 deployed</p>
                </div>

                <div>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <FiActivity className="mr-2" />
                    CI/CD Status
                  </div>
                  <div className="flex items-center">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      ciStatus === 'success' ? 'bg-green-50 text-green-700' :
                      ciStatus === 'failed' ? 'bg-red-50 text-red-700' :
                      'bg-yellow-50 text-yellow-700'
                    }`}>
                      {ciStatus === 'success' ? (
                        <FiCheckCircle className="mr-1.5" />
                      ) : ciStatus === 'failed' ? (
                        <FiAlertTriangle className="mr-1.5" />
                      ) : (
                        <FiClock className="mr-1.5 animate-pulse" />
                      )}
                      {ciStatus === 'success' ? 'Success' : ciStatus === 'failed' ? 'Failed' : 'Running'}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {ciStatus === 'running' ? 'Deploying contract...' : 
                     ciStatus === 'success' ? 'Last deployment succeeded' : 
                     'Last deployment failed'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <FiActivity className="mr-2" />
                    Network
                  </div>
                  <div className="flex space-x-2 mb-1">
                    <button
                      onClick={() => setNetwork('sepolia')}
                      className={`px-3 py-1 text-xs rounded-lg font-medium ${
                        network === 'sepolia' 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } transition-colors`}
                    >
                      Sepolia
                    </button>
                    <button
                      onClick={() => setNetwork('anvil')}
                      className={`px-3 py-1 text-xs rounded-lg font-medium ${
                        network === 'anvil' 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } transition-colors`}
                    >
                      Anvil
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Last deployment: 2 minutes ago</p>
                </div>
              </div>
            </div>

            {/* Quick Stats Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-600 font-medium">Gas Used</p>
                  <p className="text-lg font-bold text-gray-900">1.2 ETH</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-600 font-medium">Success Rate</p>
                  <p className="text-lg font-bold text-gray-900">98%</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-xs text-purple-600 font-medium">Contracts</p>
                  <p className="text-lg font-bold text-gray-900">5</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3">
                  <p className="text-xs text-yellow-600 font-medium">Tests</p>
                  <p className="text-lg font-bold text-gray-900">42</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Tab Navigation */}
            <div className="flex overflow-x-auto scrollbar-hide mb-6">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  className={`px-4 py-2 text-sm font-medium rounded-md flex items-center space-x-2 transition-colors ${
                    activeTab === 'interaction' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('interaction')}
                >
                  <FaCogs className="text-current" />
                  <span>Interaction</span>
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium rounded-md flex items-center space-x-2 transition-colors ${
                    activeTab === 'events' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('events')}
                >
                  <FaListAlt className="text-current" />
                  <span>Events</span>
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium rounded-md flex items-center space-x-2 transition-colors ${
                    activeTab === 'monitor' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('monitor')}
                >
                  <FaChartLine className="text-current" />
                  <span>Monitor</span>
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium rounded-md flex items-center space-x-2 transition-colors ${
                    activeTab === 'testing' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('testing')}
                >
                  <FaClipboardList className="text-current" />
                  <span>Testing</span>
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium rounded-md flex items-center space-x-2 transition-colors ${
                    activeTab === 'contracts' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('contracts')}
                >
                  <FaFileContract className="text-current" />
                  <span>Contracts</span>
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium rounded-md flex items-center space-x-2 transition-colors ${
                    activeTab === 'deployment' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('deployment')}
                >
                  <FaRocket className="text-current" />
                  <span>Deployment</span>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {activeTab === 'interaction' ? (
                <div className="p-6">
                  <ContractInteraction />
                </div>
              ) : activeTab === 'events' ? (
                <div className="p-6">
                  <EventLogViewer />
                </div>
              ) : activeTab === 'monitor' ? (
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <QuickActions />
                    <NetworkStatus />
                    <GasUsage />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DeploymentHistory projectId={sampleProjectId} />
                    <FailureTrendChart data={sampleData} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <GitHubStatus repo={sampleRepo} />
                    <MetricsCard title="Sample Title" stats={[]} />
                  </div>
                </div>
              ) : activeTab === 'testing' ? (
                <div className="p-6 space-y-6">
                  <SlitherReport projectId={sampleProjectId} />
                  <TestingSummary projectId={sampleProjectId} />
                  <TestResults projectId={sampleProjectId} />
                </div>
              ) : activeTab === 'contracts' ? (
                <div className="p-6">
                  <ContractsList projectId={sampleProjectId} />
                </div>
              ) : activeTab === 'deployment' ? (
                <div className="p-6">
                  <DeploymentWizard />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;