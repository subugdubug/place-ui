'use client';

import React from 'react';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import '@rainbow-me/rainbowkit/styles.css';

// Configure chains & providers with more robust error handling
const { chains, publicClient } = configureChains(
  [mainnet, sepolia],
  [publicProvider()] // Keep the default without parameters as the API doesn't support them
);

// Set up wallet connectors
const { connectors } = getDefaultWallets({
  appName: 'PixelPlace',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains
});

// Create wagmi config with minimal configuration to reduce errors
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  // Keep only the supported options
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