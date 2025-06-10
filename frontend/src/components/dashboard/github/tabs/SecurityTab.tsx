import type { SlitherFinding } from '@/types/github';
import { useSlitherReport } from '../hooks/useSlitherReport';

interface SecurityTabProps {
  repo: string;
}

export function SecurityTab({ repo }: SecurityTabProps) {
  const { report, loading, error } = useSlitherReport({ repo });

  if (loading) return <div>Loading security report...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!report) return <div>No security report available</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Security Findings</h3>
      {report.results.map((finding) => (
        <div key={finding.id} className="border rounded p-4">
          <div className="flex justify-between">
            <span className="font-medium">{finding.contract}: {finding.description}</span>
            <span className={`px-2 py-1 rounded text-xs ${
              finding.severity === 'high' ? 'bg-red-100 text-red-800' :
              finding.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {finding.severity.toUpperCase()}
            </span>
          </div>
          <p className="mt-2 text-sm">Impact: {finding.impact}</p>
          {finding.reference && (
            <a 
              href={finding.reference} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 text-sm hover:underline"
            >
              Reference
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
