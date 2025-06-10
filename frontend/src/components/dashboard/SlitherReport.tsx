import { useState, useEffect, useCallback } from 'react';
import { StatusBadge, type Status } from './StatusBadge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SlitherFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  remediation?: string;
  contract: string;
  location: {
    file: string;
    line: number;
  };
  confidence?: string;
  impact?: string;
  extra?: {
    reference?: string;
    solution?: string;
  };
}

interface SlitherReportProps {
  projectId: string;
}

const severityColors = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-gray-500',
  info: 'bg-gray-300'
};

const severityBorderColors = {
  critical: 'border-red-600',
  high: 'border-orange-600',
  medium: 'border-yellow-600',
  low: 'border-gray-600',
  info: 'border-gray-400'
};

export function SlitherReport({ projectId }: SlitherReportProps) {
  const [findings, setFindings] = useState<SlitherFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
  const [severityStats, setSeverityStats] = useState<Record<string, number>>({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0
  });

  const fetchReport = useCallback(async () => {
    try {
      // For testing markdown rendering
      const testFinding = {
        id: 'test-md',
        severity: 'info',
        title: 'Markdown Test Finding',
        description: `# Test Markdown Rendering\n\nThis is a **test** of markdown features:\n\n- Lists\n- [Links](https://example.com)\n- Code blocks:\n\n\`\`\`solidity\nfunction test() {\n  // Sample code\n}\n\`\`\`\n\n| Tables | Work |\n|--------|------|\n| col 1  | col 2|\n`,
        remediation: '## Fix Instructions\n\n1. First step\n2. Second step\n\n> Important note',
        contract: 'TestContract.sol',
        location: {
          file: 'test/TestContract.sol',
          line: 42
        }
      };

      const response = await fetch(`/api/analysis/slither/${projectId}`);
      const data = await response.json();
      const findings = data.findings ? [testFinding, ...data.findings] : [testFinding];
      setFindings(findings);
      
      const stats = findings.reduce((acc: Record<string, number>, finding: SlitherFinding) => {
        acc[finding.severity] = (acc[finding.severity] || 0) + 1;
        return acc;
      }, { critical: 0, high: 0, medium: 0, low: 0, info: 0 });
      setSeverityStats(stats);
    } catch (err) {
      setError('Failed to load Slither analysis');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const getSeverityStatus = (severity: string): Status => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'action_required';
      case 'low': return 'neutral';
      case 'info': return 'skipped';
      default: return 'neutral';
    }
  };

  const filteredFindings = findings.filter(finding => 
    filter === 'all' || finding.severity === filter
  );

  const toggleExpandFinding = (id: string) => {
    setExpandedFinding(expandedFinding === id ? null : id);
  };

  const totalFindings = findings.length;
  const severityPercentages = Object.fromEntries(
    Object.entries(severityStats).map(([severity, count]) => [
      severity,
      totalFindings > 0 ? Math.round((count / totalFindings) * 100) : 0
    ])
  );

  if (loading) return <div>Loading Slither analysis...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Security Analysis</h3>
          <p className="text-sm text-gray-500">
            Static analysis results from Slither
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded ${filter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-3 py-1 text-sm rounded ${filter === 'critical' ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}
          >
            Critical
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`px-3 py-1 text-sm rounded ${filter === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100'}`}
          >
            High
          </button>
          <button
            onClick={() => setFilter('medium')}
            className={`px-3 py-1 text-sm rounded ${filter === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100'}`}
          >
            Medium
          </button>
          <button
            onClick={() => setFilter('low')}
            className={`px-3 py-1 text-sm rounded ${filter === 'low' ? 'bg-gray-100 text-gray-800' : 'bg-gray-100'}`}
          >
            Low
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="p-4 bg-white rounded-lg border shadow-sm">
            <h4 className="font-medium mb-4">Severity Distribution</h4>
            <div className="h-64 space-y-2">
              {Object.entries(severityStats).map(([severity, count]) => (
                <div key={severity} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{severity}</span>
                    <span>{count} ({severityPercentages[severity]}%)</span>
                  </div>
                  <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${severityColors[severity as keyof typeof severityColors]} ${severityBorderColors[severity as keyof typeof severityBorderColors]} border-r`}
                      style={{ width: `${severityPercentages[severity]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {Object.entries(severityStats).map(([severity, count]) => (
              <div 
                key={severity} 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  filter === severity ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
                onClick={() => setFilter(severity as any)}
              >
                <div className="flex items-center justify-between">
                  <span className="capitalize font-medium">{severity}</span>
                  <StatusBadge status={getSeverityStatus(severity)} />
                </div>
                <div className="text-2xl font-bold mt-2">{count}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {severityPercentages[severity]}% of findings
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredFindings.length === 0 ? (
          <div className="text-gray-500">No findings match the selected filter</div>
        ) : (
          filteredFindings.map((finding) => (
            <div key={finding.id} className="p-4 border rounded-lg">
              <div 
                className="flex items-start justify-between cursor-pointer"
                onClick={() => toggleExpandFinding(finding.id)}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={getSeverityStatus(finding.severity)} />
                    <h4 className="font-medium">{finding.title}</h4>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">
                      {finding.contract}:{finding.location.line}
                    </span>
                  </div>
                </div>
                <div className="text-gray-500">
                  {expandedFinding === finding.id ? '▲' : '▼'}
                </div>
              </div>
              
              {expandedFinding === finding.id && (
                <div className="mt-3 pt-3 border-t space-y-4">
                  <div className="prose prose-sm max-w-none">
                    <h5 className="font-medium">Description</h5>
                    <div className="prose prose-sm max-w-none bg-gray-50 p-3 rounded">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {finding.description}
                      </ReactMarkdown>
                    </div>
                    {finding.confidence && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Confidence:</span> {finding.confidence}
                      </div>
                    )}
                    {finding.impact && (
                      <div className="mt-1 text-sm">
                        <span className="font-medium">Impact:</span> {finding.impact}
                      </div>
                    )}
                  </div>
                  {(finding.remediation || finding.extra?.solution) && (
                    <div className="p-3 bg-green-50 rounded border border-green-100">
                      <h5 className="font-medium text-green-800 mb-2">Recommended Fix</h5>
                      <div className="bg-white p-3 rounded border">
                      <div className="relative mt-2">
                        <div className="prose prose-sm max-w-none bg-gray-100 p-3 rounded border">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {finding.remediation || finding.extra?.solution}
                          </ReactMarkdown>
                        </div>
                        <button
                          onClick={() => navigator.clipboard.writeText(finding.remediation || finding.extra?.solution || '')}
                          className="absolute top-3 right-3 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                        >
                          Copy
                        </button>
                      </div>

                      </div>
                    </div>
                  )}
                  {finding.extra?.reference && (
                    <div className="mt-2">
                      <a 
                        href={finding.extra.reference}
                        className="text-blue-500 hover:underline text-sm"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Reference Documentation
                      </a>
                    </div>
                  )}
                  <div className="mt-2 text-sm">
                    <div className="flex space-x-4">
                      <a 
                        href={`/contracts/${encodeURIComponent(finding.contract)}#L${finding.location.line}`}
                        className="text-blue-500 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View {finding.contract} at line {finding.location.line}
                      </a>
                      <a 
                        href={`https://github.com/${projectId}/blob/main/${finding.location.file}#L${finding.location.line}`}
                        className="text-blue-500 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View on GitHub
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
