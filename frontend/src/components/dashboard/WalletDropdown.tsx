'use client'

import { useState } from 'react';
import { useWeb3 } from '../../providers/web3';
import { ChevronDown, LogOut, Copy, ExternalLink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { Button } from '../ui/button';
import { toast } from 'sonner';

export default function WalletDropdown() {
  // Mock address for testing visibility
  const { address: realAddress, disconnect } = useWeb3();
  const [isOpen, setIsOpen] = useState(false);

  const address = realAddress || '0x1234...abcd';

  // if (!address) return null;

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    toast.success('Wallet address copied to clipboard');
    setIsOpen(false);
  };

  const viewOnExplorer = () => {
    window.open(`https://etherscan.io/address/${address}`, '_blank');
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 pr-3 pl-4 py-1.5 rounded-full hover:bg-gray-50 transition-colors border-gray-200 shadow-sm"
      >
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="font-medium text-gray-800">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-100">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Connected wallet</p>
            <div className="flex items-center justify-between">
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm font-mono font-medium text-gray-800 truncate" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {address}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{address}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="py-1">
            <button
              onClick={copyAddress}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Copy className="w-4 h-4 mr-3 text-gray-500" />
              Copy Address
            </button>
            <button
              onClick={viewOnExplorer}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-3 text-gray-500" />
              View on Explorer
            </button>
          </div>

          <div className="border-t border-gray-100 py-1">
            <button
              onClick={() => {
                disconnect();
                setIsOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Disconnect Wallet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}