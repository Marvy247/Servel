import React, { useState } from 'react';
import { FiGitBranch, FiZap, FiShield, FiUploadCloud, FiSearch, FiRefreshCw } from 'react-icons/fi';
import { FaGithub } from 'react-icons/fa';
import { RepositorySelector } from '../github/RepositorySelector';
import { useGitHubAuth } from '../../hooks/useGitHubAuth';

type GitHubTabType = 'repositories' | 'ci' | 'security' | 'deployments';

interface GitHubTabProps {
  className?: string;
}

export const GitHubTab: React.FC<GitHubTabProps> = ({ className }) => {
  const [activeSubTab, setActiveSubTab] = useState<GitHubTabType>('repositories');
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isAuthenticated, login } = useGitHubAuth();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleRepoSelect = (repoFullName: string) => {
    setSelectedRepo(repoFullName);
    if (repoFullName) {
      setActiveSubTab('ci');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-xl">
        <FaGithub className="text-6xl text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">GitHub Integration</h3>
        <p className="text-gray-500 mb-6">Connect your GitHub account to manage repositories and workflows</p>
        <button
          onClick={login}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <FaGithub />
          <span>Connect GitHub Account</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${className || ''}`}>
      {/* Header */}
      <div className="border-b border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <FaGithub className="text-gray-700" />
              <span>GitHub</span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">Manage repositories, workflows, and deployments</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleRefresh}
              className={`p-2 text-gray-500 hover:text-gray-700 transition-colors ${
                isRefreshing ? 'animate-spin' : ''
              }`}
            >
              <FiRefreshCw />
            </button>
          </div>
        </div>
      </div>

      {/* Repository Selector */}
      <div className="border-b border-gray-100 p-4">
        <RepositorySelector
          selectedRepo={selectedRepo ? { id: 0, name: selectedRepo, full_name: selectedRepo, description: null, private: false, owner: { login: '', avatar_url: '' }, html_url: '', language: null, stargazers_count: 0, watchers_count: 0, forks_count: 0, updated_at: '', created_at: '', pushed_at: '' } : undefined}
          onRepositorySelect={(repo) => handleRepoSelect(repo.full_name)}
        />
      </div>

      {/* Sub Navigation */}
      {selectedRepo && (
        <div className="border-b border-gray-100">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveSubTab('ci')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium ${
                activeSubTab === 'ci' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiZap className="text-current" />
              CI/CD
            </button>
            <button
              onClick={() => setActiveSubTab('security')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium ${
                activeSubTab === 'security' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiShield className="text-current" />
              Security
            </button>
            <button
              onClick={() => setActiveSubTab('deployments')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium ${
                activeSubTab === 'deployments' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiUploadCloud className="text-current" />
              Deployments
            </button>
          </nav>
        </div>
      )}

      {/* Tab Content */}
      <div className="p-6">
        {!selectedRepo ? (
          <div className="text-center py-12">
            <FiGitBranch className="text-4xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Select a Repository</h3>
            <p className="text-gray-500">Choose a repository from the dropdown above to view GitHub workflows and deployments</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activeSubTab === 'ci' && (
              <div className="text-center py-8">
                <FiZap className="text-4xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">CI/CD Workflows</h3>
                <p className="text-gray-500">CI/CD workflows for {selectedRepo} will be displayed here</p>
              </div>
            )}
            {activeSubTab === 'security' && (
              <div className="text-center py-8">
                <FiShield className="text-4xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">Security Scanning</h3>
                <p className="text-gray-500">Security analysis for {selectedRepo} will be displayed here</p>
              </div>
            )}
            {activeSubTab === 'deployments' && (
              <div className="text-center py-8">
                <FiUploadCloud className="text-4xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">Deployments</h3>
                <p className="text-gray-500">Deployment history for {selectedRepo} will be displayed here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
