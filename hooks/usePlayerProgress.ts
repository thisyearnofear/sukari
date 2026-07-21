import { useState, useEffect, useCallback } from 'react';
import { UserMode } from '@/types/game';
import { PrivacySettings, PrivacyMode } from '@/types/health';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { track } from '@/utils/analytics';
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
import type { PersonalisedWorldState } from '@/domain/agent';

export interface PlayerProgressState {
  gamesPlayed: number;
  bestScore: number;
  lastPlayedAt: number | null;
  userMode: UserMode | null;
  privacyMode: PrivacyMode;
  privacySettings?: PrivacySettings;
  /** Today's programme mission (single ask) */
  activeMission: ProgrammeMission | null;
  missionHistory: ProgrammeMission[];
  adherenceWeek: AdherenceWeek;
  lastMissionResetAt: number | null;
  lastDigestToken?: string | null;
  lastDigestAt?: number | null;
  /** Bounded local presentation state for the active mission. */
  worldState: PersonalisedWorldState | null;
}

const STORAGE_KEY = 'sukari.playerProgress';
const MISSION_HISTORY_CAP = 60;

function defaultProgress(): PlayerProgressState {
  return {
    gamesPlayed: 0,
    bestScore: 0,
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
    activeMission: null,
    missionHistory: [],
    adherenceWeek: emptyAdherenceWeek(),
    lastMissionResetAt: null,
    lastDigestToken: null,
    lastDigestAt: null,
    worldState: null,
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
  const [hydrated, setHydrated] = useState(false);
  const [progress, setProgress] = useState<PlayerProgressState>(defaultProgress);

  const [missionToast, setMissionToast] = useState<{ title: string; reward: number } | null>(null);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<PlayerProgressState> & {
            dailyQuests?: unknown;
            lastQuestResetAt?: number | null;
          };

          // Migrate away from legacy game fields no longer in the state shape.
          delete (parsed as { dailyQuests?: unknown }).dailyQuests;

          const base = { ...defaultProgress(), ...parsed };
          base.missionHistory = Array.isArray(parsed.missionHistory)
            ? parsed.missionHistory.slice(-MISSION_HISTORY_CAP)
            : [];
          base.adherenceWeek = parsed.adherenceWeek || emptyAdherenceWeek();
          base.activeMission = parsed.activeMission ?? null;
          base.worldState = parsed.worldState ?? null;
          if (base.worldState?.missionId !== base.activeMission?.id) base.worldState = null;

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
              worldState: null,
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
              base.worldState = null;
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
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress, hydrated]);

  const updateBestScore = (score: number) => {
    setProgress((prev) => ({
      ...prev,
      bestScore: Math.max(prev.bestScore, score),
    }));
  };

  const incrementGamesPlayed = () => {
    setProgress((prev) => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      lastPlayedAt: Date.now(),
    }));
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
        worldState: sameDay ? prev.worldState : null,
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
          worldState: null,
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
      };
    });
  }, []);

  const completeActiveMission = useCallback(() => {
    setProgress((prev) => {
      if (!prev.activeMission) return prev;
      const next = markMissionCompleted(prev.activeMission);
      setMissionToast({ title: 'Mission complete', reward: 100 });
      setTimeout(() => setMissionToast(null), 3000);
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
      worldState: null,
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

  const setWorldState = useCallback((worldState: PersonalisedWorldState | null) => {
    setProgress((prev) => ({ ...prev, worldState }));
  }, []);

  return {
    hydrated,
    progress,
    updateBestScore,
    incrementGamesPlayed,
    setUserMode,
    setPrivacyMode,
    updatePrivacySettings,
    missionToast,
    ensureTodayMission,
    applyMissionUpdate,
    markMissionPracticed,
    completeActiveMission,
    relapseActiveMission,
    setActiveMissionFromCoach,
    setDigestMeta,
    setWorldState,
  };
}
