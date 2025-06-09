'use client'

import ContractInteraction from '../../../components/dashboard/ContractInteraction';
import { useWeb3 } from '../../../providers/web3';

export default function ContractsPage() {
  const { provider, connect } = useWeb3();

  if (!provider) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h2 className="text-xl font-semibold text-gray-200">Connect Your Wallet</h2>
        <button
          onClick={() => connect?.()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-100">Contract Interaction</h1>
      
      <div className="grid grid-cols-1 gap-8">
        <ContractInteraction />
      </div>
    </div>
  );
}
