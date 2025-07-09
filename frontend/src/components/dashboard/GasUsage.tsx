'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useEffect, useState } from 'react';
import { FiActivity, FiZap, FiTrendingUp, FiDatabase } from 'react-icons/fi';
import { FaEthereum } from 'react-icons/fa';

interface GasUsageStats {
  avgGasUsed: number;
  maxGasUsed: number;
  totalTransactions: number;
  lastUpdated?: string;
}

const GasUsage = () => {
  const [stats, setStats] = useState<GasUsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGasUsage = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/gas-usage');
        if (response.ok) {
          const data = await response.json();
          setStats({
            ...data.data,
            lastUpdated: new Date().toLocaleTimeString()
          });
        }
      } catch (error) {
        console.error('Error fetching gas usage:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGasUsage();
    const interval = setInterval(fetchGasUsage, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const formatGas = (gas: number) => {
    return gas.toLocaleString();
  };

  return (
    <Card className="border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <FiActivity className="text-blue-500" />
            Gas Usage Analytics
          </CardTitle>
          {stats?.lastUpdated && (
            <span className="text-xs text-gray-500">
              Updated: {stats.lastUpdated}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-full">
                  <FiZap className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Average Gas</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatGas(stats.avgGasUsed)}
                  </p>
                </div>
              </div>
              <div className="text-xs text-blue-600 flex items-center gap-1">
                <FaEthereum className="opacity-70" />
                <span>~{(stats.avgGasUsed / 1000000).toFixed(2)} ETH</span>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-full">
                  <FiTrendingUp className="text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Max Gas</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatGas(stats.maxGasUsed)}
                  </p>
                </div>
              </div>
              <div className="text-xs text-purple-600 flex items-center gap-1">
                <FaEthereum className="opacity-70" />
                <span>~{(stats.maxGasUsed / 1000000).toFixed(2)} ETH</span>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-full">
                  <FiDatabase className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total Txns</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatGas(stats.totalTransactions)}
                  </p>
                </div>
              </div>
              <div className="text-xs text-green-600">
                <span>All transactions</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
            <FiActivity className="text-3xl" />
            <p>No gas usage data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GasUsage;