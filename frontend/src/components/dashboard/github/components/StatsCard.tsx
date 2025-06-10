import React from 'react';
import { type RunStats } from '../utils/calculateStats';

interface StatsCardProps {
  title: string;
  stats: RunStats;
  icon: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, stats, icon }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col">
      <div className="flex items-center mb-2">
        {icon}
        <h3 className="ml-2 text-lg font-medium">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-2">
        <div>
          <p className="text-sm text-gray-500">Success Rate</p>
          <p className="text-2xl font-bold">
            {stats.successRate.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Avg Duration</p>
          <p className="text-2xl font-bold">
            {(stats.avgDuration / 1000).toFixed(1)}s
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
