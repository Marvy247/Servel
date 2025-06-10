interface StatsCardProps {
  title: string;
  stats: {
    successRate: number;
    avgDuration: number;
  };
  icon: React.ReactNode;
}

export const StatsCard = ({ title, stats, icon }: StatsCardProps) => {
  const getValue = () => {
    switch(title) {
      case 'Success Rate':
        return `${stats.successRate.toFixed(1)}%`;
      case 'Duration':
        return `${(stats.avgDuration / 60).toFixed(1)} min`;
      case 'Coverage':
        return `${stats.successRate.toFixed(1)}%`;
      default:
        return '';
    }
  };

  const getTrend = () => {
    switch(title) {
      case 'Success Rate':
        return stats.successRate > 80 ? 'up' : 'down';
      case 'Duration':
        return stats.avgDuration < 300 ? 'up' : 'down';
      case 'Coverage':
        return stats.successRate > 80 ? 'up' : 'down';
      default:
        return 'neutral';
    }
  };

  const trend = getTrend();
  const value = getValue();

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xl">{icon}</span>
          {trend === 'up' ? (
            <span className="text-green-500">↑</span>
          ) : trend === 'down' ? (
            <span className="text-red-500">↓</span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
