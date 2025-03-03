'use client';

import React, { useEffect } from 'react';
import { Canvas } from '@/components/canvas/Canvas';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { ActivityFeed } from '@/components/ui/ActivityFeed';
import { useCanvasStore } from '@/store/canvasStore';
import { useCanvasService } from '@/components/providers/CanvasServiceProvider';

export default function Home() {
  const { canvasWidth, canvasHeight, setDimensions } = useCanvasStore();
  const { canvasService, loading, error } = useCanvasService();
  
  // Get canvas dimensions from contract
  useEffect(() => {
    const fetchDimensions = async () => {
      if (canvasService) {
        try {
          const dimensions = await canvasService.getDimensions();
          setDimensions(dimensions.width, dimensions.height);
        } catch (err) {
          console.error('Error fetching canvas dimensions:', err);
        }
      }
    };
    
    fetchDimensions();
  }, [canvasService, setDimensions]);
  
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-gray-50">
      {/* Loading state */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-gray-700">Loading PixelPlace...</p>
          </div>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
          <div className="max-w-md p-6 bg-white rounded-lg shadow-lg border border-red-200">
            <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
            <p className="text-gray-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      {/* Main content */}
      {!loading && !error && (
        <>
          {/* Canvas */}
          <Canvas width={canvasWidth} height={canvasHeight} />
          
          {/* Control Panel */}
          <ControlPanel />
          
          {/* Activity Feed */}
          <ActivityFeed />
        </>
      )}
    </main>
  );
}
