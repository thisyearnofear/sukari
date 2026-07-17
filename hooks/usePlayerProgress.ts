import { useState, useEffect, useCallback } from 'react';
import { GameTier } from '@/constants/gameTiers';
import { UserMode } from '@/types/game';
import { PrivacySettings, PrivacyMode } from '@/types/health';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { track } from '@/utils/analytics';
import { analyzePlayerSessions, PlayerAnalytics } from '@/utils/slowMoAnalytics';
import { useBeam } from '@/context/BeamContext';
import type { SignalSnapshot } from '@/domain/signals';
import {
  AdherenceWeek,
  ProgrammeMission,
  emptyAdherenceWeek,
  rollAdherenceWeek,
  selectMission,
  dateKeyFrom,
  markMissionCompleted,
  markMissionRelapsed,
} from '@/domain/programme';

export interface SlowMoModeSession {
  plannedMeals?: Array<{ mealType: string; name: string; glucoseImpact: number }>;
  actualMeals?: Array<{ mealType: string; name: string; glucoseImpact: number }>;
  completedAt?: number;
}

export type GameMechanic =
  | 'swipe_basic'
  | 'stability_bar'
  | 'combo'
  | 'save_direction'
  | 'share_direction'
  | 'body_metrics'
  | 'plot_twists'
  | 'power_ups'
  | 'morning_conditions'
  | 'cgm_comparison';

export const MECHANIC_UNLOCKS: Record<GameMechanic, number> = {
  swipe_basic: 0,
  stability_bar: 1,
  combo: 2,
  power_ups: 3,
  save_direction: 4,
  share_direction: 5,
  body_metrics: 6,
  morning_conditions: 8,
  plot_twists: 10,
  cgm_comparison: 3,
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
  kingdomRenown: number;
  discoveredLoreIds: string[];
  mechanicsUnlocked: GameMechanic[];
  mechanicDiscoveryShown: GameMechanic[];
  /** Today's programme mission (single ask) */
  activeMission: ProgrammeMission | null;
  missionHistory: ProgrammeMission[];
  adherenceWeek: AdherenceWeek;
  lastMissionResetAt: number | null;
  lastDigestToken?: string | null;
  lastDigestAt?: number | null;
}

const STORAGE_KEY = 'glucoseWars.playerProgress';
const MISSION_HISTORY_CAP = 60;

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

function defaultProgress(): PlayerProgressState {
  return {
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
    kingdomRenown: 0,
    discoveredLoreIds: [],
    mechanicsUnlocked: ['swipe_basic'],
    mechanicDiscoveryShown: [],
    activeMission: null,
    missionHistory: [],
    adherenceWeek: emptyAdherenceWeek(),
    lastMissionResetAt: null,
    lastDigestToken: null,
    lastDigestAt: null,
  };
}

function isNewCalendarDay(lastReset: number | null): boolean {
  if (!lastReset) return true;
  const now = new Date();
  const last = new Date(lastReset);
  return (
    now.getDate() !== last.getDate() ||
    now.getMonth() !== last.getMonth() ||
    now.getFullYear() !== last.getFullYear()
  );
}

export function usePlayerProgress() {
  const beamContext = useBeam();
  const playerAccount = beamContext?.playerAccount;
  const beam = beamContext?.beam;
  const [hydrated, setHydrated] = useState(false);
  const [progress, setProgress] = useState<PlayerProgressState>(defaultProgress);

  const [missionToast, setMissionToast] = useState<{ title: string; reward: number } | null>(null);
  const [promotionToast, setPromotionToast] = useState<{ title: string; icon: string } | null>(null);
  const [loreToast, setLoreToast] = useState<string | null>(null);
  const [mechanicDiscoveryToast, setMechanicDiscoveryToast] = useState<GameMechanic | null>(null);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<PlayerProgressState> & {
            dailyQuests?: unknown;
            lastQuestResetAt?: number | null;
          };

          if (!parsed.mechanicsUnlocked) {
            const unlocked: GameMechanic[] = [];
            for (const [mechanic, threshold] of Object.entries(MECHANIC_UNLOCKS)) {
              if ((parsed.gamesPlayed || 0) >= threshold) unlocked.push(mechanic as GameMechanic);
            }
            parsed.mechanicsUnlocked = unlocked.length > 0 ? unlocked : ['swipe_basic'];
            parsed.mechanicDiscoveryShown = parsed.mechanicsUnlocked;
          }

          // Migrate away from dailyQuests
          delete (parsed as { dailyQuests?: unknown }).dailyQuests;

          const base = { ...defaultProgress(), ...parsed };
          base.missionHistory = Array.isArray(parsed.missionHistory)
            ? parsed.missionHistory.slice(-MISSION_HISTORY_CAP)
            : [];
          base.adherenceWeek = parsed.adherenceWeek || emptyAdherenceWeek();
          base.activeMission = parsed.activeMission ?? null;

          const resetAt = parsed.lastMissionResetAt ?? parsed.lastQuestResetAt ?? null;
          if (isNewCalendarDay(resetAt)) {
            const mission = selectMission({
              userMode: base.userMode,
              activeMission: null,
              missionHistory: base.missionHistory,
            });
            setProgress({
              ...base,
              activeMission: mission,
              adherenceWeek: rollAdherenceWeek(base.adherenceWeek, mission, 'assigned'),
              lastMissionResetAt: Date.now(),
            });
          } else {
            if (!base.activeMission) {
              const mission = selectMission({
                userMode: base.userMode,
                missionHistory: base.missionHistory,
              });
              base.activeMission = mission;
              base.adherenceWeek = rollAdherenceWeek(base.adherenceWeek, mission, 'assigned');
            }
            setProgress({ ...base, lastMissionResetAt: resetAt ?? Date.now() });
          }
        } else {
          const mission = selectMission({ userMode: null });
          setProgress({
            ...defaultProgress(),
            activeMission: mission,
            adherenceWeek: rollAdherenceWeek(null, mission, 'assigned'),
            lastMissionResetAt: Date.now(),
          });
        }
      } catch (error) {
        console.error('Failed to load player progress:', error);
      } finally {
        setHydrated(true);
      }
    };

    loadProgress();
  }, []);

  useEffect(() => {
    if (playerAccount && beam) {
      console.log('Syncing progress with Beam Player Account:', playerAccount.address);
    }
  }, [playerAccount, beam]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress, hydrated]);

  const unlockNextTier = (tier: GameTier) => {
    const tiers: GameTier[] = ['tier1', 'tier2', 'tier3'];
    const currentIndex = tiers.indexOf(tier);
    const nextTier = tiers[currentIndex + 1];
    setProgress((prev) => ({
      ...prev,
      maxTierUnlocked: nextTier ? nextTier : tier,
    }));
  };

  const updateBestScore = (score: number) => {
    setProgress((prev) => ({
      ...prev,
      bestScore: Math.max(prev.bestScore, score),
    }));
  };

  const incrementGamesPlayed = () => {
    setProgress((prev) => {
      const newCount = prev.gamesPlayed + 1;
      const newMechanics = [...(prev.mechanicsUnlocked || ['swipe_basic'])];
      const newDiscoveries: GameMechanic[] = [];
      for (const [mechanic, threshold] of Object.entries(MECHANIC_UNLOCKS)) {
        const m = mechanic as GameMechanic;
        if (newCount >= threshold && !newMechanics.includes(m)) {
          newMechanics.push(m);
          if (!(prev.mechanicDiscoveryShown || []).includes(m)) {
            newDiscoveries.push(m);
          }
        }
      }
      if (newDiscoveries.length > 0) {
        setMechanicDiscoveryToast(newDiscoveries[0]);
        setTimeout(() => setMechanicDiscoveryToast(null), 4000);
        newDiscoveries.forEach((m) =>
          track('mechanic_unlocked', { mechanic: m, games_played: newCount }),
        );
      }
      return {
        ...prev,
        gamesPlayed: newCount,
        lastPlayedAt: Date.now(),
        mechanicsUnlocked: newMechanics,
        mechanicDiscoveryShown: [...(prev.mechanicDiscoveryShown || []), ...newDiscoveries],
      };
    });
  };

  const hasMechanic = useCallback(
    (mechanic: GameMechanic): boolean => {
      return progress.mechanicsUnlocked?.includes(mechanic) ?? false;
    },
    [progress.mechanicsUnlocked],
  );

  const setSkipOnboarding = (skip: boolean) => {
    setProgress((prev) => ({ ...prev, skipOnboarding: skip }));
  };

  const setCurrentTier = (tier: GameTier) => {
    setProgress((prev) => ({ ...prev, currentTier: tier }));
  };

  const setUserMode = (mode: UserMode) => {
    setProgress((prev) => {
      const mission = selectMission({
        userMode: mode,
        activeMission: prev.activeMission,
        missionHistory: prev.missionHistory,
      });
      const sameDay = mission.id === prev.activeMission?.id;
      return {
        ...prev,
        userMode: mode,
        activeMission: mission,
        adherenceWeek: sameDay
          ? prev.adherenceWeek
          : rollAdherenceWeek(prev.adherenceWeek, mission, 'assigned'),
      };
    });
  };

  const setPrivacyMode = (mode: PrivacyMode) => {
    setProgress((prev) => ({
      ...prev,
      privacyMode: mode,
      privacySettings: {
        ...prev.privacySettings!,
        mode,
      },
    }));
  };

  const updatePrivacySettings = (settings: Partial<PrivacySettings>) => {
    setProgress((prev) => ({
      ...prev,
      privacySettings: {
        ...prev.privacySettings!,
        ...settings,
        mode: settings.mode || prev.privacySettings?.mode || 'standard',
      },
    }));
  };

  const recordSlowMoSession = (session: SlowMoModeSession) => {
    setProgress((prev) => ({
      ...prev,
      slowMoSessions: [...(prev.slowMoSessions || []), { ...session, completedAt: Date.now() }],
      slowMoSessionsCompleted: (prev.slowMoSessionsCompleted || 0) + 1,
    }));
  };

  const getSlowMoSessionStats = () => {
    const sessions = progress.slowMoSessions || [];
    if (sessions.length === 0) return null;
    const totalSessions = sessions.length;
    const completedWithActualMeals = sessions.filter((s) => s.actualMeals?.length).length;
    const avgPlannedMeals =
      sessions.reduce((sum, s) => sum + (s.plannedMeals?.length || 0), 0) / totalSessions;
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

  const ensureTodayMission = useCallback(
    (snapshot?: SignalSnapshot | null, forceTemplateId?: string) => {
      setProgress((prev) => {
        const today = dateKeyFrom();
        if (
          prev.activeMission?.dateKey === today &&
          prev.activeMission.status !== 'skipped' &&
          !forceTemplateId
        ) {
          return prev;
        }
        const mission = selectMission({
          userMode: prev.userMode,
          snapshot,
          activeMission: forceTemplateId ? null : prev.activeMission,
          missionHistory: prev.missionHistory,
          forceTemplateId,
          source: forceTemplateId ? 'caregiver_invite' : 'rules',
        });
        track('mission_assigned', {
          template_id: mission.templateId,
          behaviour: mission.behaviourTarget,
          source: mission.source,
          privacy_mode: prev.privacyMode,
        });
        return {
          ...prev,
          activeMission: mission,
          adherenceWeek: rollAdherenceWeek(prev.adherenceWeek, mission, 'assigned'),
          lastMissionResetAt: Date.now(),
        };
      });
    },
    [],
  );

  const applyMissionUpdate = useCallback((mission: ProgrammeMission) => {
    setProgress((prev) => {
      const history = [
        ...prev.missionHistory.filter((m) => m.id !== mission.id),
        mission,
      ].slice(-MISSION_HISTORY_CAP);
      return { ...prev, activeMission: mission, missionHistory: history };
    });
  }, []);

  const markMissionPracticed = useCallback((mission: ProgrammeMission) => {
    setProgress((prev) => {
      const next = { ...mission, status: 'practiced' as const, practicedAt: Date.now() };
      track('mission_practiced', {
        template_id: next.templateId,
        behaviour: next.behaviourTarget,
        privacy_mode: prev.privacyMode,
      });
      return {
        ...prev,
        activeMission: next,
        adherenceWeek: rollAdherenceWeek(prev.adherenceWeek, next, 'practiced'),
        missionHistory: [...prev.missionHistory.filter((m) => m.id !== next.id), next].slice(
          -MISSION_HISTORY_CAP,
        ),
        kingdomRenown: prev.kingdomRenown + 25,
      };
    });
  }, []);

  const completeActiveMission = useCallback(() => {
    setProgress((prev) => {
      if (!prev.activeMission) return prev;
      const next = markMissionCompleted(prev.activeMission);
      setMissionToast({ title: 'Mission complete', reward: 100 });
      setTimeout(() => setMissionToast(null), 3000);
      const newRenown = prev.kingdomRenown + 100;
      const oldTitle = KINGDOM_MILESTONES.reduce(
        (p, c) => (prev.kingdomRenown >= c.renown ? c : p),
        KINGDOM_MILESTONES[0],
      );
      const newTitle = KINGDOM_MILESTONES.reduce(
        (p, c) => (newRenown >= c.renown ? c : p),
        KINGDOM_MILESTONES[0],
      );
      if (newTitle.renown > oldTitle.renown) {
        setPromotionToast({ title: newTitle.title, icon: newTitle.icon });
        setTimeout(() => setPromotionToast(null), 4000);
      }
      track('mission_completed', {
        template_id: next.templateId,
        behaviour: next.behaviourTarget,
        privacy_mode: prev.privacyMode,
      });
      return {
        ...prev,
        activeMission: next,
        adherenceWeek: rollAdherenceWeek(prev.adherenceWeek, next, 'completed'),
        missionHistory: [...prev.missionHistory.filter((m) => m.id !== next.id), next].slice(
          -MISSION_HISTORY_CAP,
        ),
        kingdomRenown: newRenown,
      };
    });
  }, []);

  const relapseActiveMission = useCallback(() => {
    setProgress((prev) => {
      if (!prev.activeMission) return prev;
      const next = markMissionRelapsed(prev.activeMission);
      return {
        ...prev,
        activeMission: next,
        adherenceWeek: rollAdherenceWeek(prev.adherenceWeek, next, 'relapsed'),
        missionHistory: [...prev.missionHistory.filter((m) => m.id !== next.id), next].slice(
          -MISSION_HISTORY_CAP,
        ),
      };
    });
  }, []);

  const setActiveMissionFromCoach = useCallback((mission: ProgrammeMission) => {
    setProgress((prev) => ({
      ...prev,
      activeMission: mission,
      adherenceWeek: rollAdherenceWeek(prev.adherenceWeek, mission, 'assigned'),
      lastMissionResetAt: Date.now(),
      missionHistory: [...prev.missionHistory.filter((m) => m.id !== mission.id), mission].slice(
        -MISSION_HISTORY_CAP,
      ),
    }));
  }, []);

  const setDigestMeta = useCallback((token: string) => {
    setProgress((prev) => ({
      ...prev,
      lastDigestToken: token,
      lastDigestAt: Date.now(),
    }));
  }, []);

  const getKingdomTitle = useCallback(() => {
    return KINGDOM_MILESTONES.reduce((prev, curr) => {
      if (progress.kingdomRenown >= curr.renown) return curr;
      return prev;
    }, KINGDOM_MILESTONES[0]);
  }, [progress.kingdomRenown]);

  const discoverLore = useCallback((id: string) => {
    setProgress((prev) => {
      if (prev.discoveredLoreIds.includes(id)) return prev;
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
    setCurrentTier,
    setUserMode,
    setPrivacyMode,
    updatePrivacySettings,
    recordSlowMoSession,
    getSlowMoSessionStats,
    getSlowMoAnalytics,
    getKingdomTitle,
    discoverLore,
    hasMechanic,
    mechanicDiscoveryToast,
    promotionToast,
    loreToast,
    missionToast,
    /** @deprecated use missionToast — kept for battle toast bridge */
    questCompletionToast: missionToast,
    ensureTodayMission,
    applyMissionUpdate,
    markMissionPracticed,
    completeActiveMission,
    relapseActiveMission,
    setActiveMissionFromCoach,
    setDigestMeta,
  };
}
