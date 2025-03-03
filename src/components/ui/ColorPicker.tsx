'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DEFAULT_COLOR_PALETTE } from '@/config/constants';
import { useUIStore } from '@/store/uiStore';

interface ColorPickerProps {
  onColorSelect: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ onColorSelect }) => {
  const { currentColor, setCurrentColor, isColorPickerOpen, toggleColorPicker } = useUIStore();
  const [customColor, setCustomColor] = useState('#000000');
  
  // Handle color selection from palette
  const handleColorSelect = (color: string) => {
    setCurrentColor(color);
    onColorSelect(color);
  };
  
  // Handle custom color input
  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomColor(e.target.value);
  };
  
  // Apply custom color
  const handleCustomColorSelect = () => {
    setCurrentColor(customColor);
    onColorSelect(customColor);
  };
  
  return (
    <div className="relative">
      {/* Current color display and toggle button */}
      <button
        className="flex items-center space-x-2 p-2 rounded border border-gray-300 hover:bg-gray-100"
        onClick={toggleColorPicker}
      >
        <div
          className="w-6 h-6 rounded border border-gray-400"
          style={{ backgroundColor: currentColor }}
        />
        <span>{currentColor}</span>
      </button>
      
      {/* Color picker panel */}
      {isColorPickerOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute z-10 mt-2 p-4 bg-white rounded shadow-lg border border-gray-200"
          style={{ width: '250px' }}
        >
          {/* Color palette */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {DEFAULT_COLOR_PALETTE.map((color) => (
              <button
                key={color}
                className={`w-12 h-12 rounded-full border-2 ${
                  currentColor === color ? 'border-blue-500' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorSelect(color)}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
          
          {/* Custom color input */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Color
            </label>
            <div className="flex space-x-2">
              <input
                type="color"
                value={customColor}
                onChange={handleCustomColorChange}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={customColor}
                onChange={handleCustomColorChange}
                className="flex-grow border border-gray-300 rounded px-2 py-1 text-sm"
                placeholder="#RRGGBB"
              />
              <button
                onClick={handleCustomColorSelect}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Apply
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}; 