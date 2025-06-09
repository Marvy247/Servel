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

    // Start listening
    const contract = new ethers.Contract(
      filter.contractAddress, 
      DEFAULT_EVENT_TYPES, 
      this.provider
    )
    contract.on(filter.eventName || '*', (from, to, value, event) => {
      callback({
        event: filter.eventName || '*',
        address: filter.contractAddress,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        args: { from, to, value }
      })
    })

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
        const contract = new ethers.Contract(
          sub.filter.contractAddress, 
          DEFAULT_EVENT_TYPES, 
          this.provider
        )
        contract.off(sub.filter.eventName || '*', sub.callback)
        ACTIVE_SUBSCRIPTIONS.delete(subscriptionId)
      }
    } else {
      // Remove all subscriptions for this client
      for (const [id, sub] of ACTIVE_SUBSCRIPTIONS) {
        const contract = new ethers.Contract(
          sub.filter.contractAddress, 
          DEFAULT_EVENT_TYPES, 
          this.provider
        )
        contract.off(sub.filter.eventName || '*', sub.callback)
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
}
