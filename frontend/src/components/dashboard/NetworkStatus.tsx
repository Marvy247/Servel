'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useEffect, useState } from 'react';

interface NetworkStatus {
  name: string;
  status: 'Online' | 'Offline' | 'Error';
}

const NetworkStatus = () => {
  const [statuses, setStatuses] = useState<NetworkStatus[]>([]);

  useEffect(() => {
    const fetchNetworkStatus = async () => {
      try {
        const response = await fetch('/api/dashboard/network-status');
        if (response.ok) {
          const data = await response.json();
          setStatuses(data.data);
        } else {
          setStatuses([]);
        }
      } catch (error) {
        setStatuses([]);
      }
    };

    fetchNetworkStatus();
  }, []);

  const getStatusColor = (status: NetworkStatus['status']) => {
    switch (status) {
      case 'Online':
        return 'text-green-500';
      case 'Offline':
        return 'text-red-500';
      case 'Error':
        return 'text-yellow-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Network Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm">
          {statuses.map((network) => (
            <div key={network.name}>
              {network.name}: <span className={getStatusColor(network.status)}>{network.status}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkStatus;
