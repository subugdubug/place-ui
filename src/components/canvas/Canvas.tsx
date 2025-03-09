'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { useUIStore } from '@/store/uiStore';
import { useCanvasService } from '@/components/providers/CanvasServiceProvider';
import { DEFAULT_COLOR } from '@/config/constants';

interface CanvasProps {
  width: number;
  height: number;
}

export const Canvas: React.FC<CanvasProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [updateIntervalId, setUpdateIntervalId] = useState<NodeJS.Timeout | null>(null);
  
  // Debug helper to check a specific pixel's status
  const checkSpecificPixel = useCallback((x: number, y: number) => {
    // Get the pixel data from store
    const { getPixel } = useCanvasStore.getState();
    const pixel = getPixel(x, y);
    
    console.log(`======= DEBUG PIXEL (${x},${y}) =======`);
    console.log(`Pixel data:`, pixel);
    
    // Get hex color
    if (pixel) {
      console.log(`Color value: "${pixel.color}"`);
      console.log(`Is valid hex: ${/^#[0-9A-F]{6}$/i.test(pixel.color)}`);
      console.log(`Is black (#000000): ${pixel.color === '#000000'}`);
      console.log(`Is white (#FFFFFF): ${pixel.color === '#FFFFFF'}`);
    } else {
      console.log(`No pixel data found - would render with DEFAULT_COLOR: ${DEFAULT_COLOR}`);
    }
    console.log(`====================================`);
    
    return pixel;
  }, []);
  
  // Debug button to check a specific pixel
  useEffect(() => {
    // Add a global helper for debugging from console
    (window as any).checkPixel = (x: number, y: number) => checkSpecificPixel(x, y);
    (window as any).getCanvasState = () => useCanvasStore.getState();
    
    return () => {
      delete (window as any).checkPixel;
      delete (window as any).getCanvasState;
    };
  }, [checkSpecificPixel]);
  
  // Get state from stores
  const {
    viewport,
    chunks,
    loadingChunks,
    getVisibleChunks,
    setChunk,
    setChunkLoading,
    setScale,
    setOffset,
    setSelectedPixel,
    getPixel
  } = useCanvasStore();
  
  const { showGrid, currentColor } = useUIStore();
  const { canvasService } = useCanvasService();
  
  // Calculate canvas size in pixels based on viewport
  const canvasSizeX = width * viewport.scale;
  const canvasSizeY = height * viewport.scale;
  
  // Load visible chunks
  const loadVisibleChunks = useCallback(async () => {
    if (!canvasService) return;
    
    const visibleChunks = getVisibleChunks();
    
    // Load all visible chunks that aren't already loaded or loading
    for (const { startX, startY } of visibleChunks) {
      const chunkKey = `${startX},${startY}`;
      
      if (!chunks[chunkKey] && !loadingChunks[chunkKey]) {
        // Mark chunk as loading
        setChunkLoading(startX, startY, true);
        
        try {
          // Get chunk size (should match the store's chunkSize)
          const chunkSize = 20; // This should be dynamic in a real app
          
          // Request chunk data from service
          const chunkData = await canvasService.getCanvasSection(
            startX,
            startY,
            Math.min(chunkSize, width - startX),
            Math.min(chunkSize, height - startY)
          );
          
          // Store chunk data
          setChunk(startX, startY, chunkData);
        } catch (error) {
          console.error(`Error loading chunk at (${startX}, ${startY}):`, error);
          setChunkLoading(startX, startY, false);
        }
      }
    }
  }, [canvasService, getVisibleChunks, chunks, loadingChunks, setChunk, setChunkLoading, width, height]);

  // Fetch all visible chunks periodically to keep the canvas updated
  const setupPeriodicUpdates = useCallback(() => {
    if (updateIntervalId) {
      clearInterval(updateIntervalId);
    }

    const intervalId = setInterval(async () => {
      if (!canvasService) return;
      
      const visibleChunks = getVisibleChunks();
      
      // Update all visible chunks regardless of their loading state
      for (const { startX, startY } of visibleChunks) {
        try {
          // Get chunk size (should match the store's chunkSize)
          const chunkSize = 20; // This should be dynamic in a real app
          
          // Request chunk data from service
          const chunkData = await canvasService.getCanvasSection(
            startX,
            startY,
            Math.min(chunkSize, width - startX),
            Math.min(chunkSize, height - startY)
          );
          
          // Store chunk data
          setChunk(startX, startY, chunkData);
        } catch (error) {
          console.error(`Error updating chunk at (${startX}, ${startY}):`, error);
        }
      }
    }, 1000); // Update every 1 second
    
    setUpdateIntervalId(intervalId);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [canvasService, getVisibleChunks, setChunk, width, height]);
  
  // Render the canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate visible area in canvas coordinates
    const visibleStartX = Math.floor(-viewport.offsetX / viewport.scale);
    const visibleStartY = Math.floor(-viewport.offsetY / viewport.scale);
    const visibleEndX = Math.ceil((canvas.width - viewport.offsetX) / viewport.scale);
    const visibleEndY = Math.ceil((canvas.height - viewport.offsetY) / viewport.scale);
    
    // Draw pixels
    for (let y = Math.max(0, visibleStartY); y < Math.min(height, visibleEndY); y++) {
      for (let x = Math.max(0, visibleStartX); x < Math.min(width, visibleEndX); x++) {
        const pixel = getPixel(x, y);
        
        // Debug for specific coordinates (e.g., where you've painted a black pixel)
        if (x === 50 && y === 50) { // Replace with your black pixel coordinates
          console.log(`Rendering pixel at (50,50):`, pixel);
        }
        
        // Use pixel color if available, otherwise use default color
        let debugColor = null;
        
        if (pixel) {
          ctx.fillStyle = pixel.color;
          
          // Debug - highlight potential problem pixels with special colors for visualization
          if (pixel.color === '#000000') { 
            debugColor = 'red'; // Highlight black pixels in red to make them visible
            console.log(`Found black pixel at (${x},${y}):`, pixel);
          } else if (pixel.color === '' || !pixel.color.startsWith('#')) {
            debugColor = 'lime'; // Highlight invalid colors in lime
            console.log(`Found invalid color at (${x},${y}):`, pixel.color);
          }
        } else {
          ctx.fillStyle = DEFAULT_COLOR;
        }
        
        // Calculate pixel position on canvas
        const canvasX = x * viewport.scale + viewport.offsetX;
        const canvasY = y * viewport.scale + viewport.offsetY;
        
        // Draw pixel
        ctx.fillRect(canvasX, canvasY, viewport.scale, viewport.scale);
        
        // If debugging, highlight problematic pixels with a border
        if (debugColor && viewport.scale > 4) {
          ctx.strokeStyle = debugColor;
          ctx.lineWidth = 2;
          ctx.strokeRect(canvasX, canvasY, viewport.scale, viewport.scale);
        }
      }
    }
    
    // Draw grid if enabled and scale is large enough
    if (showGrid && viewport.scale >= 4) {
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
      ctx.lineWidth = 1;
      
      // Draw vertical grid lines
      for (let x = 0; x <= width; x++) {
        const canvasX = Math.floor(x * viewport.scale + viewport.offsetX) + 0.5;
        if (canvasX < 0 || canvasX > canvas.width) continue;
        
        ctx.beginPath();
        ctx.moveTo(canvasX, 0);
        ctx.lineTo(canvasX, canvas.height);
        ctx.stroke();
      }
      
      // Draw horizontal grid lines
      for (let y = 0; y <= height; y++) {
        const canvasY = Math.floor(y * viewport.scale + viewport.offsetY) + 0.5;
        if (canvasY < 0 || canvasY > canvas.height) continue;
        
        ctx.beginPath();
        ctx.moveTo(0, canvasY);
        ctx.lineTo(canvas.width, canvasY);
        ctx.stroke();
      }
    }
    
    // Highlight selected pixel if any
    if (viewport.selectedX !== null && viewport.selectedY !== null) {
      const x = viewport.selectedX;
      const y = viewport.selectedY;
      
      const canvasX = x * viewport.scale + viewport.offsetX;
      const canvasY = y * viewport.scale + viewport.offsetY;
      
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(canvasX, canvasY, viewport.scale, viewport.scale);
    }
  }, [viewport, getPixel, showGrid, width, height]);
  
  // Initialize canvas and set up event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas size
    canvas.width = canvasSizeX;
    canvas.height = canvasSizeY;
    
    // Initial render
    renderCanvas();
    
    // Load initial chunks
    loadVisibleChunks();
    
    // Set up periodic updates
    const cleanupUpdates = setupPeriodicUpdates();
    
    // Set up window resize listener
    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        renderCanvas();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Set up animation frame for smooth rendering
    let animationFrameId: number;
    
    const animate = () => {
      renderCanvas();
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (updateIntervalId) {
        clearInterval(updateIntervalId);
      }
      cleanupUpdates();
    };
  }, [canvasSizeX, canvasSizeY, renderCanvas, loadVisibleChunks, setupPeriodicUpdates]);
  
  // Handle wheel event for zooming
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate the point in canvas coordinates (before zoom)
    const canvasX = (mouseX - viewport.offsetX) / viewport.scale;
    const canvasY = (mouseY - viewport.offsetY) / viewport.scale;
    
    // Calculate new scale
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.max(1, Math.min(40, viewport.scale * delta));
    
    // Calculate new offset to keep the point under mouse fixed
    const newOffsetX = mouseX - canvasX * newScale;
    const newOffsetY = mouseY - canvasY * newScale;
    
    // Update viewport
    setScale(newScale);
    setOffset(newOffsetX, newOffsetY);
  };
  
  // Handle mouse down for dragging or selecting
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsMouseDown(true);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate pixel coordinates from mouse position
    const pixelX = Math.floor((mouseX - viewport.offsetX) / viewport.scale);
    const pixelY = Math.floor((mouseY - viewport.offsetY) / viewport.scale);
    
    // Check if click is within canvas bounds
    if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
      // Select the pixel
      setSelectedPixel(pixelX, pixelY);
    }
  };
  
  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMouseDown) return;
    
    // Pan the canvas
    setOffset(viewport.offsetX + e.movementX, viewport.offsetY + e.movementY);
  };
  
  // Handle mouse up to end drag
  const handleMouseUp = () => {
    setIsMouseDown(false);
  };
  
  // Handle click to select a pixel (no longer directly painting)
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate pixel coordinates from mouse position
    const pixelX = Math.floor((mouseX - viewport.offsetX) / viewport.scale);
    const pixelY = Math.floor((mouseY - viewport.offsetY) / viewport.scale);
    
    // Check if click is within canvas bounds
    if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
      // Just select the pixel, don't paint yet
      setSelectedPixel(pixelX, pixelY);
    }
  };

  // Handle the paint button click - now only sends transaction when button is clicked
  const handlePaintButtonClick = async () => {
    if (!canvasService || isLoading || viewport.selectedX === null || viewport.selectedY === null) return;
    
    try {
      setIsLoading(true);
      
      // Paint the pixel
      const result = await canvasService.paintPixel(viewport.selectedX, viewport.selectedY, currentColor);
      
      if (result.success) {
        console.log(`Pixel painted at (${viewport.selectedX}, ${viewport.selectedY})`);
      } else {
        console.error('Failed to paint pixel:', result.error);
        
        // Show a more user-friendly error for wallet connection issues
        if (result.error === 'Wallet not connected') {
          alert('Please connect your wallet to paint pixels. Click the "Connect Wallet" button in the top right corner.');
        } else {
          alert(`Error: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Error painting pixel:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 cursor-pointer"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
      />
      
      {/* Paint button when pixel is selected */}
      {viewport.selectedX !== null && viewport.selectedY !== null && (
        <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg z-20">
          <h3 className="text-lg font-bold mb-2">Paint This Pixel</h3>
          <p className="text-sm mb-1">
            Position: ({viewport.selectedX}, {viewport.selectedY})
          </p>
          <p className="text-sm mb-3">
            Color: <span className="inline-block w-4 h-4 align-middle" style={{ backgroundColor: currentColor }}></span> {currentColor}
          </p>
          <button
            onClick={handlePaintButtonClick}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Painting...' : 'Paint Pixel'}
          </button>
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
            <span>Painting...</span>
          </div>
        </div>
      )}
    </div>
  );
}; 