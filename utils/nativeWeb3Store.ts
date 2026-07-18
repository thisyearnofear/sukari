// Native platform version - React Native compatible Web3 configuration
import { create } from 'zustand';
import { ethers } from 'ethers';

// Define types for our Web3 state
interface Web3State {
  provider: ethers.JsonRpcProvider | null;
  signer: ethers.JsonRpcSigner | null;
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  connect: (walletType: 'walletconnect' | 'metamask' | 'other') => Promise<void>;
  disconnect: () => void;
  getSigner: () => ethers.JsonRpcSigner | null;
}

// Create a Web3 store using Zustand
export const useWeb3Store = create<Web3State>((set, get) => ({
  provider: null,
  signer: null,
  address: null,
  chainId: null,
  isConnected: false,

  connect: async (walletType) => {
    try {
      // In a real implementation, this would connect to a mobile wallet
      // For now, we'll simulate a connection
      console.log(`Connecting to ${walletType} wallet...`);

      // Optional: wire @walletconnect/ethereum-provider for real mobile wallets

      // For demo purposes, setting a mock state
      set({
        isConnected: true,
        address: '0x1234567890123456789012345678901234567890', // Mock address
        chainId: 534351, // Mock Scroll Sepolia chain ID
      });
    } catch (error) {
      console.error('Wallet connection failed:', error);
      set({ isConnected: false });
    }
  },

  disconnect: () => {
    set({
      provider: null,
      signer: null,
      address: null,
      chainId: null,
      isConnected: false
    });
  },

  getSigner: () => {
    return get().signer;
  }
}));