import React from 'react';

interface DataPoint {
  date: string;
  count: number;
}

interface FailureTrendChartProps {
  data: DataPoint[];
}

export const FailureTrendChart: React.FC<FailureTrendChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500">No data available</div>;
  }

  // Calculate chart dimensions and scales
  const width = 400;
  const height = 120;
  const margin = { top: 10, right: 20, bottom: 20, left: 30 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Find max value for scaling
  const maxValue = Math.max(...data.map(d => d.count), 1);

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
      {/* X-axis */}
      <g transform={`translate(${margin.left}, ${innerHeight + margin.top})`}>
        {data.map((point, i) => (
          <text
            key={point.date}
            x={(i * innerWidth) / (data.length - 1)}
            y={10}
            textAnchor="middle"
            fontSize="10"
            fill="#666"
          >
            {point.date.split('-').slice(1).join('/')}
          </text>
        ))}
      </g>

      {/* Y-axis */}
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        <line y1={0} y2={innerHeight} stroke="#ddd" />
        {[0, Math.floor(maxValue / 2), maxValue].map((tick, i) => (
          <g key={i}>
            <line x1={-5} x2={0} y1={innerHeight - (tick / maxValue) * innerHeight} y2={innerHeight - (tick / maxValue) * innerHeight} stroke="#ddd" />
            <text x={-10} y={innerHeight - (tick / maxValue) * innerHeight + 3} textAnchor="end" fontSize="10" fill="#666">
              {tick}
            </text>
          </g>
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
        />

        {/* Points */}
        {data.map((point, i) => {
          const x = (i * innerWidth) / (data.length - 1);
          const y = innerHeight - (point.count / maxValue) * innerHeight;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="4" fill="#ef4444" />
              <text
                x={x}
                y={y - 8}
                textAnchor="middle"
                fontSize="10"
                fill="#ef4444"
              >
                {point.count}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};
