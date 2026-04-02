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
      // setPlayerAccount(account);
      console.log('Beam login triggered');
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
      }}
    >
      {children}
    </BeamContext.Provider>
  );
};

export const useBeam = () => {
  const context = useContext(BeamContext);
  if (context === undefined) {
    throw new Error('useBeam must be used within a BeamProvider');
  }
  return context;
};
