import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

interface DataPoint {
  date: string;
  count: number;
}

interface FailureTrendChartProps {
  data: DataPoint[];
  title?: string;
  description?: string;
}

export const FailureTrendChart: React.FC<FailureTrendChartProps> = ({ 
  data = [], 
  title = "Failure Trend", 
  description = "Recent failure occurrences over time" 
}) => {
  // Chart configuration
  const width = 600;
  const height = 200;
  const margin = { top: 30, right: 30, bottom: 40, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Calculate max value with buffer for better visualization
  const maxValue = Math.max(...data.map(d => d.count), 5) * 1.1;

  // Generate Y-axis ticks
  const generateYTicks = () => {
    if (maxValue <= 5) return [0, 1, 2, 3, 4, 5];
    const step = Math.ceil(maxValue / 5);
    return Array.from({ length: 6 }, (_, i) => i * step);
  };

  const yTicks = generateYTicks();

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FiAlertTriangle className="text-red-500 mr-2" />
          {title}
        </h3>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <FiAlertTriangle className="text-3xl mb-2" />
          <p>No data available</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
              {/* Chart background */}
              <rect 
                x={margin.left} 
                y={margin.top} 
                width={innerWidth} 
                height={innerHeight} 
                fill="#f8fafc" 
                rx="4"
              />

              {/* X-axis */}
              <g transform={`translate(${margin.left}, ${height - margin.bottom})`}>
                <line x1={0} x2={innerWidth} stroke="#e2e8f0" />
                {data.map((point, i) => (
                  <g key={i} transform={`translate(${(i * innerWidth) / (data.length - 1)}, 0)`}>
                    <line y1={0} y2={5} stroke="#94a3b8" />
                    <text
                      y={20}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#64748b"
                      fontFamily="Inter, sans-serif"
                    >
                      {formatDate(point.date)}
                    </text>
                  </g>
                ))}
              </g>

              {/* Y-axis */}
              <g transform={`translate(${margin.left}, ${margin.top})`}>
                <line y1={0} y2={innerHeight} stroke="#e2e8f0" />
                {yTicks.map((tick, i) => (
                  <g key={i} transform={`translate(0, ${innerHeight - (tick / maxValue) * innerHeight})`}>
                    <line x1={-5} x2={0} stroke="#94a3b8" />
                    <text
                      x={-10}
                      y={3}
                      textAnchor="end"
                      fontSize="10"
                      fill="#64748b"
                      fontFamily="Inter, sans-serif"
                    >
                      {tick}
                    </text>
                  </g>
                ))}
              </g>

              {/* Grid lines */}
              <g transform={`translate(${margin.left}, ${margin.top})`}>
                {yTicks.map((tick, i) => (
                  <line
                    key={i}
                    x1={0}
                    x2={innerWidth}
                    y1={innerHeight - (tick / maxValue) * innerHeight}
                    y2={innerHeight - (tick / maxValue) * innerHeight}
                    stroke="#e2e8f0"
                    strokeDasharray="2,2"
                  />
                ))}
              </g>

              {/* Line */}
              <g transform={`translate(${margin.left}, ${margin.top})`}>
                <path
                  d={data.map((point, i) => {
                    const x = (i * innerWidth) / (data.length - 1);
                    const y = innerHeight - (point.count / maxValue) * innerHeight;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Area fill */}
                <path
                  d={`
                    M 0 ${innerHeight}
                    ${data.map((point, i) => {
                      const x = (i * innerWidth) / (data.length - 1);
                      const y = innerHeight - (point.count / maxValue) * innerHeight;
                      return `L ${x} ${y}`;
                    }).join(' ')}
                    L ${innerWidth} ${innerHeight}
                    Z
                  `}
                  fill="url(#areaGradient)"
                  fillOpacity="0.2"
                />

                {/* Points */}
                {data.map((point, i) => {
                  const x = (i * innerWidth) / (data.length - 1);
                  const y = innerHeight - (point.count / maxValue) * innerHeight;
                  return (
                    <g key={i}>
                      <circle 
                        cx={x} 
                        cy={y} 
                        r="4" 
                        fill="white" 
                        stroke="#ef4444" 
                        strokeWidth="2"
                        className="hover:r-5 transition-all"
                      />
                      <circle 
                        cx={x} 
                        cy={y} 
                        r="8" 
                        fill="#ef4444" 
                        fillOpacity="0" 
                        className="hover:fill-opacity-10 transition-all"
                      />
                      <text
                        x={x}
                        y={y - 10}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#ef4444"
                        fontFamily="Inter, sans-serif"
                        fontWeight="500"
                        className="opacity-0 hover:opacity-100 transition-opacity"
                      >
                        {point.count} {point.count === 1 ? 'failure' : 'failures'}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* Gradient definition */}
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      )}

      {data.length > 0 && (
        <div className="flex justify-end mt-2">
          <span className="text-xs text-gray-400">
            Updated: {new Date().toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  );
};