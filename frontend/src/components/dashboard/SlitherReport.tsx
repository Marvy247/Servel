import { useState, useEffect, useCallback } from 'react';
import { StatusBadge, type Status } from './StatusBadge';

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
      const response = await fetch(`/api/analysis/slither/${projectId}`);
      const data = await response.json();
      const findings = data.findings || [];
      setFindings(findings);
      
      // Calculate severity statistics
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

  if (loading) return <div>Loading Slither analysis...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Security Analysis</h3>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {Object.entries(severityStats).map(([severity, count]) => (
          <div key={severity} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <span className="capitalize">{severity}</span>
              <StatusBadge status={getSeverityStatus(severity)} />
            </div>
            <div className="text-2xl font-bold mt-2">{count}</div>
          </div>
        ))}
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
                <div className="mt-3 pt-3 border-t">
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap">{finding.description}</pre>
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
                    <div className="mt-4 p-3 bg-blue-50 rounded">
                      <h5 className="font-medium text-blue-800">Remediation</h5>
                      <pre className="whitespace-pre-wrap">
                        {finding.remediation || finding.extra?.solution}
                      </pre>
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
                        href={`/contracts/${finding.contract}#L${finding.location.line}`}
                        className="text-blue-500 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View in contract
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
