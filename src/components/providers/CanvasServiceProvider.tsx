'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { CanvasService, PixelPaintedEvent } from '@/types';
import { EthersCanvasService, MockCanvasService } from '@/api/canvasService';
import { DEFAULT_CHAIN_ID } from '@/config/networks';
import { useCanvasStore } from '@/store/canvasStore';
import { useUIStore } from '@/store/uiStore';
import { ethers } from 'ethers';

// Create context for the canvas service
interface CanvasServiceContextType {
  canvasService: CanvasService | null;
  loading: boolean;
  error: string | null;
  isUsingFallback: boolean;
}

const CanvasServiceContext = createContext<CanvasServiceContextType>({
  canvasService: null,
  loading: true,
  error: null,
  isUsingFallback: false
});

export const useCanvasService = () => useContext(CanvasServiceContext);

export const CanvasServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [canvasService, setCanvasService] = useState<CanvasService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  
  // For now, we'll just use the default chain ID since useNetwork is not available
  const chainId = DEFAULT_CHAIN_ID;
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const setDimensions = useCanvasStore(state => state.setDimensions);
  const addActivityItem = useUIStore(state => state.addActivityItem);
  const updatePixel = useCanvasStore(state => state.updatePixel);
  
  // Update the signer when the wallet connection changes
  useEffect(() => {
    const updateServiceSigner = async () => {
      if (!canvasService || !walletClient) return;
      
      try {
        console.log('Wallet client available, updating signer in CanvasService');
        
        // Create ethers signer from walletClient
        const provider = new ethers.BrowserProvider(walletClient as any);
        const signer = await provider.getSigner();
        
        // Check if service has updateSigner method
        if (canvasService.updateSigner) {
          console.log('Updating signer with address:', await signer.getAddress());
          canvasService.updateSigner(signer);
        } else {
          console.warn('CanvasService does not support updateSigner');
        }
      } catch (error) {
        console.error('Error updating signer in CanvasService:', error);
        setError('Error connecting your wallet to the PixelPlace contract. Please try reconnecting your wallet.');
      }
    };
    
    if (isConnected && walletClient) {
      updateServiceSigner();
    }
  }, [canvasService, isConnected, walletClient, setError]);
  
  // Initialize canvas service
  useEffect(() => {
    let isMounted = true;
    let retryTimeout: NodeJS.Timeout;
    
    const initializeCanvasService = async () => {
      try {
        console.log(`Initializing canvas service (attempt ${retryCount + 1}/${maxRetries + 1})...`);
        
        // If we've already retried too many times, just use the mock service
        if (retryCount >= maxRetries) {
          console.warn("Max retries reached, switching to mock service...");
          const mockService = new MockCanvasService();
          setCanvasService(mockService);
          setIsUsingFallback(true);
          setLoading(false);
          setError("Using mock data after multiple failed connection attempts. The app will work in offline mode.");
          return;
        }
        
        const service = new EthersCanvasService(chainId);
        
        // Test the contract by calling a safe view function
        try {
          // Add a slight delay to avoid overwhelming the RPC provider
          await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
          
          // Get canvas dimensions
          console.log('Fetching canvas dimensions...');
          const dimensions = await service.getDimensions();
          console.log('Canvas dimensions:', dimensions);
          
          if (isMounted) {
            setDimensions(dimensions.width, dimensions.height);
          
            // Set up event listeners
            const unsubscribePixelPainted = service.onPixelPainted((event: PixelPaintedEvent) => {
              // Update the pixel in the canvas
              updatePixel(event.x, event.y, event.color);
              
              // Add to activity feed
              addActivityItem(event);
            });
            
            setCanvasService(service);
            setLoading(false);
            setIsUsingFallback(false);
            setRetryCount(0); // Reset retry count on success
            
            // Cleanup function
            return () => {
              unsubscribePixelPainted();
            };
          }
        } catch (contractErr: any) {
          console.error('Contract interaction error:', contractErr);
          
          if (isMounted) {
            // If we haven't retried too many times yet, schedule a retry
            if (retryCount < maxRetries) {
              const nextRetry = retryCount + 1;
              const delay = 2000 * Math.pow(2, nextRetry - 1); // Exponential backoff
              
              console.log(`Scheduling retry ${nextRetry} in ${delay}ms...`);
              
              setRetryCount(nextRetry);
              retryTimeout = setTimeout(() => {
                initializeCanvasService();
              }, delay);
              
              // Show temporary error
              setError(`Connection attempt ${nextRetry}/${maxRetries + 1} failed. Retrying in ${delay/1000} seconds...`);
              return;
            }
            
            // Contract call failed, switch to mock service
            console.warn("Switching to mock canvas service");
            const mockService = new MockCanvasService();
            
            // Set up event listeners for mock service
            const unsubscribePixelPainted = mockService.onPixelPainted((event: PixelPaintedEvent) => {
              // Update the pixel in the canvas
              updatePixel(event.x, event.y, event.color);
              
              // Add to activity feed
              addActivityItem(event);
            });
            
            // Get mock dimensions
            const dimensions = await mockService.getDimensions();
            setDimensions(dimensions.width, dimensions.height);
            
            setCanvasService(mockService);
            setIsUsingFallback(true);
            setLoading(false);
            
            // Show a less severe error that doesn't prevent the app from working
            setError('Using simulated data: Contract interaction failed. The app will work with mock data for testing.');
            
            return () => {
              unsubscribePixelPainted();
            };
          }
        }
      } catch (err: any) {
        console.error('Fatal error initializing canvas service:', err);
        
        if (isMounted) {
          // Even if there's a fatal error, we can still use the mock service as a last resort
          try {
            console.warn('Attempting to initialize mock service as a last resort');
            const mockService = new MockCanvasService();
            const dimensions = await mockService.getDimensions();
            setDimensions(dimensions.width, dimensions.height);
            
            const unsubscribePixelPainted = mockService.onPixelPainted((event: PixelPaintedEvent) => {
              updatePixel(event.x, event.y, event.color);
              addActivityItem(event);
            });
            
            setCanvasService(mockService);
            setIsUsingFallback(true);
            setLoading(false);
            setError('Using mock data: Unable to connect to blockchain. Working in offline mode.');
            
            return () => {
              unsubscribePixelPainted();
            };
          } catch (mockErr) {
            // If even the mock service fails, show the original error
            setError(err.message || 'Failed to initialize canvas service. Please check your connection and try again.');
            setLoading(false);
          }
        }
      }
    };
    
    initializeCanvasService();
    
    return () => {
      isMounted = false;
      clearTimeout(retryTimeout);
    };
  }, [chainId, setDimensions, addActivityItem, updatePixel, retryCount]);
  
  return (
    <CanvasServiceContext.Provider value={{ canvasService, loading, error, isUsingFallback }}>
      {children}
    </CanvasServiceContext.Provider>
  );
}; 