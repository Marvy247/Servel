import { ethers } from 'ethers';

export interface GasUsageStats {
  avgGasUsed: number;
  maxGasUsed: number;
  totalTransactions: number;
}

const RPC_URL = process.env.SEPOLIA_RPC_URL || 'http://127.0.0.1:8545';
const BLOCKS_TO_FETCH = 100;

export async function getGasUsageStats(): Promise<GasUsageStats> {
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  let totalGasUsed = 0n;
  let maxGasUsed = 0n;
  let totalTransactions = 0;

  try {
    const latestBlockNumber = await provider.getBlockNumber();

    // Fetch recent blocks and aggregate gas used
    for (let i = latestBlockNumber; i > latestBlockNumber - BLOCKS_TO_FETCH && i >= 0; i--) {
      const block = await provider.getBlock(i);
      if (!block) continue;
      for (const txHash of block.transactions) {
        const receipt = await provider.getTransactionReceipt(txHash);
        if (receipt && receipt.gasUsed) {
          const gasUsed = BigInt(receipt.gasUsed.toString());
          totalGasUsed += gasUsed;
          if (gasUsed > maxGasUsed) {
            maxGasUsed = gasUsed;
          }
          totalTransactions++;
        }
      }
    }

    const avgGasUsed = totalTransactions > 0 ? Number(totalGasUsed / BigInt(totalTransactions)) : 0;

    return {
      avgGasUsed,
      maxGasUsed: Number(maxGasUsed),
      totalTransactions
    };
  } catch (error) {
    console.error('Error fetching gas usage stats:', error);
    // Return zeros on error to avoid breaking frontend
    return {
      avgGasUsed: 0,
      maxGasUsed: 0,
      totalTransactions: 0
    };
  }
}
