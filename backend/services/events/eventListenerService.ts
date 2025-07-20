import { ethers } from 'ethers'
import { WebSocketServer, WebSocket } from 'ws'
import { EventFilter, EventSubscription, ContractEvent, DEFAULT_EVENT_TYPES } from './types'

const ACTIVE_SUBSCRIPTIONS = new Map<string, EventSubscription>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const MAX_EVENTS_PER_WINDOW = 1000
const eventCounts = new Map<string, number>()

export class EventListenerService {
  protected provider: ethers.JsonRpcProvider
  protected wss: WebSocketServer

  constructor(providerUrl: string, wssPort: number) {
    this.provider = new ethers.JsonRpcProvider(providerUrl)
    this.wss = new WebSocketServer({ port: wssPort })

    this.setupWebSocketServer()
    this.setupRateLimitCleanup()
  }

  protected setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket, req: any) => {
      const clientId = req.headers['sec-websocket-key'] || Math.random().toString(36).substring(2)
      eventCounts.set(clientId, 0)

      ws.on('message', async (message: string) => {
        try {
          const { action, data } = JSON.parse(message)
          
          if (action === 'subscribe') {
            await this.handleSubscribe(ws, clientId, data)
          } else if (action === 'unsubscribe') {
            this.handleUnsubscribe(clientId, data?.subscriptionId)
          }
        } catch (error) {
          ws.send(JSON.stringify({ error: 'Invalid message format' }))
        }
      })

      ws.on('close', () => {
        this.handleUnsubscribe(clientId)
        eventCounts.delete(clientId)
      })
    })
  }

  private async handleSubscribe(ws: WebSocket, clientId: string, filter: EventFilter) {
    if (this.isRateLimited(clientId)) {
      ws.send(JSON.stringify({ error: 'Rate limit exceeded' }))
      return
    }

    const subscriptionId = Math.random().toString(36).substring(2, 10)
    const callback = (event: ContractEvent) => {
      if (this.isRateLimited(clientId)) return
      eventCounts.set(clientId, (eventCounts.get(clientId) || 0) + 1)
      ws.send(JSON.stringify({ event, subscriptionId }))
    }

    const sub: EventSubscription = { id: subscriptionId, filter, callback }
    ACTIVE_SUBSCRIPTIONS.set(subscriptionId, sub)

    // Handle special deployment events
    if (filter.eventName === 'deployment' || filter.contractAddress === '*') {
      // For deployment events, we don't need a contract - just acknowledge the subscription
      ws.send(JSON.stringify({ 
        subscribed: true, 
        subscriptionId,
        filter,
        message: 'Deployment events subscription active'
      }))
      return
    }

    // Start listening for actual contract events
    if (filter.contractAddress && filter.contractAddress !== '*') {
      try {
        const contract = new ethers.Contract(
          filter.contractAddress, 
          DEFAULT_EVENT_TYPES, 
          this.provider
        )
        
        const eventName = filter.eventName || '*'
        if (eventName !== '*') {
          contract.on(eventName, (...args: any[]) => {
            const event = args[args.length - 1]
            callback({
              event: eventName,
              address: filter.contractAddress,
              blockNumber: event.blockNumber,
              transactionHash: event.transactionHash,
              args: args.slice(0, -1)
            })
          })
        } else {
          contract.on('*', (eventName: string, ...args: any[]) => {
            const event = args[args.length - 1]
            callback({
              event: eventName,
              address: filter.contractAddress,
              blockNumber: event.blockNumber,
              transactionHash: event.transactionHash,
              args: args.slice(0, -1)
            })
          })
        }
      } catch (error) {
        ws.send(JSON.stringify({ 
          error: `Failed to subscribe to contract events: ${error instanceof Error ? error.message : String(error)}`
        }))
      }
    }

    ws.send(JSON.stringify({ 
      subscribed: true, 
      subscriptionId,
      filter
    }))
  }

  private handleUnsubscribe(clientId: string, subscriptionId?: string) {
    if (subscriptionId) {
      const sub = ACTIVE_SUBSCRIPTIONS.get(subscriptionId)
      if (sub) {
        // Only try to remove contract listeners if it's a real contract event
        if (sub.filter.contractAddress && sub.filter.contractAddress !== '*') {
          try {
            const contract = new ethers.Contract(
              sub.filter.contractAddress, 
              DEFAULT_EVENT_TYPES, 
              this.provider
            )
            contract.off(sub.filter.eventName || '*', sub.callback)
          } catch (error) {
            console.error('Error unsubscribing from contract events:', error)
          }
        }
        ACTIVE_SUBSCRIPTIONS.delete(subscriptionId)
      }
    } else {
      // Remove all subscriptions for this client
      for (const [id, sub] of ACTIVE_SUBSCRIPTIONS) {
        if (sub.filter.contractAddress && sub.filter.contractAddress !== '*') {
          try {
            const contract = new ethers.Contract(
              sub.filter.contractAddress, 
              DEFAULT_EVENT_TYPES, 
              this.provider
            )
            contract.off(sub.filter.eventName || '*', sub.callback)
          } catch (error) {
            console.error('Error unsubscribing from contract events:', error)
          }
        }
        ACTIVE_SUBSCRIPTIONS.delete(id)
      }
    }
  }

  private isRateLimited(clientId: string): boolean {
    const count = eventCounts.get(clientId) || 0
    return count >= MAX_EVENTS_PER_WINDOW
  }

  private setupRateLimitCleanup() {
    setInterval(() => {
      eventCounts.clear()
    }, RATE_LIMIT_WINDOW_MS)
  }

  getActiveSubscriptions(): number {
    return ACTIVE_SUBSCRIPTIONS.size
  }

  close(): void {
    // Close all active subscriptions
    for (const [id, sub] of ACTIVE_SUBSCRIPTIONS) {
      const contract = new ethers.Contract(
        sub.filter.contractAddress, 
        DEFAULT_EVENT_TYPES, 
        this.provider
      )
      contract.off(sub.filter.eventName || '*', sub.callback)
      ACTIVE_SUBSCRIPTIONS.delete(id)
    }

    // Close WebSocket server
    this.wss.close()
  }

  broadcastToClients(message: any): void {
    if (!this.wss) return;
    
    this.wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify(message));
        } catch (error) {
          console.error('Failed to broadcast message:', error);
        }
      }
    });
  }
}
