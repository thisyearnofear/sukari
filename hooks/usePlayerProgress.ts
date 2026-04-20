import { useState, useEffect, useCallback } from 'react';
import { GameTier } from '@/constants/gameTiers';
import { UserMode, SwipeAction } from '@/types/game';
import { PrivacySettings, PrivacyMode } from '@/types/health';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyzePlayerSessions, PlayerAnalytics } from '@/utils/slowMoAnalytics';
import { useBeam } from '@/context/BeamContext';

export type DailyQuestType = 
  | 'save_healthy' 
  | 'reject_enemy' 
  | 'share_ally' 
  | 'balanced_streak'
  | 'perfect_day';

export interface DailyQuest {
  id: string;
  type: DailyQuestType;
  title: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  reward: number; // XP or Renown
}

export interface SlowMoModeSession {
  plannedMeals?: Array<{ mealType: string; name: string; glucoseImpact: number }>;
  actualMeals?: Array<{ mealType: string; name: string; glucoseImpact: number }>;
  completedAt?: number; // timestamp when session was completed
}

/**
 * Game mechanics that unlock progressively as the player gains experience.
 * Drives UI visibility — only show what the player has unlocked.
 */
export type GameMechanic =
  | 'swipe_basic'       // Up/down swipe (always on)
  | 'stability_bar'     // Harmony meter visible
  | 'combo'             // Combo counter visible
  | 'save_direction'    // Left swipe (save for later)
  | 'share_direction'   // Right swipe (share with allies)
  | 'body_metrics'      // Vigor/Purity/Vitality panels
  | 'plot_twists'       // Random events during gameplay
  | 'power_ups'         // Exercise/Rations buttons
  | 'morning_conditions'// Day starts with a condition
  | 'cgm_comparison';   // Real glucose on results

/** When each mechanic unlocks (gamesPlayed threshold) */
export const MECHANIC_UNLOCKS: Record<GameMechanic, number> = {
  swipe_basic: 0,
  stability_bar: 1,     // After first game
  combo: 2,             // After 2 games
  power_ups: 3,         // After 3 games
  save_direction: 4,    // After 4 games (entering Life Mode)
  share_direction: 5,   // After 5 games
  body_metrics: 6,      // After 6 games
  morning_conditions: 8,// After 8 games
  plot_twists: 10,      // After 10 games
  cgm_comparison: 3,    // Available early but only shown on results
};

export interface PlayerProgressState {
  maxTierUnlocked: GameTier;
  currentTier: GameTier;
  gamesPlayed: number;
  bestScore: number;
  skipOnboarding: boolean;
  lastPlayedAt: number | null;
  userMode: UserMode | null;
  privacyMode: PrivacyMode;
  privacySettings?: PrivacySettings;
  slowMoSessions?: SlowMoModeSession[];
  slowMoSessionsCompleted?: number;
  dailyQuests: DailyQuest[];
  lastQuestResetAt: number | null;
  kingdomRenown: number;
  discoveredLoreIds: string[];
  // Mechanic unlock tracking
  mechanicsUnlocked: GameMechanic[];
  mechanicDiscoveryShown: GameMechanic[]; // "Aha" moments already shown
}

const STORAGE_KEY = 'glucoseWars.playerProgress';

const DEFAULT_QUESTS: DailyQuest[] = [
  {
    id: 'q1',
    type: 'save_healthy',
    title: 'The Royal Pantry',
    description: 'Save 5 healthy food cards for later.',
    target: 5,
    current: 0,
    completed: false,
    reward: 100,
  },
  {
    id: 'q2',
    type: 'reject_enemy',
    title: 'Border Patrol',
    description: 'Reject 10 unhealthy enemy cards.',
    target: 10,
    current: 0,
    completed: false,
    reward: 150,
  },
  {
    id: 'q3',
    type: 'share_ally',
    title: 'Community Feast',
    description: 'Share 3 ally cards with the kingdom.',
    target: 3,
    current: 0,
    completed: false,
    reward: 200,
  },
];

export interface KingdomMilestone {
  renown: number;
  title: string;
  icon: string;
}

export const KINGDOM_MILESTONES: KingdomMilestone[] = [
  { renown: 0, title: 'Squire', icon: '🛡️' },
  { renown: 500, title: 'Knight', icon: '⚔️' },
  { renown: 1500, title: 'Guardian', icon: '👑' },
  { renown: 3000, title: 'Royal Alchemist', icon: '🧪' },
  { renown: 6000, title: 'Grand Master', icon: '🧙‍♂️' },
];

export function usePlayerProgress() {
  const beamContext = useBeam();
  const playerAccount = beamContext?.playerAccount;
  const beam = beamContext?.beam;
  const [hydrated, setHydrated] = useState(false);
  const [progress, setProgress] = useState<PlayerProgressState>({
    maxTierUnlocked: 'tier1',
    currentTier: 'tier1',
    gamesPlayed: 0,
    bestScore: 0,
    skipOnboarding: false,
    lastPlayedAt: null,
    userMode: null,
    privacyMode: 'standard',
    privacySettings: {
      mode: 'standard',
      encryptHealthData: false,
      glucoseLevels: 'public',
      insulinDoses: 'public',
      achievements: 'public',
      gameStats: 'public',
      healthProfile: 'public',
    },
    slowMoSessions: [],
    slowMoSessionsCompleted: 0,
    dailyQuests: DEFAULT_QUESTS,
    lastQuestResetAt: null,
    kingdomRenown: 0,
    discoveredLoreIds: [],
    mechanicsUnlocked: ['swipe_basic'],
    mechanicDiscoveryShown: [],
  });

  // Load from AsyncStorage on component mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          
          // Check for daily quest reset (PERFORMANT & ORGANIZED)
          const now = new Date();
          const lastReset = parsed.lastQuestResetAt ? new Date(parsed.lastQuestResetAt) : null;
          
          const isNewDay = !lastReset || 
            now.getDate() !== lastReset.getDate() || 
            now.getMonth() !== lastReset.getMonth() || 
            now.getFullYear() !== lastReset.getFullYear();

          if (isNewDay) {
            setProgress({
              ...parsed,
              dailyQuests: DEFAULT_QUESTS,
              lastQuestResetAt: Date.now(),
            });
          } else {
            setProgress(parsed);
          }
        } else {
          // First time initialization
          setProgress(prev => ({ ...prev, lastQuestResetAt: Date.now() }));
        }
      } catch (error) {
        console.error('Failed to load player progress:', error);
      } finally {
        setHydrated(true);
      }
    };

    loadProgress();
  }, []);

  // Sync with Beam Player Account (ENHANCEMENT FIRST)
  useEffect(() => {
    if (playerAccount && beam) {
      const syncWithBeam = async () => {
        try {
          // In a real implementation, we would fetch progress from Beam's Player API
          // For now, we'll simulate syncing local renown to Beam if Beam is ahead
          // const beamProgress = await beam.getPlayerProgress(playerAccount.address);
          // if (beamProgress.renown > progress.kingdomRenown) {
          //   setProgress(prev => ({ ...prev, kingdomRenown: beamProgress.renown }));
          // }
          console.log('Syncing progress with Beam Player Account:', playerAccount.address);
        } catch (error) {
          console.error('Failed to sync with Beam:', error);
        }
      };
      syncWithBeam();
    }
  }, [playerAccount, beam]);

  // Persist to AsyncStorage whenever progress changes
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    
    // Also sync to Beam if logged in
    if (playerAccount && beam) {
      // beam.updatePlayerProgress(playerAccount.address, { 
      //   renown: progress.kingdomRenown,
      //   maxTier: progress.maxTierUnlocked 
      // });
    }
  }, [progress, playerAccount, beam]);

  const unlockNextTier = (tier: GameTier) => {
    const tiers: GameTier[] = ['tier1', 'tier2', 'tier3'];
    const currentIndex = tiers.indexOf(tier);
    const nextTier = tiers[currentIndex + 1];

    setProgress(prev => ({
      ...prev,
      maxTierUnlocked: nextTier ? nextTier : tier,
    }));
  };

  const updateBestScore = (score: number) => {
    setProgress(prev => ({
      ...prev,
      bestScore: Math.max(prev.bestScore, score),
    }));
  };

  const incrementGamesPlayed = () => {
    setProgress(prev => {
      const newCount = prev.gamesPlayed + 1;
      // Unlock mechanics based on games played
      const newMechanics = [...prev.mechanicsUnlocked];
      const newDiscoveries: GameMechanic[] = [];
      for (const [mechanic, threshold] of Object.entries(MECHANIC_UNLOCKS)) {
        const m = mechanic as GameMechanic;
        if (newCount >= threshold && !newMechanics.includes(m)) {
          newMechanics.push(m);
          if (!prev.mechanicDiscoveryShown.includes(m)) {
            newDiscoveries.push(m);
          }
        }
      }
      if (newDiscoveries.length > 0) {
        // Show discovery toast for the first new mechanic
        setMechanicDiscoveryToast(newDiscoveries[0]);
        setTimeout(() => setMechanicDiscoveryToast(null), 4000);
      }
      return {
        ...prev,
        gamesPlayed: newCount,
        lastPlayedAt: Date.now(),
        mechanicsUnlocked: newMechanics,
        mechanicDiscoveryShown: [...prev.mechanicDiscoveryShown, ...newDiscoveries],
      };
    });
  };

  /**
   * Check if a mechanic is unlocked for the current player.
   */
  const hasMechanic = useCallback((mechanic: GameMechanic): boolean => {
    return progress.mechanicsUnlocked.includes(mechanic);
  }, [progress.mechanicsUnlocked]);

  const setSkipOnboarding = (skip: boolean) => {
    setProgress(prev => ({
      ...prev,
      skipOnboarding: skip,
    }));
  };

  const setCurrentTier = (tier: GameTier) => {
    setProgress(prev => ({
      ...prev,
      currentTier: tier,
    }));
  };

  const setUserMode = (mode: UserMode) => {
    setProgress(prev => ({ ...prev, userMode: mode }));
  };

  const setPrivacyMode = (mode: PrivacyMode) => {
    setProgress(prev => ({
      ...prev,
      privacyMode: mode,
      privacySettings: {
        ...prev.privacySettings!,
        mode,
      },
    }));
  };

  const updatePrivacySettings = (settings: Partial<PrivacySettings>) => {
    setProgress(prev => ({
      ...prev,
      privacySettings: {
        ...prev.privacySettings!,
        ...settings,
        mode: settings.mode || prev.privacySettings?.mode || 'standard',
      },
    }));
  };

  const recordSlowMoSession = (session: SlowMoModeSession) => {
    setProgress(prev => ({
      ...prev,
      slowMoSessions: [...(prev.slowMoSessions || []), { ...session, completedAt: Date.now() }],
      slowMoSessionsCompleted: (prev.slowMoSessionsCompleted || 0) + 1,
    }));
  };

  const getSlowMoSessionStats = () => {
    const sessions = progress.slowMoSessions || [];
    if (sessions.length === 0) return null;
    
    const totalSessions = sessions.length;
    const completedWithActualMeals = sessions.filter(s => s.actualMeals?.length).length;
    const avgPlannedMeals = sessions.reduce((sum, s) => sum + (s.plannedMeals?.length || 0), 0) / totalSessions;
    
    return {
      totalSessions,
      completedWithActualMeals,
      avgPlannedMeals,
      completionRate: (completedWithActualMeals / totalSessions) * 100,
    };
  };

  const getSlowMoAnalytics = (): PlayerAnalytics => {
    const sessions = progress.slowMoSessions || [];
    return analyzePlayerSessions(sessions);
  };

  const [questCompletionToast, setQuestCompletionToast] = useState<{ title: string; reward: number } | null>(null);
  const [promotionToast, setPromotionToast] = useState<{ title: string; icon: string } | null>(null);
  const [loreToast, setLoreToast] = useState<string | null>(null);
  const [mechanicDiscoveryToast, setMechanicDiscoveryToast] = useState<GameMechanic | null>(null);

  /**
   * Tracks progress for daily quests (ENHANCEMENT FIRST)
   */
  const trackQuestProgress = useCallback((type: DailyQuestType, amount: number = 1) => {
    setProgress(prev => {
      const updatedQuests = prev.dailyQuests.map(quest => {
        if (quest.type === type && !quest.completed) {
          const newCurrent = Math.min(quest.current + amount, quest.target);
          const isNowCompleted = newCurrent >= quest.target;
          
          return {
            ...quest,
            current: newCurrent,
            completed: isNowCompleted,
          };
        }
        return quest;
      });

      // Calculate newly earned renown
      const newlyCompleted = updatedQuests.filter(
        (q, i) => q.completed && !prev.dailyQuests[i].completed
      );
      const earnedRenown = newlyCompleted.reduce((sum, q) => sum + q.reward, 0);

      if (earnedRenown > 0 || JSON.stringify(updatedQuests) !== JSON.stringify(prev.dailyQuests)) {
        // Show toast for newly completed quests
        if (newlyCompleted.length > 0) {
          const q = newlyCompleted[0];
          setQuestCompletionToast({ title: q.title, reward: q.reward });
          setTimeout(() => setQuestCompletionToast(null), 3000);
        }
        // #7: Check for kingdom title promotion
        const newRenown = prev.kingdomRenown + earnedRenown;
        const oldTitle = KINGDOM_MILESTONES.reduce((p, c) => prev.kingdomRenown >= c.renown ? c : p, KINGDOM_MILESTONES[0]);
        const newTitle = KINGDOM_MILESTONES.reduce((p, c) => newRenown >= c.renown ? c : p, KINGDOM_MILESTONES[0]);
        if (newTitle.renown > oldTitle.renown) {
          setPromotionToast({ title: newTitle.title, icon: newTitle.icon });
          setTimeout(() => setPromotionToast(null), 4000);
        }
        return {
          ...prev,
          dailyQuests: updatedQuests,
          kingdomRenown: newRenown,
        };
      }
      
      return prev;
    });
  }, []);

  const getKingdomTitle = useCallback(() => {
    const title = KINGDOM_MILESTONES.reduce((prev, curr) => {
      if (progress.kingdomRenown >= curr.renown) return curr;
      return prev;
    }, KINGDOM_MILESTONES[0]);
    return title;
  }, [progress.kingdomRenown]);

  /**
   * Discovers new Kingdom Lore (Education via Immersion)
   */
  const discoverLore = useCallback((id: string) => {
    setProgress(prev => {
      if (prev.discoveredLoreIds.includes(id)) return prev;
      // #13: Show lore discovery toast
      setLoreToast(id);
      setTimeout(() => setLoreToast(null), 3000);
      return {
        ...prev,
        discoveredLoreIds: [...prev.discoveredLoreIds, id],
        kingdomRenown: prev.kingdomRenown + 50,
      };
    });
  }, []);

  return {
    hydrated,
    progress,
    unlockNextTier,
    updateBestScore,
    incrementGamesPlayed,
    setSkipOnboarding,
    setCurrentTier: (tier: GameTier) =>
      setProgress(prev => ({ ...prev, currentTier: tier })),
    setUserMode,
    setPrivacyMode,
    updatePrivacySettings,
    recordSlowMoSession,
    getSlowMoSessionStats,
    getSlowMoAnalytics,
    trackQuestProgress,
    getKingdomTitle,
    discoverLore,
    questCompletionToast,
    promotionToast,
    loreToast,
    hasMechanic,
    mechanicDiscoveryToast,
  };
}