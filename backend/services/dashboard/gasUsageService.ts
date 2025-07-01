export interface GasUsageStats {
  avgGasUsed: number;
  maxGasUsed: number;
  totalTransactions: number;
}

export async function getGasUsageStats(): Promise<GasUsageStats> {
  // Mock implementation - replace with real data aggregation logic
  return {
    avgGasUsed: 21000,
    maxGasUsed: 100000,
    totalTransactions: 1234
  };
}
