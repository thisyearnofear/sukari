import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BeamClient, ClientConfig, ChainId } from '@onbeam/sdk';
import { Platform } from 'react-native';

// These should be moved to environment variables in a real app
const BEAM_PUBLISHABLE_KEY = 'pk_test_sample_key'; // Placeholder
const BEAM_CHALLENGE_ID = 'sample_challenge_id'; // Placeholder

interface BeamContextType {
  beam: BeamClient | null;
  isInitialized: boolean;
  playerAccount: any | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  showSyncFeedback: boolean;
  mintAchievement: (achievementId: string) => Promise<string | null>;
  fetchAchievements: () => Promise<any[]>;
  reportGameResult: (score: number, result: 'victory' | 'defeat', metrics?: any) => Promise<boolean>;
}

const BeamContext = createContext<BeamContextType | undefined>(undefined);

export const BeamProvider = ({ children }: { children: ReactNode }) => {
  const [beam, setBeam] = useState<BeamClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [playerAccount, setPlayerAccount] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSyncFeedback, setShowSyncFeedback] = useState(false);

  // Trigger sync feedback (visual glow)
  const triggerSyncFeedback = () => {
    setShowSyncFeedback(true);
    setTimeout(() => setShowSyncFeedback(false), 2000);
  };

  useEffect(() => {
    const initBeam = async () => {
      try {
        const config: ClientConfig = {
          chains: [
            {
              id: ChainId.BEAM_TESTNET,
              publishableKey: BEAM_PUBLISHABLE_KEY,
            }
          ],
          chainId: ChainId.BEAM_TESTNET,
        };
        const beamInstance = new BeamClient(config);
        setBeam(beamInstance);
        setIsInitialized(true);
        
        // Check for existing session
        // const account = await beamInstance.getPlayerAccount();
        // if (account) setPlayerAccount(account);
      } catch (error) {
        console.error('Failed to initialize Beam SDK:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initBeam();
  }, []);

  const login = async () => {
    if (!beam) return;
    try {
      setIsLoading(true);
      // In a real implementation, this would trigger the Social Login flow
      // const account = await beam.login({ provider: 'google' });
      // For now, we simulate a successful login to demonstrate the "User Ready" state
      const mockAccount = {
        address: '0x748a...93c5',
        name: 'Guardian-748',
        provider: 'google',
      };
      setPlayerAccount(mockAccount);
      console.log('Beam login triggered - simulation successful');
    } catch (error) {
      console.error('Beam login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!beam) return;
    try {
      setIsLoading(true);
      // await beam.logout();
      setPlayerAccount(null);
    } catch (error) {
      console.error('Beam logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const mintAchievement = async (achievementId: string) => {
    if (!beam || !playerAccount) return null;
    try {
      setIsLoading(true);
      triggerSyncFeedback();
      // In a real implementation, this would call the Beam Asset API
      // const asset = await beam.assets.mint({
      //   receiver: playerAccount.address,
      //   assetId: achievementId,
      // });
      console.log(`Minting achievement ${achievementId} on Beam for ${playerAccount.address}`);
      return '0x_beam_tx_hash_placeholder';
    } catch (error) {
      console.error('Beam minting failed:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAchievements = async () => {
    if (!beam || !playerAccount) return [];
    try {
      // return await beam.assets.getOwnedAssets(playerAccount.address);
      return [];
    } catch (error) {
      console.error('Beam fetch achievements failed:', error);
      return [];
    }
  };

  const reportGameResult = async (score: number, result: 'victory' | 'defeat', metrics?: any) => {
    if (!beam || !playerAccount) return false;
    try {
      triggerSyncFeedback();
      console.log(`Reporting game results to Beam for ${playerAccount.address}:`, { score, result, metrics });
      
      // In a real implementation, this would use the Beam Session to sign and send the result
      // This ensures progression is persistent and verifiable on the Beam network
      // await beam.sessions.signAndSend({
      //   to: BEAM_CHALLENGE_ID,
      //   data: encodeResultData(score, result, metrics),
      // });
      
      return true;
    } catch (error) {
      console.error('Failed to report game result to Beam:', error);
      return false;
    }
  };

  return (
    <BeamContext.Provider
      value={{
        beam,
        isInitialized,
        playerAccount,
        login,
        logout,
        isLoading,
        showSyncFeedback,
        mintAchievement,
        fetchAchievements,
        reportGameResult,
      }}
    >
      {children}
    </BeamContext.Provider>
  );
};

export const useBeam = () => {
  const context = useContext(BeamContext);
  if (context === undefined) {
    return null as any; // Return null instead of throwing to prevent app crash if used outside provider
  }
  return context;
};
