// Contract ABI for the PixelPlace contract
export const PIXEL_PLACE_ABI = [
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

// Convert bytes3 color from contract to hex color string
export function bytes3ToHex(bytes3: string): string {
  console.log(`bytes3ToHex input: "${bytes3}" (${typeof bytes3})`);
  
  // Handle special cases for black or empty values
  if (!bytes3 || bytes3 === '0x' || bytes3 === '0x0' || bytes3 === '0x00' || bytes3 === '0x000') {
    console.log(`  → Identified as black, returning #000000`);
    return '#000000'; // Ensure black is properly represented
  }
  
  // Remove '0x' prefix and ensure 6 characters with leading zeros
  const hex = bytes3.startsWith('0x') ? bytes3.substring(2).padStart(6, '0') : bytes3.padStart(6, '0');
  console.log(`  → Processed to: #${hex}`);
  return `#${hex}`;
}

// Convert hex color string to bytes3 format for contract
export function hexToBytes3(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.startsWith('#') ? hexColor.substring(1) : hexColor;
  return `0x${hex}`;
} 