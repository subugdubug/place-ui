import React from 'react';
import { useCanvasService } from '../providers/CanvasServiceProvider';

export const FallbackIndicator: React.FC = () => {
  const { isUsingFallback, error } = useCanvasService();

  if (!isUsingFallback) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black p-2 text-center text-sm z-50">
      <div className="font-semibold flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span className="mr-2">Using Simulation Mode</span>
        <span>|</span>
        <span className="ml-2">{error}</span>
      </div>
    </div>
  );
}; 