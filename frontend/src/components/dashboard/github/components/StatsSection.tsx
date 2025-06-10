import { StatsCard } from './StatsCard';
import type { RunStats } from '../utils/calculateStats';

interface StatsSectionProps {
  stats: RunStats;
  testCoverage: string;
}

export const StatsSection = ({ stats, testCoverage }: StatsSectionProps) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <StatsCard
      title="Success Rate"
      stats={{ successRate: stats.successRate, avgDuration: stats.avgDuration }}
      icon="✅"
    />
    <StatsCard
      title="Duration"
      stats={{ successRate: stats.successRate, avgDuration: stats.avgDuration }}
      icon="⏱️"
    />
    <StatsCard
      title="Coverage"
      stats={{ successRate: parseFloat(testCoverage), avgDuration: 0 }}
      icon="🧪"
    />
  </div>
);
