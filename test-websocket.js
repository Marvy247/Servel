// Simple WebSocket test script
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8081');

ws.on('open', () => {
  console.log('Connected to WebSocket server');
  
  // Subscribe to deployment events
  ws.send(JSON.stringify({
    action: 'subscribe',
    data: {
      eventName: '*',
      contractAddress: '*'
    }
  }));
});

ws.on('message', (data) => {
  console.log('Received:', data.toString());
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', (code, reason) => {
  console.log('Connection closed:', code, reason.toString());
});
