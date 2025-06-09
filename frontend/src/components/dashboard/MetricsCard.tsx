import React from 'react';

interface MetricsCardProps {
  title: string;
  stats: Record<string, any>;
  icon?: string;
}

export default function MetricsCard({ title, stats, icon }: MetricsCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center mb-4 pb-3 border-b border-gray-100">
        {icon && <span className="mr-3 text-xl">{icon}</span>}
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="space-y-2">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-gray-600 font-medium">{key}:</span>
            <span className="text-gray-800 font-semibold">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
