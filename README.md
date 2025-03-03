# PixelPlace Frontend

A decentralized collaborative canvas on Ethereum where users can pay a small fee to paint individual pixels.

## Overview

PixelPlace is a web application that interfaces with a smart contract on the Ethereum blockchain. It allows users to view and interact with a collaborative canvas where each pixel can be painted by paying a small fee.

## Features

- Interactive canvas with zoom and pan functionality
- Real-time updates when pixels are painted
- Wallet integration for Ethereum transactions
- Color picker for selecting pixel colors
- Activity feed showing recent pixel updates
- Responsive design for all screen sizes

## Technology Stack

- **Frontend Framework**: React.js with TypeScript
- **UI Framework**: Next.js
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **Web3 Integration**: ethers.js v6
- **Wallet Connection**: RainbowKit
- **State Management**: Zustand
- **Data Fetching**: React Query

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- MetaMask or another Ethereum wallet

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/pixelplace-frontend.git
   cd pixelplace-frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:

   ```bash
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_WALLETCONNECT_PROJECT_ID
   NEXT_PUBLIC_DEFAULT_CHAIN_ID=11155111
   NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_ID
   NEXT_PUBLIC_MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_ID
   ```

4. Update the contract addresses in `src/config/networks.ts` with your deployed contract addresses.

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Smart Contract Integration

The frontend interacts with a PixelPlace smart contract that has the following main functions:

- `getPixelColor(x, y)`: Get the color of a specific pixel
- `getCanvasSection(startX, startY, width, height)`: Get a section of the canvas
- `paintPixel(x, y, color)`: Paint a pixel with a specific color (requires payment)

The contract also emits events that the frontend listens to for real-time updates:

- `PixelPainted`: Emitted when a pixel is painted
- `FeeUpdated`: Emitted when the pixel fee is updated

## Deployment

The application can be deployed to Vercel, Netlify, or any other hosting service that supports Next.js applications.

```bash
npm run build
npm run start
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Inspired by Reddit's r/place and Satoshi's Place
- Built with Next.js, TailwindCSS, and ethers.js
