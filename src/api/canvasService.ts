import { ethers } from 'ethers';
import { CanvasChunk, CanvasService, FeeUpdatedEvent, PixelPaintedEvent, TransactionResult } from '../types';
import { getContract, getProvider, processCanvasSectionData, formatEth, ethToUsd, paintPixel } from '../lib/web3utils';
import { bytes3ToHex } from '../config/contracts';
import { DEFAULT_COLOR } from '../config/constants';

export class EthersCanvasService implements CanvasService {
  private contract: ethers.Contract;
  private signer?: ethers.Signer;
  private chainId: number;
  
  // Default values to use as fallbacks
  private readonly DEFAULT_WIDTH = 100;
  private readonly DEFAULT_HEIGHT = 100;

  constructor(chainId: number, signer?: ethers.Signer) {
    this.chainId = chainId;
    this.signer = signer;
    this.contract = getContract(chainId, signer);
  }

  /**
   * Safe contract call with fallback
   * Attempts to call the contract function, falls back to default value if it fails
   */
  private async safeContractCall<T>(
    functionName: string, 
    args: any[] = [], 
    defaultValue: T
  ): Promise<T> {
    try {
      // @ts-ignore - we're using dynamic function calls
      const result = await this.contract[functionName](...args);
      return result as T;
    } catch (error) {
      console.warn(`Error calling contract.${functionName}, using fallback value:`, error);
      return defaultValue;
    }
  }

  /**
   * Update the signer when a user connects their wallet
   */
  public updateSigner(signer: ethers.Signer) {
    this.signer = signer;
    this.contract = getContract(this.chainId, signer);
  }

  /**
   * Get the dimensions of the canvas from the contract
   */
  public async getDimensions(): Promise<{ width: number; height: number }> {
    try {
      // Try to get width from contract, use default if it fails
      const width = await this.safeContractCall<bigint>('WIDTH', [], BigInt(this.DEFAULT_WIDTH));
      
      // Try to get height from contract, use default if it fails
      const height = await this.safeContractCall<bigint>('HEIGHT', [], BigInt(this.DEFAULT_HEIGHT));
      
      return {
        width: Number(width),
        height: Number(height)
      };
    } catch (error) {
      console.error("Error getting canvas dimensions:", error);
      // Return default dimensions if contract call fails
      return { 
        width: this.DEFAULT_WIDTH, 
        height: this.DEFAULT_HEIGHT 
      };
    }
  }

  /**
   * Get the color of a single pixel
   */
  public async getPixelColor(x: number, y: number): Promise<string> {
    try {
      const color = await this.safeContractCall<string>(
        'getPixelColor', 
        [x, y], 
        DEFAULT_COLOR
      );
      return bytes3ToHex(color);
    } catch (error) {
      console.error(`Error getting pixel color at (${x}, ${y}):`, error);
      return DEFAULT_COLOR;
    }
  }

  /**
   * Get a section of the canvas with smart chunking to avoid overwhelming the RPC provider
   */
  public async getCanvasSection(
    startX: number,
    startY: number,
    width: number,
    height: number
  ): Promise<CanvasChunk> {
    try {
      // Determine the maximum chunk size to avoid batch size errors
      // Too large values can overwhelm the RPC provider
      const MAX_CHUNK_SIZE = 10;
      
      // Initialize the result canvas chunk
      const result: CanvasChunk = [];
      for (let y = 0; y < height; y++) {
        const row: CanvasChunk[0] = [];
        for (let x = 0; x < width; x++) {
          row.push({
            x: startX + x,
            y: startY + y,
            color: DEFAULT_COLOR // Default color until loaded
          });
        }
        result.push(row);
      }
      
      // Fetch in smaller chunks to avoid batch size errors
      for (let chunkY = 0; chunkY < height; chunkY += MAX_CHUNK_SIZE) {
        const chunkHeight = Math.min(MAX_CHUNK_SIZE, height - chunkY);
        
        for (let chunkX = 0; chunkX < width; chunkX += MAX_CHUNK_SIZE) {
          const chunkWidth = Math.min(MAX_CHUNK_SIZE, width - chunkX);
          
          try {
            // Add a small delay between chunks to avoid overwhelming the provider
            if (chunkX > 0 || chunkY > 0) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Fetch this chunk
            console.log(`Fetching chunk at ${startX + chunkX},${startY + chunkY} (${chunkWidth}x${chunkHeight})`);
            const rawData = await this.contract.getCanvasSection(
              startX + chunkX,
              startY + chunkY,
              chunkWidth,
              chunkHeight
            );
            
            // Process the chunk data
            const chunkData = processCanvasSectionData(rawData, startX + chunkX, startY + chunkY);
            
            // Merge into the result
            for (let y = 0; y < chunkHeight; y++) {
              for (let x = 0; x < chunkWidth; x++) {
                result[chunkY + y][chunkX + x] = chunkData[y][x];
              }
            }
          } catch (chunkError) {
            console.error(`Error fetching chunk at ${startX + chunkX},${startY + chunkY}:`, chunkError);
            // Continue with other chunks, keeping default colors for this chunk
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error("Error getting canvas section:", error);
      
      // Return default data (white pixels) if contract call fails
      const defaultChunk: CanvasChunk = [];
      
      for (let y = 0; y < height; y++) {
        const row: CanvasChunk[0] = [];
        for (let x = 0; x < width; x++) {
          row.push({
            x: startX + x,
            y: startY + y,
            color: DEFAULT_COLOR
          });
        }
        defaultChunk.push(row);
      }
      
      return defaultChunk;
    }
  }

  /**
   * Get the current fee required to paint a pixel
   */
  public async getCurrentFee(): Promise<{ wei: bigint; eth: string; usd: number }> {
    try {
      const defaultFee = BigInt(1000000000000000); // 0.001 ETH as default
      const fee = await this.safeContractCall<bigint>('pixelFee', [], defaultFee);
      const ethValue = formatEth(fee);
      const usdValue = ethToUsd(ethValue);
      
      return {
        wei: fee,
        eth: ethValue,
        usd: usdValue
      };
    } catch (error) {
      console.error("Error getting current fee:", error);
      // Return a default value if contract call fails
      return {
        wei: BigInt(1000000000000000), // 0.001 ETH as default
        eth: "0.001",
        usd: 2.5
      };
    }
  }

  /**
   * Paint a pixel on the canvas
   */
  public async paintPixel(
    x: number,
    y: number,
    color: string
  ): Promise<TransactionResult> {
    console.log(`Attempting to paint pixel at (${x}, ${y}) with color ${color}`);
    
    if (!this.signer) {
      console.warn("Cannot paint pixel: Wallet not connected");
      return {
        success: false,
        error: "Wallet not connected"
      };
    }

    try {
      // Get the current fee
      const { wei: fee } = await this.getCurrentFee();
      console.log(`Got fee for painting: ${fee} wei (${formatEth(fee)} ETH)`);
      
      // Check if we're using the mock service
      console.log(`Using real contract: ${this.contract.target}`);
      
      // Call the paintPixel function
      console.log("Sending transaction...");
      const result = await paintPixel(this.contract, x, y, color, fee);
      console.log("Transaction result:", result);
      return result;
    } catch (error: any) {
      console.error("Error in paintPixel:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Subscribe to PixelPainted events with error handling and reconnection
   */
  public onPixelPainted(callback: (event: PixelPaintedEvent) => void): () => void {
    const eventFilter = this.contract.filters.PixelPainted();
    
    const listener = (x: bigint, y: bigint, color: string, painter: string) => {
      const event: PixelPaintedEvent = {
        x: Number(x),
        y: Number(y),
        color: bytes3ToHex(color),
        painter,
        timestamp: Date.now() // Use current time as we don't have block time
      };
      
      callback(event);
    };
    
    // Setup error handling and automatic reconnection
    let isConnected = true;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY = 2000; // 2 seconds
    
    const handleConnectionError = (error: any) => {
      console.error("Event subscription error:", error);
      
      if (isConnected) {
        isConnected = false;
        console.warn("Lost connection to event subscription, attempting to reconnect...");
        
        // Attempt to reconnect with exponential backoff
        const attemptReconnect = () => {
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            const backoffDelay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1);
            
            console.log(`Reconnect attempt ${reconnectAttempts} in ${backoffDelay}ms...`);
            
            setTimeout(() => {
              try {
                // Remove old listener and add a new one
                this.contract.off(eventFilter, listener);
                this.contract.on(eventFilter, listener);
                
                console.log("Successfully reconnected to event subscription");
                isConnected = true;
                reconnectAttempts = 0;
              } catch (reconnectError) {
                console.error("Failed to reconnect:", reconnectError);
                attemptReconnect(); // Try again
              }
            }, backoffDelay);
          } else {
            console.error("Max reconnect attempts reached, giving up");
          }
        };
        
        attemptReconnect();
      }
    };
    
    // Try to add error handling to the provider
    try {
      // Safely access the provider - if it exists and has an 'on' method
      const provider = this.contract.runner as any; // The provider is usually available as runner in ethers v6
      if (provider && typeof provider.on === 'function') {
        provider.on("error", handleConnectionError);
      }
    } catch (providerError) {
      console.warn("Could not attach error handler to provider:", providerError);
    }
    
    try {
      // Set up the event listener
      this.contract.on(eventFilter, listener);
    } catch (error) {
      console.error("Error setting up event listener:", error);
      // Return empty cleanup function
      return () => {};
    }
    
    // Return a function to remove the listener
    return () => {
      try {
        this.contract.off(eventFilter, listener);
        
        // Try to remove error handling from the provider
        try {
          const provider = this.contract.runner as any;
          if (provider && typeof provider.off === 'function') {
            provider.off("error", handleConnectionError);
          }
        } catch (providerError) {
          console.warn("Could not remove error handler from provider:", providerError);
        }
      } catch (error) {
        console.error("Error removing event listener:", error);
      }
    };
  }

  /**
   * Subscribe to FeeUpdated events
   */
  public onFeeUpdated(callback: (event: FeeUpdatedEvent) => void): () => void {
    const eventFilter = this.contract.filters.FeeUpdated();
    
    const listener = (newFee: bigint) => {
      const event: FeeUpdatedEvent = {
        newFee
      };
      
      callback(event);
    };
    
    this.contract.on(eventFilter, listener);
    
    // Return a function to remove the listener
    return () => {
      this.contract.off(eventFilter, listener);
    };
  }
}

/**
 * MockCanvasService provides a fallback implementation that doesn't require a contract
 * Useful for development, testing, or when contract is unavailable
 */
export class MockCanvasService implements CanvasService {
  // Default canvas dimensions for the mock service
  private readonly DEFAULT_WIDTH = 100;
  private readonly DEFAULT_HEIGHT = 100;
  
  private eventCallbacks: {
    pixelPainted: ((event: PixelPaintedEvent) => void)[];
    feeUpdated: ((event: FeeUpdatedEvent) => void)[];
  } = {
    pixelPainted: [],
    feeUpdated: []
  };

  constructor() {
    console.log('Using mock canvas service (no contract required)');
  }

  public updateSigner(_signer: ethers.Signer) {
    // No-op since we're not using a real contract
  }

  public async getDimensions(): Promise<{ width: number; height: number }> {
    return { 
      width: this.DEFAULT_WIDTH, 
      height: this.DEFAULT_HEIGHT 
    };
  }

  public async getPixelColor(_x: number, _y: number): Promise<string> {
    // Return a random color for testing purposes
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  public async getCanvasSection(
    startX: number,
    startY: number,
    width: number,
    height: number
  ): Promise<CanvasChunk> {
    // Return a checkerboard pattern for testing
    const chunk: CanvasChunk = [];
    const colors = ['#EEEEEE', '#DDDDDD', '#CCCCCC', '#BBBBBB'];
    
    for (let y = 0; y < height; y++) {
      const row: CanvasChunk[0] = [];
      for (let x = 0; x < width; x++) {
        const colorIndex = (x + y) % colors.length;
        row.push({
          x: startX + x,
          y: startY + y,
          color: colors[colorIndex]
        });
      }
      chunk.push(row);
    }
    
    return chunk;
  }

  public async getCurrentFee(): Promise<{ wei: bigint; eth: string; usd: number }> {
    return {
      wei: BigInt(1000000000000000),
      eth: "0.001",
      usd: 2.5
    };
  }

  public async paintPixel(
    x: number,
    y: number,
    color: string
  ): Promise<TransactionResult> {
    // Simulate successful pixel painting
    console.log(`Mock painting pixel at (${x}, ${y}) with color ${color}`);
    
    // Notify listeners
    const event: PixelPaintedEvent = {
      x,
      y,
      color,
      painter: "0xMockAddress0000000000000000000000000000",
      timestamp: Date.now()
    };
    
    setTimeout(() => {
      this.eventCallbacks.pixelPainted.forEach(callback => callback(event));
    }, 1000); // Simulate 1 second delay
    
    return {
      success: true,
      transactionHash: "0xMockTxHash" + Math.random().toString(16).substring(2, 10)
    };
  }

  public onPixelPainted(callback: (event: PixelPaintedEvent) => void): () => void {
    this.eventCallbacks.pixelPainted.push(callback);
    
    return () => {
      this.eventCallbacks.pixelPainted = this.eventCallbacks.pixelPainted.filter(cb => cb !== callback);
    };
  }

  public onFeeUpdated(callback: (event: FeeUpdatedEvent) => void): () => void {
    this.eventCallbacks.feeUpdated.push(callback);
    
    return () => {
      this.eventCallbacks.feeUpdated = this.eventCallbacks.feeUpdated.filter(cb => cb !== callback);
    };
  }
} 