 import { WebSocket } from 'ws'
import { EventListenerService } from './eventListenerService'
import { 
  TestResultEvent, 
  TestEventFilter,
  TestEventSubscription
} from '../../types/testEvents'

const ACTIVE_TEST_SUBSCRIPTIONS = new Map<string, TestEventSubscription>()
const TEST_EVENT_RATE_LIMIT = 100 // More frequent than blockchain events

export class TestResultEventService extends EventListenerService {
  private testEventCounts = new Map<string, number>()

  constructor(providerUrl: string, wssPort: number) {
    super(providerUrl, wssPort)
    this.setupWebSocketServer()
  }

  protected override setupWebSocketServer() {
    super.setupWebSocketServer()
    
    // Add test-specific handlers
    this.wss?.on('connection', (ws: WebSocket, req: any) => {
      const clientId = req.headers['sec-websocket-key'] || Math.random().toString(36).substring(2)
      this.testEventCounts.set(clientId, 0)

      ws.on('message', async (message: string) => {
        try {
          const { action, data } = JSON.parse(message)
          
          if (action === 'subscribe') {
            await this.handleTestSubscribe(ws, clientId, data)
          } else if (action === 'unsubscribe') {
            this.handleTestUnsubscribe(clientId, data?.subscriptionId)
          }
        } catch (error) {
          ws.send(JSON.stringify({ error: 'Invalid message format' }))
        }
      })

      ws.on('close', () => {
        this.handleTestUnsubscribe(clientId)
        this.testEventCounts.delete(clientId)
      })
    })
  }

  private async handleTestSubscribe(ws: WebSocket, clientId: string, filter: TestEventFilter) {
    if (this.isTestRateLimited(clientId)) {
      ws.send(JSON.stringify({ error: 'Rate limit exceeded' }))
      return
    }

    const subscriptionId = Math.random().toString(36).substring(2, 10)
    const callback = (event: TestResultEvent) => {
      if (this.isTestRateLimited(clientId)) return
      this.testEventCounts.set(clientId, (this.testEventCounts.get(clientId) || 0) + 1)
      ws.send(JSON.stringify({ event, subscriptionId }))
    }

    const sub: TestEventSubscription = { id: subscriptionId, filter, callback }
    ACTIVE_TEST_SUBSCRIPTIONS.set(subscriptionId, sub)

    ws.send(JSON.stringify({ 
      subscribed: true, 
      subscriptionId,
      filter
    }))
  }

  private handleTestUnsubscribe(clientId: string, subscriptionId?: string) {
    if (subscriptionId) {
      ACTIVE_TEST_SUBSCRIPTIONS.delete(subscriptionId)
    } else {
      // Remove all subscriptions for this client
      for (const [id, sub] of ACTIVE_TEST_SUBSCRIPTIONS) {
        ACTIVE_TEST_SUBSCRIPTIONS.delete(id)
      }
    }
  }

  private isTestRateLimited(clientId: string): boolean {
    const count = this.testEventCounts.get(clientId) || 0
    return count >= TEST_EVENT_RATE_LIMIT
  }

  public broadcastTestEvent(event: TestResultEvent) {
    for (const [id, sub] of ACTIVE_TEST_SUBSCRIPTIONS) {
      if (!sub.filter.projectId || sub.filter.projectId === event.projectId) {
        sub.callback(event)
      }
    }
  }

  close(): void {
    ACTIVE_TEST_SUBSCRIPTIONS.clear()
    this.testEventCounts.clear()
    super.close()
  }
}
