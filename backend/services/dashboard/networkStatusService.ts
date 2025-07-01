import { ethers } from 'ethers';

interface NetworkStatus {
  name: string;
  status: 'Online' | 'Offline' | 'Error';
  errorMessage?: string;
}

export async function getNetworkStatus(): Promise<NetworkStatus[]> {
  // Example networks to check
const networks = [
  { name: 'Anvil', rpcUrl: process.env.ANVIL_RPC_URL || 'http://127.0.0.1:8545' }
];

  const statusPromises = networks.map(async (network) => {
    try {
      const provider = new ethers.JsonRpcProvider(network.rpcUrl);
      await provider.getBlockNumber();
      return { name: network.name, status: 'Online' as const };
    } catch (error: any) {
      return { name: network.name, status: 'Error' as const, errorMessage: error.message || String(error) };
    }
  });

  return Promise.all(statusPromises);
}

