'use client';

import React from 'react';
import { WalletProvider } from './WalletProvider';
import { CanvasServiceProvider } from './CanvasServiceProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FallbackIndicator } from '../ui/FallbackIndicator';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { EnsErrorBoundary } from '../ui/EnsErrorBoundary';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Add some default retry behavior with exponential backoff
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        
        // Don't retry too many times
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <EnsErrorBoundary>
          <WalletProvider>
            <CanvasServiceProvider>
              <FallbackIndicator />
              {children}
            </CanvasServiceProvider>
          </WalletProvider>
        </EnsErrorBoundary>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}; 