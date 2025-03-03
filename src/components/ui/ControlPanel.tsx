'use client';

import React, { useEffect, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useCanvasStore } from '@/store/canvasStore';
import { useUIStore } from '@/store/uiStore';
import { useCanvasService } from '@/components/providers/CanvasServiceProvider';
import { ColorPicker } from './ColorPicker';

export const ControlPanel: React.FC = () => {
  const [pixelFee, setPixelFee] = useState<{ wei: bigint; eth: string; usd: number } | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);
  const [showCoordinates, setShowCoordinates] = useState(true);
  
  const { viewport, setSelectedPixel, resetViewport } = useCanvasStore();
  const { showGrid, toggleGrid } = useUIStore();
  const { canvasService } = useCanvasService();
  
  // Fetch current pixel fee
  useEffect(() => {
    const fetchPixelFee = async () => {
      if (!canvasService) return;
      
      try {
        setFeeLoading(true);
        const fee = await canvasService.getCurrentFee();
        setPixelFee(fee);
      } catch (error) {
        console.error('Error fetching pixel fee:', error);
      } finally {
        setFeeLoading(false);
      }
    };
    
    fetchPixelFee();
    
    // Set up fee update listener
    if (canvasService) {
      const unsubscribe = canvasService.onFeeUpdated((event) => {
        fetchPixelFee();
      });
      
      return unsubscribe;
    }
  }, [canvasService]);
  
  // Handle color selection
  const handleColorSelect = (color: string) => {
    console.log(`Selected color: ${color}`);
  };
  
  // Reset view to center
  const handleResetView = () => {
    resetViewport();
  };
  
  // Toggle coordinates display
  const handleToggleCoordinates = () => {
    setShowCoordinates(!showCoordinates);
  };
  
  return (
    <div className="fixed top-0 left-0 right-0 z-10 bg-white bg-opacity-90 shadow-md p-4">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Logo and title */}
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-indigo-700 mr-4">PixelPlace</h1>
          <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
            Beta
          </span>
        </div>
        
        {/* Controls */}
        <div className="flex items-center space-x-4">
          {/* Color picker */}
          <div>
            <ColorPicker onColorSelect={handleColorSelect} />
          </div>
          
          {/* Grid toggle */}
          <div>
            <button
              onClick={toggleGrid}
              className={`p-2 rounded ${
                showGrid ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {showGrid ? 'Hide Grid' : 'Show Grid'}
            </button>
          </div>
          
          {/* Reset view */}
          <div>
            <button
              onClick={handleResetView}
              className="p-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Reset View
            </button>
          </div>
          
          {/* Coordinates toggle */}
          <div>
            <button
              onClick={handleToggleCoordinates}
              className={`p-2 rounded ${
                showCoordinates ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {showCoordinates ? 'Hide Coordinates' : 'Show Coordinates'}
            </button>
          </div>
        </div>
        
        {/* Right side: Fee display and wallet */}
        <div className="flex items-center space-x-4">
          {/* Selected pixel */}
          {viewport.selectedX !== null && viewport.selectedY !== null && showCoordinates && (
            <div className="px-3 py-1 bg-gray-100 rounded">
              Selected: ({viewport.selectedX}, {viewport.selectedY})
            </div>
          )}
          
          {/* Fee display */}
          {pixelFee ? (
            <div className="px-3 py-1 bg-green-50 text-green-700 rounded border border-green-200">
              Pixel Fee: {pixelFee.eth} ETH (${pixelFee.usd.toFixed(2)})
            </div>
          ) : feeLoading ? (
            <div className="px-3 py-1 bg-gray-50 text-gray-500 rounded">
              Loading fee...
            </div>
          ) : null}
          
          {/* Wallet connection */}
          <div className="ml-4">
            <ConnectButton />
          </div>
        </div>
      </div>
    </div>
  );
}; 