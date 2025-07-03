export interface Contract {
  name: string;
  address: string;
  network: string;
  verified: boolean;
  lastDeployed: string;
}

// Mock contracts data for MVP
export async function getContracts(projectId: string): Promise<Contract[]> {
  // In real implementation, fetch contracts from database or blockchain explorer
  return [
    {
      name: 'ContractA',
      address: '0x1111111111111111111111111111111111111111',
      network: 'Sepolia',
      verified: true,
      lastDeployed: new Date().toISOString(),
    },
    {
      name: 'ContractB',
      address: '0x2222222222222222222222222222222222222222',
      network: 'Sepolia',
      verified: false,
      lastDeployed: new Date().toISOString(),
    },
  ];
}
