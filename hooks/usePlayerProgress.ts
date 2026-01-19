import { useState, useEffect } from 'react';
import { GameTier } from '@/constants/gameTiers';
import { UserMode } from '@/types/game';
import { PrivacySettings, PrivacyMode } from '@/types/health';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyzePlayerSessions, PlayerAnalytics } from '@/utils/slowMoAnalytics';

export interface SlowMoModeSession {
  plannedMeals?: Array<{ mealType: string; name: string; glucoseImpact: number }>;
  actualMeals?: Array<{ mealType: string; name: string; glucoseImpact: number }>;
  completedAt?: number; // timestamp when session was completed
}

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
  slowMoSessions?: SlowMoModeSession[]; // Track Slow Mo Mode sessions
  slowMoSessionsCompleted?: number; // Total sessions completed
}

const STORAGE_KEY = 'glucoseWars.playerProgress';

export function usePlayerProgress() {
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
  });

  // Load from AsyncStorage on component mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setProgress(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load player progress:', error);
      }
    };

    loadProgress();
  }, []);

  // Persist to AsyncStorage whenever progress changes
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

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
    setProgress(prev => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      lastPlayedAt: Date.now(),
    }));
  };

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

  return {
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
  };
}