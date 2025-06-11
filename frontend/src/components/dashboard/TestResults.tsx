import { useState, useEffect, useRef } from 'react';
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
        const [testResults, coverageData] = await Promise.all([
          fetch(`/api/dashboard/test-results?projectId=${projectId}`),
          fetch(`/api/dashboard/test-coverage?projectId=${projectId}`)
        ]);

        const resultsData = await handleResponse(testResults);
        const coverage = await handleResponse(coverageData);
        
        // Start with base test results
        const combinedResults = [...(resultsData?.results || [])];
        
        // Try to get slither results if available
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

    // Initialize WebSocket connection
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
        // Fallback to polling if WebSocket closes
        setTimeout(setupWebSocket, 5000);
      };
    };

    setupWebSocket();
    fetchResults();
    const interval = setInterval(fetchResults, 60000); // Refresh every minute
    
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

  if (loading) return <div>Loading test results...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Test Results</h3>
        <div className="flex flex-wrap gap-2">
          {stats && (
            <div className="flex items-center space-x-4 mr-4">
              <span className="text-sm">
                Coverage: <span className="font-medium">{stats.coverage}%</span>
              </span>
              <span className="text-sm">
                Avg Duration: <span className="font-medium">{stats.avgDuration}ms</span>
              </span>
            </div>
          )}
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded ${filter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('passed')}
              className={`px-3 py-1 text-sm rounded ${filter === 'passed' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}
            >
              Passed
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-3 py-1 text-sm rounded ${filter === 'failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}
            >
              Failed
            </button>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setTestType('all')}
              className={`px-3 py-1 text-sm rounded ${testType === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
            >
              All Types
            </button>
            <button
              onClick={() => setTestType('unit')}
              className={`px-3 py-1 text-sm rounded ${testType === 'unit' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100'}`}
            >
              Unit
            </button>
            <button
              onClick={() => setTestType('integration')}
              className={`px-3 py-1 text-sm rounded ${testType === 'integration' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}
            >
              Integration
            </button>
            <button
              onClick={() => setTestType('e2e')}
              className={`px-3 py-1 text-sm rounded ${testType === 'e2e' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100'}`}
            >
              E2E
            </button>
            <button
              onClick={() => setTestType('fuzz')}
              className={`px-3 py-1 text-sm rounded ${testType === 'fuzz' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100'}`}
            >
              Fuzz
            </button>
            <button
              onClick={() => setTestType('invariant')}
              className={`px-3 py-1 text-sm rounded ${testType === 'invariant' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100'}`}
            >
              Invariant
            </button>
            <button
              onClick={() => setTestType('security')}
              className={`px-3 py-1 text-sm rounded ${testType === 'security' ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}
            >
              Security
            </button>
          </div>
        </div>
      </div>

      {stats && (
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="text-sm font-medium mb-2">Test Results Trend (Last 7 Days)</h4>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h5 className="text-sm font-medium mb-2">Test Coverage</h5>
              <div className="flex items-center">
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${stats.coverage}%` }}
                  />
                </div>
                <span className="ml-2 text-sm font-medium">{stats.coverage}%</span>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h5 className="text-sm font-medium mb-2">Security Analysis</h5>
              <div className="flex items-center justify-between">
                <span className="text-sm">Findings:</span>
                <span className="font-medium">{stats.slitherFindings || 0}</span>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h5 className="text-sm font-medium mb-2">Gas Usage</h5>
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg:</span>
                <span className="font-medium">
                  {stats.avgGasUsed !== null ? stats.avgGasUsed : 'N/A'}
                </span>
                <span className="text-sm">Max:</span>
                <span className="font-medium">
                  {stats.maxGasUsed !== null ? stats.maxGasUsed : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          <div className="h-40 flex items-end space-x-1">
            {stats.history.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="flex-1 w-full flex items-end space-x-px">
                  <div 
                    className="bg-green-100 w-full rounded-t-sm" 
                    style={{ height: `${(day.passed / stats.total) * 100}%` }}
                  />
                  <div 
                    className="bg-red-100 w-full rounded-t-sm" 
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

      <div className="space-y-2">
        {filteredResults.length === 0 ? (
          <div className="text-gray-500">No test results found</div>
        ) : (
          filteredResults.map((result) => (
            <div key={result.id} className="p-3 border rounded hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <StatusBadge status={statusMap[result.status]} />
                  <span>{result.name}</span>
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-medium">{result.duration}ms</span>
                  {result.gasUsed !== undefined && (
                    <span className="ml-2" title="Gas used">
                      ⛽ {result.gasUsed}
                    </span>
                  )}
                  {result.fuzzRuns !== undefined && (
                    <span className="ml-2" title="Fuzz iterations">
                      🔄 {result.fuzzRuns}
                    </span>
                  )}
                  {result.invariantChecks !== undefined && (
                    <span className="ml-2" title="Invariant checks">
                      🛡️ {result.invariantChecks}
                    </span>
                  )}
                  {result.coverage !== undefined && (
                    <span className="ml-2" title={`Coverage: ${result.coverage.lines}% lines, ${result.coverage.functions}% functions, ${result.coverage.branches}% branches`}>
                      📊 {result.coverage.lines}% lines ({result.coverage.functions}% fn)
                    </span>
                  )}
                </div>
              </div>
              {result.details && (
                <div className="mt-2 text-sm text-gray-600">
                  {result.details}
                  {result.artifactUrl && (
                    <a 
                      href={result.artifactUrl} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:underline"
                    >
                      Download Artifacts
                    </a>
                  )}
                  {result.logUrl && (
                    <a 
                      href={result.logUrl} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:underline"
                    >
                      View Logs
                    </a>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
