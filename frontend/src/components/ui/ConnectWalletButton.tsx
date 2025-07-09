'use client';

import React from 'react';
import { useWeb3 } from '../../providers/web3';
import { Button } from './button';
import { Wallet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ConnectWalletButton: React.FC = () => {
  const { connect } = useWeb3();
  const [isConnecting, setIsConnecting] = React.useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connect();
      toast.success('Wallet connected successfully');
    } catch (error) {
      toast.error('Failed to connect wallet');
      console.error('Connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      variant="default"
      size="lg"
      className="group transition-all duration-200 shadow-lg hover:shadow-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
    >
      {isConnecting ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
          Connect Wallet
        </>
      )}
    </Button>
  );
};

export default ConnectWalletButton;
