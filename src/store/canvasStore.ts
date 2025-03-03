import { create } from 'zustand';
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT, DEFAULT_CHUNK_SIZE, DEFAULT_COLOR } from '../config/constants';
import { CanvasChunk, Pixel, ViewportState } from '../types';

interface CanvasStore {
  // Canvas data
  canvasWidth: number;
  canvasHeight: number;
  chunkSize: number;
  chunks: Record<string, CanvasChunk>;
  loadingChunks: Record<string, boolean>;
  
  // Viewport state
  viewport: ViewportState;
  
  // Actions
  setDimensions: (width: number, height: number) => void;
  setChunk: (startX: number, startY: number, chunk: CanvasChunk) => void;
  setChunkLoading: (startX: number, startY: number, isLoading: boolean) => void;
  updatePixel: (x: number, y: number, color: string) => void;
  
  // Viewport actions
  setScale: (scale: number) => void;
  setOffset: (offsetX: number, offsetY: number) => void;
  setSelectedPixel: (x: number | null, y: number | null) => void;
  resetViewport: () => void;
  
  // Helpers
  getChunkKey: (startX: number, startY: number) => string;
  getPixel: (x: number, y: number) => Pixel | null;
  getVisibleChunks: () => { startX: number, startY: number }[];
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  // Canvas data
  canvasWidth: DEFAULT_CANVAS_WIDTH,
  canvasHeight: DEFAULT_CANVAS_HEIGHT,
  chunkSize: DEFAULT_CHUNK_SIZE,
  chunks: {},
  loadingChunks: {},
  
  // Viewport state
  viewport: {
    scale: 10,
    offsetX: 0,
    offsetY: 0,
    selectedX: null,
    selectedY: null,
  },
  
  // Actions
  setDimensions: (width, height) => set({ canvasWidth: width, canvasHeight: height }),
  
  setChunk: (startX, startY, chunk) => {
    const chunkKey = get().getChunkKey(startX, startY);
    set(state => ({
      chunks: {
        ...state.chunks,
        [chunkKey]: chunk
      },
      loadingChunks: {
        ...state.loadingChunks,
        [chunkKey]: false
      }
    }));
  },
  
  setChunkLoading: (startX, startY, isLoading) => {
    const chunkKey = get().getChunkKey(startX, startY);
    set(state => ({
      loadingChunks: {
        ...state.loadingChunks,
        [chunkKey]: isLoading
      }
    }));
  },
  
  updatePixel: (x, y, color) => {
    // Find the chunk that contains this pixel
    const { chunkSize } = get();
    const chunkStartX = Math.floor(x / chunkSize) * chunkSize;
    const chunkStartY = Math.floor(y / chunkSize) * chunkSize;
    const chunkKey = get().getChunkKey(chunkStartX, chunkStartY);
    
    // Update the pixel in the chunk
    set(state => {
      const chunk = state.chunks[chunkKey];
      if (!chunk) return state; // Chunk not loaded
      
      // Create a deep copy of the chunk
      const newChunk = chunk.map(row => [...row]);
      
      // Find the pixel within the chunk
      const relativeX = x - chunkStartX;
      const relativeY = y - chunkStartY;
      
      // Update the pixel if it exists in the chunk
      if (newChunk[relativeY] && newChunk[relativeY][relativeX]) {
        newChunk[relativeY][relativeX] = {
          ...newChunk[relativeY][relativeX],
          color,
          lastPainted: Date.now()
        };
      }
      
      return {
        chunks: {
          ...state.chunks,
          [chunkKey]: newChunk
        }
      };
    });
  },
  
  // Viewport actions
  setScale: (scale) => set(state => ({
    viewport: {
      ...state.viewport,
      scale: Math.max(1, Math.min(40, scale))
    }
  })),
  
  setOffset: (offsetX, offsetY) => set(state => ({
    viewport: {
      ...state.viewport,
      offsetX,
      offsetY
    }
  })),
  
  setSelectedPixel: (x, y) => set(state => ({
    viewport: {
      ...state.viewport,
      selectedX: x,
      selectedY: y
    }
  })),
  
  resetViewport: () => set(state => ({
    viewport: {
      scale: 10,
      offsetX: 0,
      offsetY: 0,
      selectedX: state.viewport.selectedX,
      selectedY: state.viewport.selectedY
    }
  })),
  
  // Helpers
  getChunkKey: (startX, startY) => `${startX},${startY}`,
  
  getPixel: (x, y) => {
    const { chunkSize, chunks } = get();
    const chunkStartX = Math.floor(x / chunkSize) * chunkSize;
    const chunkStartY = Math.floor(y / chunkSize) * chunkSize;
    const chunkKey = get().getChunkKey(chunkStartX, chunkStartY);
    
    const chunk = chunks[chunkKey];
    if (!chunk) return null;
    
    const relativeX = x - chunkStartX;
    const relativeY = y - chunkStartY;
    
    if (chunk[relativeY] && chunk[relativeY][relativeX]) {
      return chunk[relativeY][relativeX];
    }
    
    return null;
  },
  
  getVisibleChunks: () => {
    const { viewport, canvasWidth, canvasHeight, chunkSize } = get();
    const { scale, offsetX, offsetY } = viewport;
    
    // Calculate visible area in canvas coordinates
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const visibleStartX = Math.max(0, Math.floor(-offsetX / scale));
    const visibleStartY = Math.max(0, Math.floor(-offsetY / scale));
    const visibleEndX = Math.min(canvasWidth, Math.ceil((viewportWidth - offsetX) / scale));
    const visibleEndY = Math.min(canvasHeight, Math.ceil((viewportHeight - offsetY) / scale));
    
    // Calculate chunks that cover the visible area
    const startChunkX = Math.floor(visibleStartX / chunkSize) * chunkSize;
    const startChunkY = Math.floor(visibleStartY / chunkSize) * chunkSize;
    const endChunkX = Math.ceil(visibleEndX / chunkSize) * chunkSize;
    const endChunkY = Math.ceil(visibleEndY / chunkSize) * chunkSize;
    
    const visibleChunks = [];
    
    for (let y = startChunkY; y < endChunkY; y += chunkSize) {
      for (let x = startChunkX; x < endChunkX; x += chunkSize) {
        visibleChunks.push({ startX: x, startY: y });
      }
    }
    
    return visibleChunks;
  }
})); 