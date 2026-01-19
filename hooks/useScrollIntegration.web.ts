import { useState, useCallback, useEffect } from 'react';
import { OnchainAchievement, AchievementType, GameState } from '@/types/game';
import { useWeb3 } from '@/context/Web3Context';
import { GLUCOSE_WARS_ACHIEVEMENTS_ABI, ANYRAND_VRF_ABI } from '@/utils/contractABIs';
import { CONTRACTS, NETWORK_INFO } from '@/utils/contractAddresses';
import { generateMetadataJSON, ACHIEVEMENT_METADATA } from '@/utils/scrollContract';

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

// Web platform version - uses cross-platform Web3 context with dynamic ethers import
export const useScrollIntegration = () => {
  const { isConnected, address, provider, signer } = useWeb3();
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<OnchainAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Real Scroll Sepolia contract configuration
  const CONTRACT_ADDRESS = '0xf36223131aDA53e94B08F0c098A6A93424D68EE3';
  const CONTRACT_ABI = GLUCOSE_WARS_ACHIEVEMENTS_ABI;
  const ANYRAND_CONTRACT = '0x5d8570e6d734184357f3969b23050d64913be681';
  const ANYRAND_ABI = ANYRAND_VRF_ABI;
  const SCROLL_RPC_URL = 'https://sepolia-rpc.scroll.io';
  const CHAIN_ID = 534351;

  useEffect(() => {
    if (address) {
      setUserAddress(address);
    }
  }, [address]);

  // Fetch achievements from Scroll blockchain
  const fetchAchievements = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!address || !provider) {
        throw new Error('Wallet not connected or provider not available');
      }

      const ethersModule = await import('ethers');
      const { Contract } = ethersModule;

      // Create contract instance
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      // Fetch public achievements
      const publicAchievements = await contract.getPublicAchievements(address);

      // Fetch achievement metadata for each token
      const achievementsData = await Promise.all(
        publicAchievements.map(async (tokenId: bigint) => {
          const tokenURI = await contract.tokenURI(tokenId);
          const isVerified = await contract.isAchievementVerified(tokenId);

          return {
            tokenId: tokenId.toString(),
            tokenURI,
            isVerified,
            timestamp: Date.now(),
            status: 'confirmed'
          };
        })
      );

      setAchievements(achievementsData);
    } catch (err: any) {
      console.error('Error fetching achievements:', err);
      setError(err.message || 'Failed to fetch achievements');
    } finally {
      setIsLoading(false);
    }
  }, [address, provider]);

  const writeContract = useCallback(async (args: any[]) => {
    if (!signer) {
      throw new Error('No signer available. Please connect your wallet first.');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Dynamically import ethers only on web
      const ethersModule = await import('ethers');
      const { Contract } = ethersModule;

      // Create contract instance
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Execute the write function (example: mintAchievement)
      const tx = await contract.mintAchievement(...args);
      setTxHash(tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      return receipt;
    } catch (err: any) {
      console.error('Contract write failed:', err);
      setError(err.message || 'Transaction failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [signer]);

  const mintAchievementNFT = useCallback(async (achievementId: string) => {
    setIsMinting(true);
    setError(null);

    try {
      if (!address || !signer) {
        throw new Error('Wallet not connected');
      }

      const ethersModule = await import('ethers');
      const { Contract } = ethersModule;

      // Create contract instance
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Find the achievement to mint
      const achievementToMint = achievements.find(ach => ach.id === achievementId);
      if (!achievementToMint) {
        throw new Error('Achievement not found');
      }

      // Generate metadata for the achievement
      const metadata = generateMetadataJSON(achievementId as AchievementType, address);
      const metadataURI = JSON.stringify(metadata);

      // Call the mintAchievement function on Scroll
      const tx = await contract.mintAchievement(
        address,
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
  }, [address, signer, achievements]);

  const submitAchievement = useCallback(async (achievement: AchievementType, gameState: GameState) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const ethersModule = await import('ethers');
      const { Contract } = ethersModule;

      // Create contract instance with signer
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Generate metadata for the achievement
      const metadata = generateMetadataJSON(achievement, address);
      const metadataURI = JSON.stringify(metadata);

      // Call the mintAchievement function on the Scroll contract
      const tx = await contract.mintAchievement(
        address, // player address
        getAchievementId(achievement), // achievement ID
        metadataURI, // token URI
        'public' // privacy mode
      );

      setTxHash(tx.hash);

      // Wait for transaction confirmation
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
  }, [isConnected, address, signer]);

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