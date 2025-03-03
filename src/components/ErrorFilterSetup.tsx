'use client';

import { useEffect } from 'react';
import { setupErrorFilters } from '@/lib/errorFilter';

/**
 * Component that sets up error filters on mount
 * Must be a client component
 */
export default function ErrorFilterSetup() {
  useEffect(() => {
    // Setup the error filters when the component mounts
    setupErrorFilters();
    
    console.log('Error filters initialized');
  }, []);
  
  // This component doesn't render anything
  return null;
} 