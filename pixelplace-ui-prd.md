# Product Requirements Document: PixelPlace Frontend

## 1. Introduction

### 1.1 Purpose

This document outlines the requirements for developing a frontend web application for the PixelPlace smart contract. The frontend will provide an intuitive, performant, and visually appealing interface for users to view and interact with the decentralized, collaborative canvas stored on the Ethereum blockchain.

### 1.2 Product Vision

PixelPlace is a decentralized collaborative canvas inspired by Reddit's r/place and Satoshi's Place, where users can pay a small fee to paint individual pixels. The frontend will bring this experience to life with a modern, responsive interface that showcases the evolving pixel art while providing seamless blockchain interaction.

### 1.3 Key Stakeholders

- End users: Crypto enthusiasts, digital artists, and general web3 users
- Contract owner: Administrator who can update fees and withdraw collected funds
- Developers: Frontend and backend maintenance team

## 2. Technical Specifications

### 2.1 Technology Stack

#### Frontend Framework

- **React.js** with TypeScript for building the application
- **Next.js** for server-side rendering, improved SEO, and optimal performance
- **TailwindCSS** for responsive, utility-first styling
- **Framer Motion** for smooth animations and transitions

#### Web3 Integration

- **ethers.js v6** or **viem** for Ethereum blockchain interaction
- **wagmi** for React hooks for Ethereum
- **ConnectKit** or **RainbowKit** for wallet connection

#### State Management

- **Redux Toolkit** or **Zustand** for application state management
- **React Query** for asynchronous state management and data fetching

#### Hosting & Deployment

- **Vercel** or **Netlify** for hosting and continuous deployment
- **IPFS** integration (optional) for decentralized frontend hosting

### 2.2 Browser & Device Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsiveness (iOS and Android)
- Tablet support
- Desktop optimization

## 3. Smart Contract Integration

### 3.1 Contract Address Management

The application should be configurable to point to different contract addresses based on environment (mainnet, testnet, local development).

```typescript
// Example configuration structure
interface NetworkConfig {
  chainId: number;
  networkName: string;
  contractAddress: string;
  blockExplorerUrl: string;
  rpcUrl: string;
}

const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  // Mainnet
  "1": {
    chainId: 1,
    networkName: "Ethereum Mainnet",
    contractAddress: "0x...", // To be filled after deployment
    blockExplorerUrl: "https://etherscan.io",
    rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}"
  },
  // Sepolia
  "11155111": {
    chainId: 11155111,
    networkName: "Sepolia Testnet",
    contractAddress: "0x...", // To be filled after deployment
    blockExplorerUrl: "https://sepolia.etherscan.io",
    rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}"
  }
};
```

### 3.2 Contract ABI

The frontend needs to interact with the following contract functions:

```typescript
// Contract ABI (partial, for reference)
const PIXEL_PLACE_ABI = [
  // Read functions
  {
    "inputs": [],
    "name": "WIDTH",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "HEIGHT",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pixelFee",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "x", "type": "uint256"},
      {"internalType": "uint256", "name": "y", "type": "uint256"}
    ],
    "name": "getPixelColor",
    "outputs": [{"internalType": "bytes3", "name": "", "type": "bytes3"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "startX", "type": "uint256"},
      {"internalType": "uint256", "name": "startY", "type": "uint256"},
      {"internalType": "uint256", "name": "width", "type": "uint256"},
      {"internalType": "uint256", "name": "height", "type": "uint256"}
    ],
    "name": "getCanvasSection",
    "outputs": [{"internalType": "bytes3[][]", "name": "", "type": "bytes3[][]"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Write functions
  {
    "inputs": [
      {"internalType": "uint256", "name": "x", "type": "uint256"},
      {"internalType": "uint256", "name": "y", "type": "uint256"},
      {"internalType": "bytes3", "name": "color", "type": "bytes3"}
    ],
    "name": "paintPixel",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "x", "type": "uint256"},
      {"indexed": true, "internalType": "uint256", "name": "y", "type": "uint256"},
      {"indexed": false, "internalType": "bytes3", "name": "color", "type": "bytes3"},
      {"indexed": true, "internalType": "address", "name": "painter", "type": "address"}
    ],
    "name": "PixelPainted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": false, "internalType": "uint256", "name": "newFee", "type": "uint256"}
    ],
    "name": "FeeUpdated",
    "type": "event"
  }
];
```

### 3.3 Canvas Data Model

The canvas has fixed dimensions but should be retrieved in sections to manage gas costs:

```typescript
interface CanvasConfig {
  width: number;      // From contract WIDTH constant
  height: number;     // From contract HEIGHT constant
  chunkSize: number;  // Size of sections to fetch at once (e.g., 20x20)
}

interface Pixel {
  x: number;
  y: number;
  color: string;      // Hex format: "#RRGGBB"
  lastPainted?: number; // Timestamp of last update (optional)
}

type CanvasChunk = Pixel[][];
```

### 3.4 Event Handling

The frontend should listen for blockchain events to update the canvas in real-time:

```typescript
// PixelPainted event structure
interface PixelPaintedEvent {
  x: number;
  y: number;
  color: string; // Bytes3 converted to hex format
  painter: string; // Ethereum address
}

// FeeUpdated event structure
interface FeeUpdatedEvent {
  newFee: bigint; // Wei amount
}
```

## 4. User Interface & Experience

### 4.1 Key Screens and Components

#### 4.1.1 Main Canvas View

- Zoomable, pannable canvas showing the current state of all pixels
- Grid overlay (toggleable) showing pixel boundaries
- Current coordinates display as user hovers over canvas
- Pixel information on hover (color, last modified time if available)
- Minimap for navigation on large canvases

#### 4.1.2 Control Panel

- Color picker with preset palette and custom color options
- Current pixel fee display (in ETH and USD equivalent)
- Selected coordinates display
- Wallet connection button/status
- User account information (connected address, ETH balance)

#### 4.1.3 Historical View (Optional)

- Timeline slider to view canvas state at previous points in time
- Timelapse animation of canvas evolution

#### 4.1.4 Community Features

- Recently painted pixels feed
- Active painters leaderboard
- Social sharing functionality

### 4.2 Design Language

- Clean, minimalist interface with focus on the canvas
- Dark mode and light mode support
- High contrast for accessibility
- Consistent color scheme and typography
- Subtle animations for interactions

### 4.3 Wireframes

Include wireframes for key screens (not produced in this PRD, but should be created during design phase).

## 5. Feature Requirements

### 5.1 Core Features

#### 5.1.1 Canvas Interaction

- **View Canvas**: Display the full 100x100 pixel canvas with appropriate rendering optimizations
- **Zoom/Pan**: Allow users to zoom in/out and pan across the canvas
- **Select Pixel**: Enable users to select individual pixels for painting
- **Color Selection**: Provide a color picker with preset palette and custom color input

#### 5.1.2 Painting Functionality

- **Paint Pixel**: Allow users to submit transactions to paint selected pixels
- **Fee Display**: Clearly show the current fee required to paint a pixel
- **Transaction Status**: Display progress and confirmation of painting transactions
- **Error Handling**: Clear error messages for transaction failures

#### 5.1.3 Wallet Integration

- **Connect Wallet**: Support multiple wallet providers (MetaMask, WalletConnect, Coinbase Wallet)
- **Network Detection**: Verify and prompt to switch to the correct network
- **Transaction Signing**: Streamlined flow for signing and sending transactions
- **Account Display**: Show connected account and relevant balance information

#### 5.1.4 Canvas Updates

- **Real-time Updates**: Listen for blockchain events to update the canvas without refreshing
- **Optimistic Updates**: Temporarily show user's changes while waiting for confirmation
- **Canvas Chunking**: Load the canvas in sections to improve performance

### 5.2 Enhanced Features

#### 5.2.1 User Tools

- **Pixel History**: View the history of a specific pixel (who painted it and when)
- **Canvas Export**: Allow users to save/export the current canvas state as an image
- **Custom View Sharing**: Generate shareable links to specific canvas coordinates and zoom levels

#### 5.2.2 Social Features

- **Activity Feed**: Display recent pixel updates with painter addresses
- **Heatmap View**: Visualization of most actively painted areas
- **Collaborative Tools**: Optional features for group coordination

#### 5.2.3 Analytics

- **Statistics Dashboard**: Show total pixels painted, unique painters, etc.
- **Personal Stats**: Display user's contribution to the canvas
- **Gas Price Estimator**: Help users understand and optimize transaction costs

## 6. User Flows

### 6.1 First-time User Flow

1. User visits the PixelPlace website
2. Landing page explains the concept and shows the current canvas state
3. User connects wallet (if they want to participate)
4. Tutorial overlay explains how to navigate and paint pixels
5. User selects a pixel and color
6. Fee information and confirmation appears
7. User confirms and signs transaction
8. Feedback provided during transaction processing
9. Canvas updates with the user's pixel

### 6.2 Returning User Flow

1. User visits the PixelPlace website
2. Canvas loads with latest state
3. Wallet connects automatically (if previously connected)
4. User can immediately start navigating and painting

### 6.3 Pixel Painting Flow

1. User navigates to desired location on canvas
2. User selects a pixel (coordinates displayed)
3. User selects a color from palette or custom input
4. Preview shows how the pixel will look
5. User clicks "Paint" button
6. Confirmation dialog shows fee and transaction details
7. User confirms and signs the transaction
8. Loading indicator shows transaction progress
9. Success notification appears when transaction is confirmed
10. Canvas updates with the new pixel color

## 7. Technical Implementation Details

### 7.1 Canvas Rendering

The canvas should be rendered efficiently using one of the following approaches:

#### 7.1.1 Canvas API Approach

```typescript
function renderCanvas(ctx: CanvasRenderingContext2D, pixels: Pixel[][], scale: number) {
  // Clear canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Render each pixel
  for (let y = 0; y < pixels.length; y++) {
    for (let x = 0; x < pixels[y].length; x++) {
      const pixel = pixels[y][x];
      ctx.fillStyle = pixel.color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  
  // Optionally draw grid
  if (showGrid && scale > 4) {
    ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
    ctx.lineWidth = 0.5;
    // Draw grid lines...
  }
}
```

#### 7.1.2 WebGL Approach (for better performance)

- Implement using Three.js or PixiJS for hardware-accelerated rendering
- Use texture-based approach for large canvas sizes
- Implement instanced rendering for identical pixels

### 7.2 Data Fetching Strategy

#### 7.2.1 Initial Load

1. Fetch canvas dimensions from contract (WIDTH, HEIGHT)
2. Fetch current pixel fee from contract
3. Divide canvas into chunks based on visible area and performance considerations
4. Load visible chunks first, then preload adjacent chunks

#### 7.2.2 Chunked Loading

```typescript
// Example function to fetch a canvas chunk
async function fetchCanvasChunk(
  contract: Contract,
  startX: number,
  startY: number,
  width: number,
  height: number
): Promise<CanvasChunk> {
  // Check bounds
  const canvasWidth = await contract.WIDTH();
  const canvasHeight = await contract.HEIGHT();
  
  // Ensure dimensions are within bounds
  const adjustedWidth = Math.min(width, canvasWidth - startX);
  const adjustedHeight = Math.min(height, canvasHeight - startY);
  
  // Fetch data from contract
  const rawChunkData = await contract.getCanvasSection(
    startX,
    startY,
    adjustedWidth,
    adjustedHeight
  );
  
  // Process data into our format
  return rawChunkData.map((row, y) => 
    row.map((color, x) => ({
      x: startX + x,
      y: startY + y,
      color: bytes3ToHex(color)
    }))
  );
}

// Convert bytes3 to hex color string
function bytes3ToHex(bytes3: string): string {
  // Remove '0x' prefix and ensure 6 characters with leading zeros
  const hex = bytes3.substring(2).padStart(6, '0');
  return `#${hex}`;
}
```

#### 7.2.3 Event Listening

```typescript
function setupEventListeners(contract: Contract) {
  // Listen for PixelPainted events
  contract.on("PixelPainted", (x, y, color, painter) => {
    // Update canvas state
    updatePixel(x, y, bytes3ToHex(color));
    
    // Add to activity feed
    addToActivityFeed({
      x,
      y,
      color: bytes3ToHex(color),
      painter,
      timestamp: Date.now()
    });
  });
  
  // Listen for FeeUpdated events
  contract.on("FeeUpdated", (newFee) => {
    updatePixelFee(newFee);
  });
}
```

### 7.3 Paint Transaction Flow

```typescript
// Example function to paint a pixel
async function paintPixel(
  contract: Contract, 
  x: number, 
  y: number, 
  color: string, 
  fee: bigint
): Promise<TransactionResult> {
  try {
    // Convert hex color to bytes3
    const bytes3Color = hexToBytes3(color);
    
    // Check if user has sufficient balance
    const signer = contract.signer;
    const balance = await signer.getBalance();
    
    if (balance < fee) {
      throw new Error("Insufficient balance to pay fee");
    }
    
    // Send transaction
    const tx = await contract.paintPixel(x, y, bytes3Color, {
      value: fee
    });
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.transactionHash
    };
  } catch (error) {
    console.error("Error painting pixel:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Convert hex color to bytes3
function hexToBytes3(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.startsWith('#') ? hexColor.substring(1) : hexColor;
  return `0x${hex}`;
}
```

## 8. Performance Optimization

### 8.1 Canvas Rendering Optimizations

- Implement virtual scrolling/rendering for the canvas
- Only render visible portions of the canvas
- Use appropriate level of detail based on zoom level
- Cache rendered chunks to minimize redraws
- Use offscreen canvas for processing when appropriate
- Consider using Web Workers for heavy computations

### 8.2 Network Optimizations

- Implement smart caching of canvas data
- Use local storage to persist canvas between sessions
- Batch update requests when possible
- Implement service workers for offline support
- Use CDN for static assets

### 8.3 Transaction Optimizations

- Bundle multiple pixel updates if contract supports it
- Provide gas estimation before transactions
- Optimize transaction timing based on network conditions

## 9. Extensibility

### 9.1 Configuration System

All key parameters should be configurable without code changes:

```typescript
interface AppConfig {
  // Canvas settings
  canvas: {
    defaultWidth: number;
    defaultHeight: number;
    chunkSize: number;
    defaultColor: string;
    maxViewportScale: number;
    minViewportScale: number;
  };
  
  // Network settings
  network: {
    supportedNetworks: number[];
    defaultNetworkId: number;
    networks: Record<string, NetworkConfig>;
  };
  
  // UI settings
  ui: {
    colorPalette: string[];
    defaultTheme: 'light' | 'dark';
    maxActivityFeedItems: number;
    transactionTimeoutSeconds: number;
  };
  
  // Feature flags
  features: {
    enableHistoricalView: boolean;
    enableExport: boolean;
    enableSocialFeatures: boolean;
    enableHeatmap: boolean;
  };
}
```

### 9.2 Plugin Architecture

- Implement a plugin system for extending functionality
- Support third-party integrations through standardized interfaces
- Provide hooks for UI extension points

### 9.3 API Layer

Create a clean separation between the smart contract interaction and the UI:

```typescript
// Canvas Service API interface
interface CanvasService {
  // Canvas data methods
  getDimensions(): Promise<{width: number, height: number}>;
  getPixelColor(x: number, y: number): Promise<string>;
  getCanvasSection(startX: number, startY: number, width: number, height: number): Promise<CanvasChunk>;
  
  // Transaction methods
  getCurrentFee(): Promise<{wei: bigint, eth: string, usd: number}>;
  paintPixel(x: number, y: number, color: string): Promise<TransactionResult>;
  
  // Event subscriptions
  onPixelPainted(callback: (event: PixelPaintedEvent) => void): () => void;
  onFeeUpdated(callback: (event: FeeUpdatedEvent) => void): () => void;
}
```

## 10. Deployment and DevOps

### 10.1 Environment Configuration

- Development: Local testnet (Hardhat)
- Staging: Public testnet (Sepolia)
- Production: Ethereum mainnet

### 10.2 Build Pipeline

- Automated testing for UI components and contract interactions
- CI/CD pipeline for continuous deployment
- Environment-specific configuration injection

### 10.3 Monitoring

- Error tracking (Sentry)
- Analytics for usage patterns
- Performance monitoring for rendering and transactions

## 11. Future Enhancements

### 11.1 Multi-chain Support

- Support for deployment on multiple blockchains (L2s, sidechains)
- Chain-switching interface for users

### 11.2 Enhanced Social Features

- Collaborative drawing tools
- Community challenges and events
- User profiles and achievements

### 11.3 Advanced Rendering

- 3D visualization of the canvas
- Timelapse generation of canvas evolution
- AR/VR viewing experiences

## 12. Appendix

### 12.1 Complete Smart Contract Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title PixelPlace
 * @dev A decentralized canvas on Ethereum where users can paint pixels for a fee
 */
contract PixelPlace {
    // Canvas dimensions
    uint256 public constant WIDTH = 100;
    uint256 public constant HEIGHT = 100;

    // Fee to paint a pixel (in wei)
    uint256 public pixelFee;

    // Events
    event PixelPainted(uint256 indexed x, uint256 indexed y, bytes3 color, address indexed painter);
    event FeeUpdated(uint256 newFee);

    /**
     * @dev Paint a pixel at coordinates (x, y) with the specified color
     * @param x The x-coordinate of the pixel (0 to WIDTH-1)
     * @param y The y-coordinate of the pixel (0 to HEIGHT-1)
     * @param color The RGB color to paint (as bytes3)
     */
    function paintPixel(uint256 x, uint256 y, bytes3 color) external payable;

    /**
     * @dev Get the color of a specific pixel
     * @param x The x-coordinate of the pixel
     * @param y The y-coordinate of the pixel
     * @return The RGB color of the pixel (defaults to white if never painted)
     */
    function getPixelColor(uint256 x, uint256 y) external view returns (bytes3);

    /**
     * @dev Get a section of the canvas
     * @param startX The starting x-coordinate
     * @param startY The starting y-coordinate
     * @param width The width of the section to retrieve
     * @param height The height of the section to retrieve
     * @return A 2D array of pixel colors
     */
    function getCanvasSection(
        uint256 startX,
        uint256 startY,
        uint256 width,
        uint256 height
    ) external view returns (bytes3[][] memory);
}
```

### 12.2 Key Terms and Definitions

- **Pixel**: The smallest unit on the canvas, represented by x,y coordinates and an RGB color.
- **Canvas**: The full grid of pixels (100x100 in the current implementation).
- **Chunk**: A section of the canvas loaded as a unit (e.g., 20x20 pixels).
- **Fee**: The amount of ETH required to paint a pixel.
- **Painter**: A user who has painted at least one pixel on the canvas.

### 12.3 Accessibility Requirements

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast considerations
- Alternative input methods

## 13. Change Log

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | YYYY-MM-DD | Initial PRD |
