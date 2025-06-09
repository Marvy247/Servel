export type EventFilter = {
  contractAddress: string
  eventName?: string
  fromBlock?: number
  toBlock?: number | 'latest'
  topics?: string[]
}

export type EventSubscription = {
  id: string
  filter: EventFilter
  callback: (event: ContractEvent) => void
}

export type ContractEvent = {
  event: string
  address: string
  blockNumber: number
  transactionHash: string
  args: any
  timestamp?: number
}

export const DEFAULT_EVENT_TYPES = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
  'event Deposit(address indexed account, uint256 amount)',
  'event Withdraw(address indexed account, uint256 amount)',
  'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)'
] as const

export type DefaultEventType = typeof DEFAULT_EVENT_TYPES[number]

export type EventQueryOptions = {
  limit?: number
  offset?: number
  sort?: 'asc' | 'desc'
}

export const DEFAULT_QUERY_LIMIT = 1000
export const MAX_QUERY_LIMIT = 10000
