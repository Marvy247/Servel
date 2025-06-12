'use client'

import React from 'react'

import Web3Modal from 'web3modal'
import { BrowserProvider } from 'ethers'
import WalletConnectProvider from '@walletconnect/web3-provider'

interface Web3ContextType {
  provider: BrowserProvider | null
  address: string | null
  chainId: number | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

const Web3Context = React.createContext<Web3ContextType>({
  provider: null,
  address: null,
  chainId: null,
  connect: async () => {},
  disconnect: async () => {},
})

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      rpc: {
        11155111: 'https://methodical-misty-arm.ethereum-sepolia.quiknode.pro/94a7e73a053ca28e2f3a64e40c7ca0e0bd6d38d9/',
      },
    },
  },
}

const web3Modal = typeof window !== 'undefined' ? new Web3Modal({
  network: 'sepolia',
  cacheProvider: true,
  providerOptions,
}) : null

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = React.useState<BrowserProvider | null>(null)
  const [address, setAddress] = React.useState<string | null>(null)
  const [chainId, setChainId] = React.useState<number | null>(null)

  const connect = async () => {
    try {
      const instance = await web3Modal?.connect()
      const provider = new BrowserProvider(instance)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      const network = await provider.getNetwork()

      setProvider(provider)
      setAddress(address)
      setChainId(Number(network.chainId))

      // Setup listeners
      instance.on('accountsChanged', (accounts: string[]) => {
        setAddress(accounts[0])
      })

      instance.on('chainChanged', (chainId: string) => {
        setChainId(Number(chainId))
      })

    } catch (error) {
      console.error('Failed to connect:', error)
    }
  }

  const disconnect = async () => {
    try {
      await web3Modal?.clearCachedProvider()
      setProvider(null)
      setAddress(null)
      setChainId(null)
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }

  React.useEffect(() => {
    if (web3Modal?.cachedProvider) {
      connect()
    }
  }, [])

  return (
    <Web3Context.Provider value={{ provider, address, chainId, connect, disconnect }}>
      {children}
    </Web3Context.Provider>
  )
}

export const useWeb3 = () => React.useContext(Web3Context)
