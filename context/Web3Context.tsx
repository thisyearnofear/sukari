import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { useWeb3Store } from '@/utils/nativeWeb3Store';

// Define the context type - without direct ethers types for React Native compatibility
interface Web3ContextType {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  provider: any | null; // Using 'any' for React Native compatibility
  signer: any | null;   // Using 'any' for React Native compatibility
}

// Create the context
const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// Provider component
export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<any | null>(null); // Using 'any' for compatibility
  const [signer, setSigner] = useState<any | null>(null);     // Using 'any' for compatibility

  // For native platforms, we'll use our Zustand store
  const nativeStore = useWeb3Store();

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Web-specific logic that imports ethers dynamically
      const initializeWeb3 = async () => {
        try {
          // Dynamically import ethers only on web
          const ethersModule = await import('ethers');
          const { BrowserProvider } = ethersModule;

          // Check if user is already connected
          if (typeof window !== 'undefined' && (window as any).ethereum) {
            try {
              const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
              if (accounts.length > 0) {
                const web3Provider = new BrowserProvider((window as any).ethereum);
                const webSigner = await web3Provider.getSigner();

                setIsConnected(true);
                setAddress(await webSigner.getAddress());
                setProvider(web3Provider);
                setSigner(webSigner);

                // Get chain ID
                const network = await web3Provider.getNetwork();
                setChainId(Number(network.chainId));
              }
            } catch (reqError) {
              console.warn('Silent Web3 initialization failed:', reqError);
            }
          }
        } catch (error) {
          console.error('Error initializing Web3 on web:', error);
        }
      };

      initializeWeb3();
    } else {
      // Native-specific logic - sync with Zustand store
      setIsConnected(nativeStore.isConnected);
      setAddress(nativeStore.address);
      setChainId(nativeStore.chainId);
    }
  }, []);

  const connectWallet = async () => {
    if (Platform.OS === 'web') {
      try {
        // Dynamically import ethers only on web
        const ethersModule = await import('ethers');
        const { BrowserProvider } = ethersModule;

        // Web wallet connection
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          const accounts = await (window as any).ethereum.request({
            method: 'eth_requestAccounts',
          });

          if (accounts.length > 0) {
            const web3Provider = new BrowserProvider((window as any).ethereum);
            const webSigner = await web3Provider.getSigner();

            setIsConnected(true);
            setAddress(accounts[0]);
            setProvider(web3Provider);
            setSigner(webSigner);

            // Get chain ID
            const network = await web3Provider.getNetwork();
            setChainId(Number(network.chainId));
          }
        } else {
          throw new Error('Please install MetaMask or another Web3 wallet extension');
        }
      } catch (error) {
        console.error('Error connecting wallet on web:', error);
        throw error;
      }
    } else {
      // Native wallet connection using our Zustand store
      try {
        // This will trigger the actual wallet connection via the Zustand store
        await nativeStore.connect('walletconnect');

        // Update local state based on store
        setIsConnected(nativeStore.isConnected);
        setAddress(nativeStore.address);
        setChainId(nativeStore.chainId);
      } catch (error) {
        console.error('Error connecting wallet on native:', error);
        throw error;
      }
    }
  };

  const disconnectWallet = () => {
    if (Platform.OS === 'web') {
      // Web wallet disconnection
      setIsConnected(false);
      setAddress(null);
      setChainId(null);
      setProvider(null);
      setSigner(null);
    } else {
      // Native wallet disconnection
      nativeStore.disconnect();

      setIsConnected(false);
      setAddress(null);
      setChainId(null);
      setProvider(null);
      setSigner(null);
    }
  };

  const value = {
    isConnected,
    address,
    chainId,
    connectWallet,
    disconnectWallet,
    provider,
    signer,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

// Custom hook to use the Web3 context
export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};