'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/uiStore';
import { formatDistanceToNow } from 'date-fns';

export const ActivityFeed: React.FC = () => {
  const { activity, clearActivity } = useUIStore();
  
  // Format address for display (shortening)
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  return (
    <div className="fixed bottom-4 left-4 z-10 w-80 max-h-96 bg-white bg-opacity-90 shadow-lg rounded-lg overflow-hidden">
      <div className="p-3 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-gray-700">Recent Activity</h3>
        <button
          onClick={clearActivity}
          className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
        >
          Clear
        </button>
      </div>
      
      <div className="overflow-y-auto max-h-80 p-2">
        {activity.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            No recent activity
          </div>
        ) : (
          <AnimatePresence>
            {activity.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-2 p-2 border border-gray-100 rounded bg-white shadow-sm"
              >
                <div className="flex items-start gap-2">
                  {/* Color preview */}
                  <div
                    className="w-6 h-6 rounded-full border border-gray-300 flex-shrink-0 mt-1"
                    style={{ backgroundColor: item.color }}
                  />
                  
                  <div className="flex-grow">
                    {/* Activity details */}
                    <div className="text-sm">
                      <span className="font-medium text-blue-600">
                        {formatAddress(item.painter)}
                      </span>{' '}
                      painted pixel at{' '}
                      <span className="font-medium">
                        ({item.x}, {item.y})
                      </span>
                    </div>
                    
                    {/* Timestamp */}
                    <div className="text-xs text-gray-500 mt-1">
                      {item.timestamp
                        ? formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })
                        : 'just now'}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}; 