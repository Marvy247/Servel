export interface EventLog {
  blockNumber: number;
  transactionHash: string;
  eventName: string;
  args: Record<string, any>;
  timestamp: string;
  contractAddress: string;
}

export interface EventFilters {
  contractAddress: string;
  eventName: string;
  fromAddress: string;
  toAddress: string;
  blockRange?: {
    from: number;
    to: number;
  };
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
  totalItems?: number;
}

export interface EventViewerState {
  isLiveMode: boolean;
  filters: EventFilters;
  pagination: PaginationOptions;
  expandedLogs: number[];
}

export interface EventSocketMessage {
  type: 'EVENT' | 'STATUS' | 'ERROR';
  data: EventLog | string;
}
