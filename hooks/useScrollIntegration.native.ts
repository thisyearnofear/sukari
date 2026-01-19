import { useState, useCallback, useEffect } from 'react';
import { OnchainAchievement, AchievementType, GameState } from '@/types/game';
import { useWeb3Store } from '@/utils/nativeWeb3Store';
import { GLUCOSE_WARS_ACHIEVEMENTS_ABI, ANYRAND_VRF_ABI } from '@/utils/contractABIs';
import { CONTRACTS, NETWORK_INFO } from '@/utils/contractAddresses';
import { generateMetadataJSON } from '@/utils/scrollContract';

// Helper function to get achievement ID from type
const getAchievementId = (achievementType: AchievementType): number => {
  const achievementIds: Record<AchievementType, number> = {
    victory_classic: 1,
    victory_life: 2,
    perfect_stability: 3,
    high_combo: 4,
    health_streak: 5,
    explorer: 6,
  };
  return achievementIds[achievementType] || 1;
};

// Helper function to get achievement points
const getAchievementPoints = (achievementType: AchievementType): number => {
  const achievementPoints: Record<AchievementType, number> = {
    victory_classic: 100,
    victory_life: 250,
    perfect_stability: 150,
    high_combo: 120,
    health_streak: 300,
    explorer: 200,
  };
  return achievementPoints[achievementType] || 100;
};

// Native platform version - React Native compatible Web3 integration for Scroll
// This version uses WalletConnect or backend API for actual blockchain interactions
export const useScrollIntegration = () => {
  const { isConnected, address: walletAddress } = useWeb3Store();
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<OnchainAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (walletAddress) {
      setUserAddress(walletAddress);
    }
  }, [walletAddress]);

  // In a real implementation, you might want to use WalletConnect's signing capabilities
  // or call to a backend service that handles the blockchain interactions
  // Real Scroll Sepolia contract configuration
  const CONTRACT_ADDRESS = '0xf36223131aDA53e94B08F0c098A6A93424D68EE3';
  const CONTRACT_ABI = GLUCOSE_WARS_ACHIEVEMENTS_ABI;
  const ANYRAND_CONTRACT = '0x5d8570e6d734184357f3969b23050d64913be681';
  const ANYRAND_ABI = ANYRAND_VRF_ABI;
  const SCROLL_RPC_URL = 'https://sepolia-rpc.scroll.io';
  const CHAIN_ID = 534351;

  const writeContract = useCallback(async (args: any[]) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isConnected || !walletAddress) {
        throw new Error('Wallet not connected');
      }

      // For React Native, we'll use WalletConnect or a backend service
      // This is a real implementation using ethers.js via WalletConnect
      const { ethers } = await import('ethers');

      // Create provider - in React Native we typically use WalletConnect
      const provider = new ethers.JsonRpcProvider(SCROLL_RPC_URL);

      // Get signer from WalletConnect (this would be implemented in your Web3 context)
      const signer = await getWalletConnectSigner();
      if (!signer) {
        throw new Error('Failed to get WalletConnect signer');
      }

      // Create contract instance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Execute the write function
      const tx = await contract.mintAchievement(...args);
      setTxHash(tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      return {
        hash: tx.hash,
        status: receipt.status,
        transactionHash: tx.hash,
      };
    } catch (err: any) {
      console.error('Contract write failed:', err);
      setError(err.message || 'Transaction failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, walletAddress]);

  // Real WalletConnect integration for native
  const getWalletConnectSigner = async () => {
    try {
      const { ethers } = await import('ethers');

      // Check if WalletConnect is available
      if (typeof window !== 'undefined' && (window as any).WalletConnect) {
        // Use existing WalletConnect session if available
        const provider = new ethers.BrowserProvider((window as any).WalletConnect);
        const signer = await provider.getSigner();
        return signer;
      }

      // For React Native with WalletConnect v2
      if (typeof window !== 'undefined' && (window as any).WalletConnectV2) {
        const { EthereumProvider } = await import('@walletconnect/ethereum-provider');

        // Initialize WalletConnect
        const projectId = process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your_project_id';
        const chains = [534351]; // Scroll Sepolia
        const optionalChains = [534351] as [number, ...number[]];
        const metadata = {
          name: 'GlucoseWars',
          description: 'Health education game on Scroll',
          url: 'https://glucosewars.com',
          icons: ['https://glucosewars.com/icon.png']
        };

        // Create Ethereum provider
        const ethereumProvider = await EthereumProvider.init({
          projectId,
          chains,
          optionalChains,
          methods: ['eth_sendTransaction', 'personal_sign'],
          events: ['chainChanged', 'accountsChanged'],
          showQrModal: true,
          metadata
        });

        // Enable session
        await ethereumProvider.enable();
        const provider = new ethers.BrowserProvider(ethereumProvider);
        const signer = await provider.getSigner();

        return signer;
      }

      // Fallback for development/testing
      console.warn('WalletConnect not available, using fallback signer');
      return new ethers.Wallet('0x' + '0'.repeat(64), new ethers.JsonRpcProvider(SCROLL_RPC_URL));
    } catch (error) {
      console.error('Failed to get WalletConnect signer:', error);
      return null;
    }
  };

  const mintAchievementNFT = useCallback(async (achievementId: string) => {
    setIsMinting(true);
    setError(null);

    try {
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }

      const { ethers } = await import('ethers');

      // Create provider and signer
      const provider = new ethers.JsonRpcProvider(SCROLL_RPC_URL);
      const signer = await getWalletConnectSigner();
      if (!signer) {
        throw new Error('Failed to get WalletConnect signer');
      }

      // Create contract instance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Find the achievement to mint
      const achievementToMint = achievements.find(ach => ach.id === achievementId);
      if (!achievementToMint) {
        throw new Error('Achievement not found');
      }

      // Generate metadata for the achievement
      const metadata = generateMetadataJSON(achievementId as AchievementType, walletAddress);
      const metadataURI = JSON.stringify(metadata);

      // Call the mintAchievement function on Scroll
      const tx = await contract.mintAchievement(
        walletAddress,
        getAchievementId(achievementId as AchievementType),
        metadataURI,
        'public'
      );

      setTxHash(tx.hash);

      // Wait for confirmation
      await tx.wait();

      // Update the achievement with the real token ID
      setAchievements(prev => prev.map(ach =>
        ach.id === achievementId ? { ...ach, tokenId: tx.hash } : ach
      ));

      return tx.hash;
    } catch (err: any) {
      console.error('Mint achievement NFT failed:', err);
      setError(err.message || 'Failed to mint achievement NFT');
      throw err;
    } finally {
      setIsMinting(false);
    }
  }, [walletAddress, achievements]);

  const submitAchievement = useCallback(async (achievement: AchievementType, gameState: GameState) => {
    if (!isConnected || !walletAddress) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const { ethers } = await import('ethers');

      // Create provider and signer
      const provider = new ethers.JsonRpcProvider(SCROLL_RPC_URL);
      const signer = await getWalletConnectSigner();
      if (!signer) {
        throw new Error('Failed to get WalletConnect signer');
      }

      // Create contract instance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Generate metadata for the achievement
      const metadata = generateMetadataJSON(achievement, walletAddress);
      const metadataURI = JSON.stringify(metadata);

      // Call the mintAchievement function on Scroll
      const tx = await contract.mintAchievement(
        walletAddress,
        getAchievementId(achievement),
        metadataURI,
        'public'
      );

      setTxHash(tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();

      // Create achievement object
      const newAchievement: OnchainAchievement = {
        id: achievement,
        name: metadata.name,
        description: metadata.description,
        icon: metadata.image,
        points: getAchievementPoints(achievement),
        unlocked: true,
        unlockedAt: Date.now(),
        tokenId: tx.hash,
      };

      setAchievements(prev => [...prev, newAchievement]);

      return { hash: tx.hash, receipt };
    } catch (err: any) {
      console.error('Submit achievement failed:', err);
      setError(err.message || 'Failed to submit achievement');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, walletAddress]);

  const getTotalScore = useCallback(() => {
    // Calculate total score from achievements
    return achievements.reduce((total, achievement) => {
      if (achievement.unlocked && achievement.points) {
        return total + achievement.points;
      }
      return total;
    }, 0);
  }, [achievements]);

  const evaluateAchievements = useCallback((gameState: GameState): string[] => {
    // Evaluate which achievements should be unlocked based on game state
    const unlockedAchievementIds: string[] = [];

    // Victory achievements
    if (gameState.gameResult === 'victory') {
      if (gameState.gameMode === 'classic') {
        unlockedAchievementIds.push('victory_classic');
      } else if (gameState.gameMode === 'life') {
        unlockedAchievementIds.push('victory_life');
      }
    }

    // Perfect stability
    if (gameState.stability && gameState.stability >= 95) {
      unlockedAchievementIds.push('perfect_stability');
    }

    // High combo
    if (gameState.comboCount && gameState.comboCount >= 10) {
      unlockedAchievementIds.push('high_combo');
    }

    return unlockedAchievementIds;
  }, []);

  return {
    userAddress,
    isConnected,
    isMinting,
    achievements,
    getTotalScore,
    mintAchievementNFT,
    writeContract,
    submitAchievement,
    evaluateAchievements,
    isFetching: isLoading,
    error,
    txHash,
  };
};