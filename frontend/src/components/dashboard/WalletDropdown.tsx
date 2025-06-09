'use client'

import { useState } from 'react';
import { useWeb3 } from '../../providers/web3';

export default function WalletDropdown() {
  const { address, disconnect } = useWeb3();
  const [isOpen, setIsOpen] = useState(false);

  if (!address) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
      >
        <span>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
          <button
            onClick={() => {
              disconnect();
              setIsOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
