export interface NetworkConfig {
  chainId: number;
  networkName: string;
  contractAddress: string;
  blockExplorerUrl: string;
  rpcUrl: string;
}

export const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  // Mainnet
  "1": {
    chainId: 1,
    networkName: "Ethereum Mainnet",
    contractAddress: "", // To be filled after deployment
    blockExplorerUrl: "https://etherscan.io",
    rpcUrl: process.env.NEXT_PUBLIC_MAINNET_RPC_URL || "",
  },
  // Sepolia
  "11155111": {
    chainId: 11155111,
    networkName: "Sepolia Testnet",
    contractAddress: "0x98cb468f12e856FAf2320e2B3d2969B97d59Eb91", // To be filled after deployment
    blockExplorerUrl: "https://sepolia.etherscan.io",
    rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "",
  },
  // Local development
  "31337": {
    chainId: 31337,
    networkName: "Localhost",
    contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Default Hardhat deployment address
    blockExplorerUrl: "",
    rpcUrl: "http://localhost:8545",
  }
};

export const DEFAULT_CHAIN_ID = process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID 
  ? parseInt(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID) 
  : 11155111; // Sepolia as default

export const SUPPORTED_CHAIN_IDS = Object.values(NETWORK_CONFIGS).map(
  config => config.chainId
); 