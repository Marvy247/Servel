import React from 'react';
import { FiActivity, FiTrendingUp, FiDatabase, FiAlertTriangle, FiCheckCircle, FiClock } from 'react-icons/fi';

interface MetricsCardProps {
  title: string;
  stats: Record<string, any>;
  icon?: 'activity' | 'trending' | 'database' | 'alert' | 'check' | 'clock';
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const iconMap = {
  activity: <FiActivity />,
  trending: <FiTrendingUp />,
  database: <FiDatabase />,
  alert: <FiAlertTriangle />,
  check: <FiCheckCircle />,
  clock: <FiClock />,
};

const variantStyles = {
  default: {
    bg: 'bg-white',
    border: 'border-gray-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    title: 'text-gray-800',
    key: 'text-gray-600',
    value: 'text-gray-900',
  },
  success: {
    bg: 'bg-white',
    border: 'border-green-200',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    title: 'text-gray-800',
    key: 'text-gray-600',
    value: 'text-green-700',
  },
  warning: {
    bg: 'bg-white',
    border: 'border-yellow-200',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    title: 'text-gray-800',
    key: 'text-gray-600',
    value: 'text-yellow-700',
  },
  danger: {
    bg: 'bg-white',
    border: 'border-red-200',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    title: 'text-gray-800',
    key: 'text-gray-600',
    value: 'text-red-700',
  },
};

export default function MetricsCard({ 
  title, 
  stats, 
  icon = 'activity', 
  variant = 'default' 
}: MetricsCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className={`rounded-xl border ${styles.border} ${styles.bg} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}>
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${styles.iconBg} ${styles.iconColor}`}>
            {iconMap[icon]}
          </div>
          <h3 className={`text-lg font-semibold ${styles.title}`}>{title}</h3>
        </div>
        
        <div className="space-y-3">
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center">
              <span className={`text-sm ${styles.key}`}>{key}</span>
              <span className={`font-medium ${styles.value}`}>
                {typeof value === 'number' ? value.toLocaleString() : value}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Optional status bar */}
      {variant !== 'default' && (
        <div className={`h-1 w-full ${
          variant === 'success' ? 'bg-green-500' :
          variant === 'warning' ? 'bg-yellow-500' :
          'bg-red-500'
        }`}></div>
      )}
    </div>
  );
}