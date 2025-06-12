import { EventSocketMessage } from '../types/events';

class EventSocketService {
  private socket: WebSocket | null = null;
  private subscribers: Map<string, (message: EventSocketMessage) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  constructor(private wssUrl: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket) {
        resolve();
        return;
      }

      this.socket = new WebSocket(this.wssUrl);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        console.log('WebSocket connected');
        resolve();
      };

      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.socket = null;
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.socket.onmessage = (event) => {
        try {
          const message: EventSocketMessage = JSON.parse(event.data);
          this.subscribers.forEach((callback) => callback(message));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  }

  subscribe(eventType: string, callback: (message: EventSocketMessage) => void): string {
    const subscriptionId = crypto.randomUUID();
    this.subscribers.set(subscriptionId, callback);
    return subscriptionId;
  }

  unsubscribe(subscriptionId: string): void {
    this.subscribers.delete(subscriptionId);
  }

  subscribeToContract(contractAddress: string): void {
    if (!this.socket) {
      throw new Error('WebSocket not connected');
    }
    this.socket.send(JSON.stringify({
      type: 'SUBSCRIBE',
      contractAddress
    }));
  }

  unsubscribeFromContract(contractAddress: string): void {
    if (!this.socket) {
      throw new Error('WebSocket not connected');
    }
    this.socket.send(JSON.stringify({
      type: 'UNSUBSCRIBE', 
      contractAddress
    }));
  }

  close() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.subscribers.clear();
  }
}

// Default export with default WebSocket URL
const eventSocketService = new EventSocketService(
  process.env.NEXT_PUBLIC_WSS_URL || 'ws://localhost:8080'
);

export default eventSocketService;
