'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';

interface Transaction {
  id: string;
  type: string;
  timestamp: string;
}

const RecentTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // In a real application, you would fetch the transactions from an API.
    // For now, we'll use mock data.
    setTransactions([
      { id: '1', type: 'Contract Deployment', timestamp: '2 min ago' },
      { id: '2', type: 'Function Call', timestamp: '5 min ago' },
      { id: '3', type: 'Contract Interaction', timestamp: '10 min ago' },
    ]);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex justify-between">
              <span>{tx.type}</span>
              <span className="text-gray-500">{tx.timestamp}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
