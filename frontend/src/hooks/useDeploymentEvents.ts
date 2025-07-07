import { useEffect, useState } from 'react';

interface DeploymentEvent {
  type: string;
  data: {
    contractName: string;
    address: string;
    network: string;
    timestamp: string;
  };
}

export function useDeploymentEvents(onDeployment: (event: DeploymentEvent['data']) => void) {
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
      console.log('WebSocket connection opened');
      // Optionally send a subscribe message if needed
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'deployment' && message.data) {
          onDeployment(message.data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.close();
    };
  }, [onDeployment]);
}
