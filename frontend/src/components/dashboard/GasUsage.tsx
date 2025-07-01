'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useEffect, useState } from 'react';

interface GasUsageStats {
  avgGasUsed: number;
  maxGasUsed: number;
  totalTransactions: number;
}

const GasUsage = () => {
  const [stats, setStats] = useState<GasUsageStats | null>(null);

  useEffect(() => {
    const fetchGasUsage = async () => {
      try {
        const response = await fetch('/api/dashboard/gas-usage');
        if (response.ok) {
          const data = await response.json();
          setStats(data.data);
        } else {
          setStats(null);
        }
      } catch (error) {
        setStats(null);
      }
    };

    fetchGasUsage();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gas Usage Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        {stats ? (
          <div className="space-y-2 text-sm">
            <div>Average Gas Used: <span className="font-medium">{stats.avgGasUsed}</span></div>
            <div>Maximum Gas Used: <span className="font-medium">{stats.maxGasUsed}</span></div>
            <div>Total Transactions: <span className="font-medium">{stats.totalTransactions}</span></div>
          </div>
        ) : (
          <div>No gas usage data available.</div>
        )}
      </CardContent>
    </Card>
  );
};

export default GasUsage;
