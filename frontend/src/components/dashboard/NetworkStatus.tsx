import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useEffect, useState } from 'react';
import { RefreshCw, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';

interface NetworkStatus {
  name: string;
  status: 'Online' | 'Offline' | 'Error';
  lastChecked?: string;
}

const NetworkStatus = () => {
  const [statuses, setStatuses] = useState<NetworkStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchNetworkStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/dashboard/network-status');
      if (response.ok) {
        const data = await response.json();
        setStatuses(data.data);
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        setStatuses([]);
      }
    } catch (error) {
      setStatuses([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkStatus();
    
    // Set up polling every 30 seconds
    const intervalId = setInterval(fetchNetworkStatus, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const getStatusColor = (status: NetworkStatus['status']) => {
    switch (status) {
      case 'Online':
        return 'bg-green-100 text-green-800';
      case 'Offline':
        return 'bg-red-100 text-red-800';
      case 'Error':
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: NetworkStatus['status']) => {
    switch (status) {
      case 'Online':
        return <Wifi className="w-4 h-4" />;
      case 'Offline':
        return <WifiOff className="w-4 h-4" />;
      case 'Error':
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Wifi className="w-5 h-5 text-blue-600" />
            Network Status
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Updated: {lastUpdated}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchNetworkStatus}
              disabled={isLoading}
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : statuses.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No network status information available
          </div>
        ) : (
          <div className="space-y-3">
            {statuses.map((network) => (
              <div
                key={network.name}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-800">{network.name}</div>
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    network.status
                  )}`}
                >
                  {getStatusIcon(network.status)}
                  {network.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NetworkStatus;