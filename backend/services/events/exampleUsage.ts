import { EventListenerService } from './eventListenerService'
import { WebSocket } from 'ws'

// Configuration
const providerUrl = 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID'
const wssPort = 8080

// Initialize service
const eventService = new EventListenerService(providerUrl, wssPort)
console.log(`Event listener service started on port ${wssPort}`)

// Example client connection
const ws = new WebSocket(`ws://localhost:${wssPort}`)

ws.on('open', () => {
  console.log('Connected to event service')
  
  // Subscribe to transfer events
  ws.send(JSON.stringify({
    action: 'subscribe',
    data: {
      contractAddress: '0xContractAddress',
      eventName: 'Transfer'
    }
  }))
})

ws.on('message', (data) => {
  const event = JSON.parse(data.toString())
  console.log('Received event:', event)
})

ws.on('close', () => {
  console.log('Disconnected from event service')
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down event service')
  ws.close()
  process.exit(0)
})
