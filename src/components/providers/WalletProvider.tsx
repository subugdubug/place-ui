'use client';

import React from 'react';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import '@rainbow-me/rainbowkit/styles.css';

// Configure custom public provider with better timeout handling
const getCustomPublicProvider = () => {
  // Start with the default public provider
  return ({ rpcUrls }) => {
    // Create a provider with additional error handling
    return {
      // Keep the required chain property
      chain: {
        id: 1,
        name: 'Ethereum',
        rpcUrls,
      },
      // This is the transport property used by wagmi v2
      transport: async (args) => {
        // Set a longer timeout for the fetch operation
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
        
        try {
          const baseUrl = rpcUrls.default.http[0];
          const fetchOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              jsonrpc: '2.0', 
              id: 1, 
              method: args.method, 
              params: args.params 
            }),
            signal: controller.signal
          };
          
          const response = await fetch(baseUrl, fetchOptions);
          const data = await response.json();
          
          if (data.error) {
            console.warn('RPC error:', data.error);
            throw new Error(data.error.message);
          }
          
          return data.result;
        } catch (error) {
          console.warn(`RPC request failed for ${args.method}:`, error);
          // For specific methods, we can return mock data to keep the UI functional
          if (args.method === 'eth_call') {
            console.log('Returning mock response for eth_call');
            return '0x'; // Empty response is safer than trying to mock specific functions
          }
          throw error;
        } finally {
          clearTimeout(timeoutId);
        }
      }
    };
  };
};

// Configure chains & providers
const { chains, publicClient } = configureChains(
  [mainnet, sepolia],
  [publicProvider()]  // Use the default provider since our custom one is causing type issues
);

// Set up wallet connectors
const { connectors } = getDefaultWallets({
  appName: 'PixelPlace',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains
});

// Create wagmi config
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider 
        chains={chains}
        showRecentTransactions={true}
      >
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}; 