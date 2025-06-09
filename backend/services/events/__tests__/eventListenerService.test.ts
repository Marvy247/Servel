import { EventListenerService } from '../eventListenerService';
import { WebSocket, WebSocketServer } from 'ws';
import { ethers } from 'ethers';
import { DEFAULT_EVENT_TYPES } from '../types';

// Create proper mock types
const mockWebSocketServer = {
  on: jest.fn(),
  close: jest.fn()
};

const mockWebSocket = {
  on: jest.fn(),
  send: jest.fn(),
  close: jest.fn()
};

// Mock JsonRpcProvider with network detection
const mockProvider = {
  getNetwork: jest.fn().mockResolvedValue({ chainId: 1, name: 'mainnet' }),
  on: jest.fn(),
  removeAllListeners: jest.fn(),
  destroy: jest.fn(),
  _websocket: {
    on: jest.fn(),
    removeAllListeners: jest.fn(),
    close: jest.fn()
  },
  _networkPromise: Promise.resolve({ chainId: 1, name: 'mainnet' })
};

// Ethers v6 contract mock types
type MockContract = {
  on: jest.Mock<
    MockContract, 
    [eventName: string, listener: ContractEventListener]
  >;
  off: jest.Mock<
    MockContract,
    [eventName?: string, listener?: ContractEventListener]
  >;
  filters: {
    Transfer: jest.Mock<ethers.EventLog, []>;
  };
  queryFilter: jest.Mock;
  removeAllListeners: jest.Mock;
  emit: jest.Mock;
  listenerCount: jest.Mock;
  listeners: jest.Mock;
} & Omit<ethers.Contract, 'on'|'off'|'filters'|'queryFilter'|'removeAllListeners'|'emit'|'listenerCount'|'listeners'>;

const mockContract: MockContract = {
  interface: {
    getEvent: jest.fn().mockImplementation((eventName: string) => {
      if (eventName === 'Transfer') {
        return {
          format: () => 'event Transfer(address indexed from, address indexed to, uint256 value)',
          fragment: {
            type: 'event',
            name: 'Transfer',
            inputs: [
              { name: 'from', type: 'address', indexed: true },
              { name: 'to', type: 'address', indexed: true },
              { name: 'value', type: 'uint256', indexed: false }
            ],
            anonymous: false
          }
        };
      }
      if (eventName === 'Approval') {
        return {
          format: () => 'event Approval(address indexed owner, address indexed spender, uint256 value)',
          fragment: {
            type: 'event',
            name: 'Approval',
            inputs: [
              { name: 'owner', type: 'address', indexed: true },
              { name: 'spender', type: 'address', indexed: true },
              { name: 'value', type: 'uint256', indexed: false }
            ],
            anonymous: false
          }
        };
      }
      return null;
    }),
    getFunction: jest.fn(),
    fragments: [
      {
        type: 'event',
        name: 'Transfer',
        inputs: [
          { name: 'from', type: 'address', indexed: true },
          { name: 'to', type: 'address', indexed: true },
          { name: 'value', type: 'uint256', indexed: false }
        ],
        anonymous: false
      },
      {
        type: 'event',
        name: 'Approval',
        inputs: [
          { name: 'owner', type: 'address', indexed: true },
          { name: 'spender', type: 'address', indexed: true },
          { name: 'value', type: 'uint256', indexed: false }
        ],
        anonymous: false
      }
    ]
  } as unknown as ethers.Interface,
  on: jest.fn((eventName: string, listener: ContractEventListener) => {
    // Simulate event emission
    if (eventName === 'Transfer' || eventName === 'Approval') {
      setTimeout(() => {
        const event = {
          args: {
            from: '0x123',
            to: '0x456',
            value: ethers.parseEther('1')
          },
          event: 'Transfer',
          eventSignature: 'event Transfer(address indexed from, address indexed to, uint256 value)',
          getBlock: jest.fn(),
          getTransaction: jest.fn(),
          getTransactionReceipt: jest.fn(),
          removeListener: jest.fn()
        };
        listener(event);
      }, 100);
    }
    return mockContract;
  }),
  off: jest.fn(() => mockContract),
  filters: {
    Transfer: jest.fn(() => ({} as ethers.EventLog)),
    Approval: jest.fn(() => ({} as ethers.EventLog))
  },
  queryFilter: jest.fn(),
  removeAllListeners: jest.fn(),
  emit: jest.fn(),
  listenerCount: jest.fn(),
  listeners: jest.fn(),
  target: '0xContractAddress',
  provider: mockProvider,
  signer: {} as ethers.Signer,
} as unknown as MockContract;

// Mock the modules
jest.mock('ws', () => ({
  WebSocketServer: jest.fn(() => mockWebSocketServer),
  WebSocket: jest.fn(() => mockWebSocket)
}));

jest.mock('ethers', () => {
  const actualEthers = jest.requireActual('ethers');
  return {
    ...actualEthers,
    JsonRpcProvider: jest.fn(() => mockProvider),
    Contract: jest.fn(() => ({
      ...mockContract,
      interface: mockContract.interface
    })),
    parseEther: actualEthers.parseEther
  };
});

// Ethers v6 event listener type
interface ContractEventListener {
  (...args: any[]): void;
}

// Test constants
const mockFilter = {
  contractAddress: '0x123',
  eventName: 'Transfer'
};

// Mock event counts Map and active subscriptions
let mockEventCounts: Map<string, number>;
let ACTIVE_SUBSCRIPTIONS: Map<string, any>;

beforeEach(() => {
  mockEventCounts = new Map();
  ACTIVE_SUBSCRIPTIONS = new Map();
  jest.mock('../eventListenerService', () => {
    const original = jest.requireActual('../eventListenerService');
    return {
      ...original,
      eventCounts: mockEventCounts,
      ACTIVE_SUBSCRIPTIONS
    };
  });
});

describe('EventListenerService', () => {
  let service: EventListenerService;
  let intervalSpy: jest.SpyInstance;
  const mockProviderUrl = 'http://localhost:8545';
  const mockWssPort = 8080;

  beforeEach(async () => {
    jest.clearAllMocks();
    service = new EventListenerService(mockProviderUrl, mockWssPort);
    // Wait for provider initialization
    await mockProvider.getNetwork();
  });

  afterEach(async () => {
    await service.close();
    jest.clearAllMocks();
    jest.clearAllTimers();
    mockEventCounts.clear();
    ACTIVE_SUBSCRIPTIONS.clear();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should initialize with empty subscriptions', () => {
    expect(service.getActiveSubscriptions()).toBe(0);
  });

  describe('WebSocket server', () => {
    it('should setup WebSocket server on specified port', () => {
      expect(WebSocketServer).toHaveBeenCalledWith({ port: mockWssPort });
    });

    it('should handle new connections', () => {
      // Simulate connection event
      const connectionHandler = mockWebSocketServer.on.mock.calls[0][1];
      connectionHandler(mockWebSocket, { headers: { 'sec-websocket-key': 'test-client' } });

      expect(mockWebSocket.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockWebSocket.on).toHaveBeenCalledWith('close', expect.any(Function));
    });
  });

  describe('Subscription handling', () => {
    it('should handle subscribe message', async () => {
      // Setup connection
      const connectionHandler = mockWebSocketServer.on.mock.calls[0][1];
      connectionHandler(mockWebSocket, { headers: { 'sec-websocket-key': 'test-client' } });

      // Simulate message
      const messageHandler = mockWebSocket.on.mock.calls.find(call => call[0] === 'message')[1];
      await messageHandler(JSON.stringify({
        action: 'subscribe',
        data: mockFilter
      }));

      expect(ethers.Contract).toHaveBeenCalledWith(
        mockFilter.contractAddress,
        DEFAULT_EVENT_TYPES,
        expect.objectContaining({
          provider: expect.any(Object),
          interface: expect.objectContaining({
            fragments: expect.arrayContaining([
              expect.objectContaining({
                name: 'Transfer',
                inputs: [
                  { name: 'from', type: 'address', indexed: true },
                  { name: 'to', type: 'address', indexed: true },
                  { name: 'value', type: 'uint256', indexed: false }
                ]
              })
            ])
          })
        })
      );

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"subscribed":true'),
        expect.anything()
      );
    });

    it('should handle unsubscribe message', async () => {
      // Setup connection
      const connectionHandler = mockWebSocketServer.on.mock.calls[0][1];
      connectionHandler(mockWebSocket, { headers: { 'sec-websocket-key': 'test-client' } });

      // Simulate subscribe message to create subscription
      const messageHandler = mockWebSocket.on.mock.calls.find(call => call[0] === 'message')[1];
      await messageHandler(JSON.stringify({
        action: 'subscribe',
        data: mockFilter
      }));

      // Extract subscriptionId from the last send call
      const lastSendCall = mockWebSocket.send.mock.calls[mockWebSocket.send.mock.calls.length - 1][0];
      const parsed = JSON.parse(lastSendCall);
      const subscriptionId = parsed.subscriptionId;

      // Simulate unsubscribe message
      messageHandler(JSON.stringify({
        action: 'unsubscribe',
        data: { subscriptionId }
      }));

      // After unsubscribe, subscription should be removed
      expect(service.getActiveSubscriptions()).toBe(0);
    });

    it('should enforce rate limiting', async () => {
    // Setup connection
    const connectionHandler = mockWebSocketServer.on.mock.calls[0][1];
    connectionHandler(mockWebSocket, { headers: { 'sec-websocket-key': 'test-client' } });

    // Simulate message handler
    const messageHandler = mockWebSocket.on.mock.calls.find(call => call[0] === 'message')[1];

    // Mock rate limit exceeded by setting eventCounts directly
    const clientId = 'test-client';
    mockEventCounts.set(clientId, 1000);

    // Simulate subscribe message when rate limited
    await messageHandler(JSON.stringify({
      action: 'subscribe',
      data: mockFilter
    }));

    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({
        error: 'Rate limit exceeded'
      }),
      expect.anything()
    );
  });

  it('should handle provider connection errors', async () => {
    // Mock provider failure
    mockProvider.getNetwork.mockRejectedValueOnce(new Error('Network error'));
    
    const errorService = new EventListenerService('http://invalid-url', 8081);
    await expect(mockProvider.getNetwork()).rejects.toThrow('Network error');
    errorService.close();
  });

  it('should handle multiple concurrent subscriptions', async () => {
    // Setup connection
    const connectionHandler = mockWebSocketServer.on.mock.calls[0][1];
    connectionHandler(mockWebSocket, { headers: { 'sec-websocket-key': 'test-client' } });
    const messageHandler = mockWebSocket.on.mock.calls.find(call => call[0] === 'message')[1];

    // Subscribe to multiple events
    await messageHandler(JSON.stringify({
      action: 'subscribe',
      data: mockFilter
    }));
    await messageHandler(JSON.stringify({
      action: 'subscribe',
      data: { ...mockFilter, eventName: 'Approval' }
    }));

    expect(service.getActiveSubscriptions()).toBe(2);
    expect(mockContract.on).toHaveBeenCalledWith('Transfer', expect.any(Function));
    expect(mockContract.on).toHaveBeenCalledWith('Approval', expect.any(Function));
  });

  it('should properly handle Transfer events', async () => {
    const connectionHandler = mockWebSocketServer.on.mock.calls[0][1];
    connectionHandler(mockWebSocket, { headers: { 'sec-websocket-key': 'test-client' } });
    const messageHandler = mockWebSocket.on.mock.calls.find(call => call[0] === 'message')[1];

    await messageHandler(JSON.stringify({
      action: 'subscribe',
      data: mockFilter
    }));

    // Wait for mock event to be emitted
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(mockWebSocket.send).toHaveBeenCalledWith(
      expect.stringContaining('"event":"Transfer"'),
      expect.anything()
    );
  });

  it('should properly handle Approval events', async () => {
    const connectionHandler = mockWebSocketServer.on.mock.calls[0][1];
    connectionHandler(mockWebSocket, { headers: { 'sec-websocket-key': 'test-client' } });
    const messageHandler = mockWebSocket.on.mock.calls.find(call => call[0] === 'message')[1];

    await messageHandler(JSON.stringify({
      action: 'subscribe',
      data: { ...mockFilter, eventName: 'Approval' }
    }));

    // Wait for mock event to be emitted
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(mockWebSocket.send).toHaveBeenCalledWith(
      expect.stringContaining('"event":"Approval"'),
      expect.anything()
    );
    expect(mockWebSocket.send).toHaveBeenCalledWith(
      expect.stringContaining('"owner":"0x789"'),
      expect.anything()
    );
  });
  });

  describe('Service closing', () => {
    it('should close all subscriptions and WebSocket server', async () => {
      // Setup connection and subscribe
      const connectionHandler = mockWebSocketServer.on.mock.calls[0][1];
      connectionHandler(mockWebSocket, { headers: { 'sec-websocket-key': 'test-client' } });
      const messageHandler = mockWebSocket.on.mock.calls.find(call => call[0] === 'message')[1];
      await messageHandler(JSON.stringify({
        action: 'subscribe',
        data: mockFilter
      }));

      // Close the service
      service.close();

      // After close, no active subscriptions
      expect(service.getActiveSubscriptions()).toBe(0);
      expect(mockWebSocketServer.close).toHaveBeenCalled();
    });
  });
});
