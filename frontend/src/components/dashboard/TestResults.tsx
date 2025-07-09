import { useState, useEffect, useRef } from 'react';
import { FiCheckCircle, FiXCircle, FiSkipForward, FiClock, FiDownload, FiFileText, FiBarChart2, FiShield, FiZap } from 'react-icons/fi';
import { FaGasPump, FaRandom, FaShieldAlt } from 'react-icons/fa';
import { StatusBadge, type Status } from './StatusBadge';

interface TestResult {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'pending';
  duration: number;
  timestamp: string;
  details?: string;
  type?: 'unit' | 'integration' | 'e2e' | 'fuzz' | 'invariant' | 'security';
  artifactUrl?: string;
  logUrl?: string;
  gasUsed?: number;
  fuzzRuns?: number;
  invariantChecks?: number;
  coverage?: {
    lines: number;
    branches: number;
    functions: number;
  };
}

interface TestStats {
  total: number;
  passed: number;
  coverage: number;
  avgDuration: number;
  avgGasUsed: number | null;
  maxGasUsed: number | null;
  slitherFindings: number | null;
  fuzzCoverage: number | null;
  invariantViolations: number | null;
  history: {
    date: string;
    passed: number;
    failed: number;
  }[];
}

interface TestResultsProps {
  projectId: string;
}

const statusIcons = {
  passed: <FiCheckCircle className="text-green-500" />,
  failed: <FiXCircle className="text-red-500" />,
  skipped: <FiSkipForward className="text-yellow-500" />,
  pending: <FiClock className="text-blue-500" />
};

const testTypeColors = {
  unit: 'bg-purple-100 text-purple-800',
  integration: 'bg-green-100 text-green-800',
  e2e: 'bg-yellow-100 text-yellow-800',
  fuzz: 'bg-orange-100 text-orange-800',
  invariant: 'bg-indigo-100 text-indigo-800',
  security: 'bg-red-100 text-red-800'
};

export function TestResults({ projectId }: TestResultsProps) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [stats, setStats] = useState<TestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [testType, setTestType] = useState<'all' | 'unit' | 'integration' | 'e2e' | 'fuzz' | 'invariant' | 'security'>('all');

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const handleResponse = async (response: Response) => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error ${response.status}: ${errorText}`);
      }
      return response.json();
    };

    const fetchResults = async () => {
      try {
        setLoading(true);
        const [testResults, coverageData] = await Promise.all([
          fetch(`/api/dashboard/test-results?projectId=${projectId}`),
          fetch(`/api/dashboard/test-coverage?projectId=${projectId}`)
        ]);

        const resultsData = await handleResponse(testResults);
        const coverage = await handleResponse(coverageData);
        
        const combinedResults = [...(resultsData?.results || [])];
        
        try {
          const slitherResponse = await fetch(`/api/dashboard/slither/results?projectId=${projectId}`);
          if (slitherResponse.ok) {
            const slitherData = await slitherResponse.json();
            combinedResults.push(...slitherData.findings.map((finding: any) => ({
              id: `slither-${finding.id}`,
              name: finding.title,
              status: finding.severity === 'high' ? 'failed' : 'passed',
              duration: 0,
              timestamp: finding.created_at,
              details: finding.description,
              type: 'security',
              artifactUrl: finding.artifactUrl,
              logUrl: finding.sourceUrl
            })));
          }
        } catch (slitherError) {
          console.log('Slither results not available');
        }

        setResults(combinedResults);
        setStats({
          ...(resultsData.stats || {}),
          coverage: coverage?.data?.total || 0,
          slitherFindings: resultsData.stats?.slitherFindings || 0
        });
      } catch (error: any) {
        setError(`Failed to load test results: ${error.message}`);
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    const setupWebSocket = () => {
      const wsUrl = `ws://${window.location.host}/ws/test-results?projectId=${projectId}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.event) {
          const { results, stats } = data.event;
          setResults(results);
          setStats(stats);
        }
      };

      wsRef.current.onclose = () => {
        setTimeout(setupWebSocket, 5000);
      };
    };

    setupWebSocket();
    fetchResults();
    const interval = setInterval(fetchResults, 60000);
    
    return () => {
      clearInterval(interval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [projectId]);

  const filteredResults = results.filter((result: TestResult) => {
    const statusMatch = filter === 'all' || result.status === filter;
    const typeMatch = testType === 'all' || result.type === testType;
    return statusMatch && typeMatch;
  });

  const statusMap: Record<TestResult['status'], Status> = {
    passed: 'success',
    failed: 'error',
    skipped: 'skipped',
    pending: 'pending'
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
        <div className="flex items-center">
          <FiXCircle className="text-red-500 mr-2" />
          <h3 className="text-sm font-medium text-red-800">{error}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Test Results</h2>
            <p className="text-sm text-gray-500">Detailed test execution metrics and coverage</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            
            <div className="relative">
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value as any)}
                className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="unit">Unit</option>
                <option value="integration">Integration</option>
                <option value="e2e">End-to-End</option>
                <option value="fuzz">Fuzz</option>
                <option value="invariant">Invariant</option>
                <option value="security">Security</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="p-6 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiBarChart2 className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Test Coverage</h3>
                  <p className="text-2xl font-bold text-gray-900">{stats.coverage}%</p>
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${stats.coverage}%` }}
                />
              </div>
            </div>

            <div className="bg-purple-50 p-5 rounded-xl border border-purple-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FiShield className="text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Security Findings</h3>
                  <p className="text-2xl font-bold text-gray-900">{stats.slitherFindings || 0}</p>
                </div>
              </div>
              <div className="text-xs text-purple-600">
                <span>From static analysis</span>
              </div>
            </div>

            <div className="bg-green-50 p-5 rounded-xl border border-green-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FaGasPump className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Gas Usage</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.avgGasUsed !== null ? Math.round(stats.avgGasUsed) : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex justify-between text-xs text-green-600">
                <span>Avg</span>
                <span>Max: {stats.maxGasUsed !== null ? Math.round(stats.maxGasUsed) : 'N/A'}</span>
              </div>
            </div>
          </div>

          <h4 className="text-sm font-medium text-gray-700 mb-3">Test Trend (Last 7 Days)</h4>
          <div className="h-40 flex items-end space-x-1">
            {stats.history.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="flex-1 w-full flex items-end space-x-px">
                  <div 
                    className="bg-green-100 w-full rounded-t-md" 
                    style={{ height: `${(day.passed / stats.total) * 100}%` }}
                  />
                  <div 
                    className="bg-red-100 w-full rounded-t-md" 
                    style={{ height: `${(day.failed / stats.total) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 mt-1">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Results List */}
      <div className="p-6">
        {filteredResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <FiBarChart2 className="text-3xl mb-2" />
            <p>No test results match your filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredResults.map((result) => (
              <div 
                key={result.id} 
                className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {statusIcons[result.status]}
                    </div>
                    <div>
                      <div className="font-medium">{result.name}</div>
                      {result.type && (
                        <span className={`text-xs px-2 py-1 rounded-full ${testTypeColors[result.type]} mt-1 inline-block`}>
                          {result.type}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    {result.duration && (
                      <span className="flex items-center gap-1">
                        <FiClock className="text-gray-400" />
                        {result.duration}ms
                      </span>
                    )}
                    {result.gasUsed !== undefined && (
                      <span className="flex items-center gap-1" title="Gas used">
                        <FaGasPump className="text-gray-400" />
                        {result.gasUsed}
                      </span>
                    )}
                    {result.fuzzRuns !== undefined && (
                      <span className="flex items-center gap-1" title="Fuzz iterations">
                        <FaRandom className="text-gray-400" />
                        {result.fuzzRuns}
                      </span>
                    )}
                    {result.invariantChecks !== undefined && (
                      <span className="flex items-center gap-1" title="Invariant checks">
                        <FaShieldAlt className="text-gray-400" />
                        {result.invariantChecks}
                      </span>
                    )}
                  </div>
                </div>

                {(result.details || result.artifactUrl || result.logUrl) && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    {result.details && (
                      <p className="text-sm text-gray-600 mb-2">{result.details}</p>
                    )}
                    <div className="flex gap-3">
                      {result.artifactUrl && (
                        <a 
                          href={result.artifactUrl} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <FiDownload className="text-current" />
                          Artifacts
                        </a>
                      )}
                      {result.logUrl && (
                        <a 
                          href={result.logUrl} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <FiFileText className="text-current" />
                          Logs
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}