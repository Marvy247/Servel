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
    let ws: WebSocket | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 1000;

    const connect = () => {
      try {
        ws = new WebSocket(`ws://${window.location.hostname}:8081`);

        ws.onopen = () => {
          console.log('WebSocket connection opened');
          reconnectAttempts = 0;
          
          // Subscribe to deployment events
          ws?.send(JSON.stringify({
            action: 'subscribe',
            data: {
              eventName: 'deployment',
              contractAddress: '*' // Listen for all deployment events
            }
          }));
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            // Handle both direct deployment events and wrapped events
            if (message.type === 'deployment' && message.data) {
              onDeployment(message.data);
            } else if (message.event === 'deployment' && message.args) {
              // Handle events from the EventListenerService format
              const deploymentData = {
                contractName: message.args.contractName || 'Unknown',
                address: message.args.address || '',
                network: message.args.network || 'unknown',
                timestamp: new Date().toISOString()
              };
              onDeployment(deploymentData);
            } else if (message.event) {
              // Handle generic events that might be deployment-related
              console.log('Received event:', message);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onclose = (event) => {
          console.log('WebSocket connection closed:', event.code, event.reason);
          
          // Attempt to reconnect if not manually closed
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(`Attempting to reconnect... (${reconnectAttempts}/${maxReconnectAttempts})`);
            setTimeout(connect, reconnectDelay * reconnectAttempts);
          }
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
      }
    };

    connect();

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [onDeployment]);
}
