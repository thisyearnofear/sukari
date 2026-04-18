import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { identifyUser, track } from '@/utils/analytics';

const BEAM_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_BEAM_PUBLISHABLE_KEY || '';

interface BeamContextType {
  beam: any | null;
  isInitialized: boolean;
  playerAccount: { address: string; name?: string; provider?: string } | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  showSyncFeedback: boolean;
  mintAchievement: (achievementId: string) => Promise<string | null>;
  fetchAchievements: () => Promise<any[]>;
  reportGameResult: (score: number, result: 'victory' | 'defeat', metrics?: any) => Promise<boolean>;
  error: string | null;
}

const BeamContext = createContext<BeamContextType | undefined>(undefined);

export const BeamProvider = ({ children }: { children: ReactNode }) => {
  const [beam, setBeam] = useState<BeamClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [playerAccount, setPlayerAccount] = useState<BeamContextType['playerAccount']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSyncFeedback, setShowSyncFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerSyncFeedback = () => {
    setShowSyncFeedback(true);
    setTimeout(() => setShowSyncFeedback(false), 2000);
  };

  useEffect(() => {
    const initBeam = async () => {
      if (!BEAM_PUBLISHABLE_KEY) {
        console.warn('[Beam] No publishable key configured — running in offline mode');
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }

      try {
        // Dynamic import to avoid Metro SSR crash (uuid ESM wrapper issue)
        const { BeamClient, ChainId } = await import('@onbeam/sdk');
        const chainId = process.env.EXPO_PUBLIC_BEAM_MAINNET === 'true' ? ChainId.BEAM : ChainId.BEAM_TESTNET;

        const client = new BeamClient({
          chains: [{ id: chainId, publishableKey: BEAM_PUBLISHABLE_KEY }],
          chainId,
        });
        setBeam(client);
        setIsInitialized(true);

        // Restore existing session
        try {
          const session = await (client as any).getActiveSession?.();
          if (session?.account) {
            setPlayerAccount({
              address: session.account.address,
              name: session.account.name,
              provider: session.account.provider,
            });
          }
        } catch {
          // No active session — that's fine
        }
      } catch (err) {
        console.error('[Beam] Init failed:', err);
        setError('Failed to initialize Beam SDK');
      } finally {
        setIsLoading(false);
      }
    };

    initBeam();
  }, []);

  const login = async () => {
    if (!beam) {
      setError('Beam SDK not initialized. Check EXPO_PUBLIC_BEAM_PUBLISHABLE_KEY.');
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      track('beam_login_clicked');

      const result = await (beam as any).connectSocial?.();
      if (result?.account) {
        const account = {
          address: result.account.address,
          name: result.account.name || `Hero-${result.account.address.slice(2, 6)}`,
          provider: result.account.provider || 'social',
        };
        setPlayerAccount(account);
        identifyUser(account.address, { auth_provider: account.provider, account_type: 'beam' });
        track('beam_login_success', { auth_provider: account.provider });
      }
    } catch (err: any) {
      track('beam_login_error', { error: err?.message });
      setError(err?.message || 'Login failed');
      console.error('[Beam] Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!beam) return;
    try {
      setIsLoading(true);
      await (beam as any).disconnect?.();
      setPlayerAccount(null);
    } catch (err) {
      console.error('[Beam] Logout failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const mintAchievement = async (achievementId: string): Promise<string | null> => {
    if (!beam || !playerAccount) return null;
    try {
      setIsLoading(true);
      setError(null);
      triggerSyncFeedback();

      const result = await (beam as any).assets?.mint?.({
        receiver: playerAccount.address,
        assetId: achievementId,
      });

      track('beam_mint_success', { achievementId });
      return result?.transactionHash || result?.hash || null;
    } catch (err: any) {
      console.error('[Beam] Minting failed:', err);
      setError(err?.message || 'Minting failed');
      track('beam_mint_error', { achievementId, error: err?.message });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAchievements = async (): Promise<any[]> => {
    if (!beam || !playerAccount) return [];
    try {
      const assets = await (beam as any).assets?.getOwned?.(playerAccount.address);
      return assets || [];
    } catch (err) {
      console.error('[Beam] Fetch achievements failed:', err);
      return [];
    }
  };

  const reportGameResult = async (score: number, result: 'victory' | 'defeat', metrics?: any): Promise<boolean> => {
    if (!beam || !playerAccount) return false;
    try {
      triggerSyncFeedback();

      await (beam as any).sessions?.execute?.({
        interactions: [{
          contractAddress: process.env.EXPO_PUBLIC_BEAM_GAME_CONTRACT || '',
          functionName: 'reportResult',
          functionArgs: [score, result === 'victory' ? 1 : 0],
        }],
      });

      track('beam_result_reported', { score, result });
      return true;
    } catch (err: any) {
      // Non-critical — game still works without on-chain reporting
      console.warn('[Beam] Result reporting failed (non-critical):', err?.message);
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
        error,
      }}
    >
      {children}
    </BeamContext.Provider>
  );
};

export const useBeam = (): BeamContextType | null => {
  const context = useContext(BeamContext);
  if (context === undefined) return null;
  return context;
};
