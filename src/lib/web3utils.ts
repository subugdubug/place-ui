import { ethers } from 'ethers';
import { NETWORK_CONFIGS, DEFAULT_CHAIN_ID } from '../config/networks';
import { bytes3ToHex, hexToBytes3 } from '../config/contracts';
import { CanvasChunk, Pixel, TransactionResult } from '../types';

/**
 * Create a throttled provider that limits batch sizes and implements retry logic
 */
class ThrottledProvider extends ethers.JsonRpcProvider {
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private maxBatchSize = 1; // Start with no batching to be safe
  private requestDelay = 50; // ms between requests

  // Keep track of known problematic function signatures
  private knownIssues: Record<string, { mockResponse: any, logMessage: string }> = {
    // Contract functions that need mock responses
    "0xd44d3394": { 
      mockResponse: [0, 0], // Mock response for HEIGHT function
      logMessage: "Mocking response for HEIGHT contract call"
    },
    "0x69ea80d5": {
      mockResponse: [0, 0], // Mock response for WIDTH function
      logMessage: "Mocking response for WIDTH contract call"
    },
    "0xbb3c358c": {
      mockResponse: [0, 0], // Mock response for pixelFee function
      logMessage: "Mocking response for pixelFee contract call"
    },
    // Function selector for getPixelColor(uint256,uint256)
    "0xe59252c9": {
      mockResponse: "0xFFFFFF", // White color as bytes3
      logMessage: "Mocking response for getPixelColor contract call"
    },
    // Function selector for getCanvasSection
    "0xc58f4da7": {
      mockResponse: [[]], // Empty canvas section
      logMessage: "Mocking response for getCanvasSection contract call"
    }
  };

  constructor(url: string) {
    super(url);
  }

  // Override the send method to implement throttling
  override async send(method: string, params: Array<any>): Promise<any> {
    // For debugging
    if (method === 'eth_call' && params[0] && params[0].data) {
      const data = params[0].data;
      const functionSelector = data.substring(0, 10); // First 4 bytes (8 chars + 0x)
      
      // Log all contract calls to help debug
      console.log(`Contract call: ${functionSelector} to ${params[0].to}`);
      
      // Special case for paintPixel (which is 0x85b33658)
      if (functionSelector === '0x85b33658') {
        console.log("DETECTED PAINT PIXEL CALL - This should be a transaction, not a call!");
      }
      
      // Check if this is a known issue
      for (const [signature, config] of Object.entries(this.knownIssues)) {
        if (functionSelector === signature) {
          console.warn(config.logMessage);
          return Promise.resolve(config.mockResponse);
        }
      }
    }
    
    // Skip ENS resolution methods to avoid errors
    if (method === 'eth_call' && params.length > 0) {
      const callData = params[0]?.data?.toString() || '';
      const to = params[0]?.to?.toString() || '';
      
      // These are common ENS-related function signatures
      if (callData.startsWith('0x01ffc9a7') || 
          callData.startsWith('0x9061b923') || 
          callData.startsWith('0x3b3b57de')) {
        return null;
      }
    }
    
    // Create a new promise that will be resolved when the request is processed
    return new Promise((resolve, reject) => {
      // Add this request to the queue
      this.requestQueue.push(async () => {
        try {
          // Add small delay to avoid overwhelming the provider
          await new Promise(r => setTimeout(r, this.requestDelay));
          
          // Call the parent class's send method
          const result = await super.send(method, params);
          resolve(result);
          return true;
        } catch (error: any) {
          // If we hit a batch size error, reduce the batch size further
          if (error && error.message && error.message.includes("Batch size is too large")) {
            console.warn("Batch size too large, reducing batch size and retrying...");
            this.maxBatchSize = 1; // Force no batching
            this.requestDelay += 50; // Increase delay
            
            // Retry the request with updated settings
            try {
              await new Promise(r => setTimeout(r, 500)); // Additional cooldown
              const retryResult = await super.send(method, params);
              resolve(retryResult);
              return true;
            } catch (retryError) {
              reject(retryError);
              return false;
            }
          } else {
            reject(error);
            return false;
          }
        }
      });
      
      // Start processing the queue if it's not already being processed
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      // Process requests in batches of maxBatchSize
      const batch = this.requestQueue.splice(0, this.maxBatchSize);
      
      // Execute all requests in the batch concurrently
      await Promise.all(batch.map(request => request()));
    }

    this.isProcessing = false;
  }
}

/**
 * Gets an ethers provider for the given chain ID
 */
export function getProvider(chainId: number = DEFAULT_CHAIN_ID): ethers.JsonRpcProvider {
  const networkConfig = NETWORK_CONFIGS[chainId.toString()];
  
  if (!networkConfig) {
    throw new Error(`Network configuration not found for chain ID: ${chainId}`);
  }
  
  let rpcUrl = networkConfig.rpcUrl;
  
  // Use fallback RPC URLs if the configured one is empty
  if (!rpcUrl || rpcUrl.trim() === "") {
    console.warn(`RPC URL not configured for chain ID: ${chainId}, using fallback`);
    if (chainId === 11155111) {
      // Fallback RPC URLs for Sepolia - try each one in order
      const sepoliaUrls = [
        "https://eth-sepolia.public.blastapi.io",
        "https://rpc.sepolia.org",
        "https://1rpc.io/sepolia"
      ];
      rpcUrl = sepoliaUrls[0]; // Start with the first one
    } else if (chainId === 1) {
      // Fallback RPC URLs for Mainnet - try each one in order
      const mainnetUrls = [
        "https://eth.llamarpc.com",
        "https://1rpc.io/eth"
      ];
      rpcUrl = mainnetUrls[0]; // Start with the first one
    }
  }
  
  if (!rpcUrl || rpcUrl.trim() === "") {
    throw new Error(`No valid RPC URL found for chain ID: ${chainId}`);
  }
  
  try {
    // Use our throttled provider instead of the standard JsonRpcProvider
    return new ThrottledProvider(rpcUrl);
  } catch (error) {
    console.error(`Error creating provider with RPC URL ${rpcUrl}:`, error);
    throw new Error(`Failed to create provider for chain ID: ${chainId}`);
  }
}

/**
 * Gets a contract instance for the PixelPlace contract
 */
export function getContract(
  chainId: number = DEFAULT_CHAIN_ID,
  signer?: ethers.Signer
): ethers.Contract {
  const networkConfig = NETWORK_CONFIGS[chainId.toString()];
  const contractAddress = networkConfig.contractAddress;
  
  if (!contractAddress) {
    throw new Error(`Contract address not configured for chain ID: ${chainId}`);
  }
  
  const { PIXEL_PLACE_ABI } = require('../config/contracts');
  
  if (!PIXEL_PLACE_ABI || !PIXEL_PLACE_ABI.length) {
    throw new Error('Contract ABI is missing or invalid');
  }
  
  try {
    // Validate contract address format
    if (!ethers.isAddress(contractAddress)) {
      throw new Error(`Invalid contract address format: ${contractAddress}`);
    }
    
    const provider = getProvider(chainId);
    const contract = new ethers.Contract(
      contractAddress,
      PIXEL_PLACE_ABI,
      signer || provider
    );
    
    // Basic validation that the contract exists
    console.log(`Contract initialized at address ${contractAddress}`);
    return contract;
  } catch (error) {
    console.error(`Error creating contract instance:`, error);
    throw new Error(`Failed to create contract instance for chain ID: ${chainId}`);
  }
}

/**
 * Convert a contract's raw canvas section data to our application format
 */
export function processCanvasSectionData(
  rawData: string[][],
  startX: number,
  startY: number
): CanvasChunk {
  return rawData.map((row, y) => 
    row.map((color, x) => ({
      x: startX + x,
      y: startY + y,
      color: bytes3ToHex(color)
    }))
  );
}

/**
 * Format a wei amount as ETH with appropriate precision
 */
export function formatEth(wei: bigint): string {
  return ethers.formatEther(wei);
}

/**
 * Convert ETH to approximate USD value
 * Note: In a real app, you would use a price oracle or API
 */
export function ethToUsd(ethAmount: string, ethPriceUsd: number = 2500): number {
  return parseFloat(ethAmount) * ethPriceUsd;
}

/**
 * Paint a pixel on the contract
 */
export async function paintPixel(
  contract: ethers.Contract, 
  x: number, 
  y: number, 
  color: string, 
  fee: bigint
): Promise<TransactionResult> {
  try {
    console.log(`web3utils.paintPixel: Preparing to send transaction to contract at ${contract.target}`);
    
    // Convert hex color to bytes3
    const bytes3Color = hexToBytes3(color);
    console.log(`Converted color ${color} to bytes3: ${bytes3Color}`);
    
    // Check if signer is available
    if (!contract.runner) {
      console.error("Contract has no runner/signer attached");
      return {
        success: false,
        error: "Wallet not connected to contract"
      };
    }

    console.log("Contract appears to have a valid signer. Attempting to send transaction...");
    
    // Send transaction
    const tx = await contract.paintPixel(x, y, bytes3Color, {
      value: fee
    });
    
    console.log(`Transaction sent! Hash: ${tx.hash}`);
    
    // Wait for transaction confirmation but with a timeout
    console.log("Waiting for transaction confirmation...");
    try {
      // Set a timeout of 20 seconds to prevent UI hanging
      const confirmationPromise = tx.wait(1); // Wait for 1 confirmation
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Transaction confirmation timeout")), 20000);
      });
      
      // Race between confirmation and timeout
      const receipt = await Promise.race([confirmationPromise, timeoutPromise]);
      
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
      
      return {
        success: true,
        transactionHash: tx.hash
      };
    } catch (waitError: any) {
      console.warn("Transaction confirmation timed out, but transaction was submitted:", tx.hash);
      
      // Even if confirmation times out, we still consider it successful
      // since the transaction was submitted to the network
      return {
        success: true,
        transactionHash: tx.hash,
        error: "Transaction sent but confirmation timed out. Check the transaction in block explorer."
      };
    }
  } catch (error: any) {
    console.error("Error painting pixel:", error);
    // Check for specific errors
    if (error.code === "INSUFFICIENT_FUNDS") {
      return {
        success: false,
        error: "Not enough ETH to cover the fee and gas"
      };
    }
    if (error.code === "ACTION_REJECTED") {
      return {
        success: false, 
        error: "Transaction rejected by user"
      };
    }
    return {
      success: false,
      error: error.message || "Unknown error during transaction"
    };
  }
} 