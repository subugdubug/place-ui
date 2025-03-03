// Canvas data types
export interface CanvasConfig {
  width: number;
  height: number;
  chunkSize: number;
  defaultColor: string;
}

export interface Pixel {
  x: number;
  y: number;
  color: string; // Hex format: "#RRGGBB"
  lastPainted?: number; // Timestamp of last update (optional)
}

export type CanvasChunk = Pixel[][];

// Event types
export interface PixelPaintedEvent {
  x: number;
  y: number;
  color: string; // Hex format
  painter: string; // Ethereum address
  timestamp?: number; // Optional, may be derived from block
}

export interface FeeUpdatedEvent {
  newFee: bigint; // Wei amount
}

// Transaction types
export interface TransactionResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

// Canvas service interface
export interface CanvasService {
  // Canvas data methods
  getDimensions(): Promise<{width: number, height: number}>;
  getPixelColor(x: number, y: number): Promise<string>;
  getCanvasSection(startX: number, startY: number, width: number, height: number): Promise<CanvasChunk>;
  
  // Transaction methods
  getCurrentFee(): Promise<{wei: bigint, eth: string, usd: number}>;
  paintPixel(x: number, y: number, color: string): Promise<TransactionResult>;
  
  // Wallet integration
  updateSigner?(signer: any): void;
  
  // Event subscriptions
  onPixelPainted(callback: (event: PixelPaintedEvent) => void): () => void;
  onFeeUpdated(callback: (event: FeeUpdatedEvent) => void): () => void;
}

// UI state types
export interface ViewportState {
  scale: number;
  offsetX: number;
  offsetY: number;
  selectedX: number | null;
  selectedY: number | null;
}

export interface ActivityItem extends PixelPaintedEvent {
  id: string; // Unique identifier
}

export interface AppState {
  currentColor: string;
  activity: ActivityItem[];
  showGrid: boolean;
  isColorPickerOpen: boolean;
}

// Configuration types
export interface AppConfig {
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