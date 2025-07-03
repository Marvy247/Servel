import axios from 'axios';

export interface VerifiedContract {
  address: string;
  name: string;
  abi: any[];
}

const ETHERSCAN_API_KEY = 'V1VIR998I85I2YSX6D64DFCHXJERTU92IC';
const ETHERSCAN_API_URL = 'https://api-sepolia.etherscan.io/api';

// Fetch verified contracts from Etherscan for Sepolia network
export async function getVerifiedContracts(): Promise<VerifiedContract[]> {
  try {
    // Etherscan does not provide a direct API to list all verified contracts,
    // so this is a placeholder for demonstration.
    // You may need to maintain a list or use other APIs or services.

    // Example: Fetch contract source code by address (replace with real addresses)
    const exampleAddresses = [
      '0x1234567890abcdef1234567890abcdef12345678',
      '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
    ];

    const contracts: VerifiedContract[] = [];

    for (const address of exampleAddresses) {
      const response = await axios.get(ETHERSCAN_API_URL, {
        params: {
          module: 'contract',
          action: 'getsourcecode',
          address,
          apikey: ETHERSCAN_API_KEY
        }
      });

      if (
        response.data.status === '1' &&
        response.data.result &&
        response.data.result.length > 0
      ) {
        const contractData = response.data.result[0];
        contracts.push({
          address,
          name: contractData.ContractName || 'Unknown',
          abi: JSON.parse(contractData.ABI || '[]')
        });
      }
    }

    return contracts;
  } catch (error) {
    console.error('Failed to fetch verified contracts from Etherscan:', error);
    return [];
  }
}
