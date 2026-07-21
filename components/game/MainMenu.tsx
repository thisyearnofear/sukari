/**
 * MainMenu — home surface orchestrator.
 *
 * Owns the shared home state (role, signal source, demo, mission choice)
 * and decides which sub-surface to render:
 *
 *   RoleSelector        — first-run role pick
 *   SignalSourcePicker  — first-run signal source pick
 *   ManualCheckIn       — manual moment picker (sub-flow of signal source)
 *   HomeMission         — the main mission surface
 *   HomeSettings        — bottom sheet (modal)
 *
 * All presentational JSX lives in components/home/*. This file is state +
 * wiring only. See docs/PRODUCT_DESIGN.md for the product loop.
 */
import React, { useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { UserMode } from '@/types/game';
import { CGMProvider } from '@/types/health';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
import { useCGMConnection } from '@/hooks/useCGMConnection';
import { track } from '@/utils/analytics';
import { buildSignalSnapshot } from '@/domain/signals';
import { buildLocalDigest, publishWeeklyDigest } from '@/domain/digest';
import {
  buildSelfReportedPattern,
  resolvePattern,
  type SelfReportedMoment,
  type MetabolicPattern,
} from '@/domain/patterns';
import {
  AMINA_DEMO,
  getAminaDay,
  buildAminaClinicianDigest,
} from '@/domain/demo';
import { selectMission, type ProgrammeMission } from '@/domain/programme';
import {
  buildPersonalisedWorldState,
  type WorldResponse,
} from '@/domain/agent';
import { RoleSelector } from '@/components/home/RoleSelector';
import { SignalSourcePicker } from '@/components/home/SignalSourcePicker';
import { ManualCheckIn } from '@/components/home/ManualCheckIn';
import { ConversationHome } from '@/components/home/ConversationHome';
import { HomeSettings } from '@/components/home/HomeSettings';
import { HOME_STORAGE_KEYS, type SignalPath } from '@/components/home/types';

interface MainMenuProps {
  onUserModeSelected?: (mode: string) => void;
  userModeSelected?: boolean;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onUserModeSelected,
  userModeSelected,
}) => {
  const {
    progress,
    setUserMode,
    setPrivacyMode,
    updatePrivacySettings,
    completeActiveMission,
    captureMissionOutcome,
    relapseActiveMission,
    setDigestMeta,
    ensureTodayMission,
    setWorldState,
  } = usePlayerProgressContext();

  // --- UI state ---------------------------------------------------------
  const [showSettings, setShowSettings] = useState(false);
  // Conversation-first: skip role selector on first run. User can configure from settings.
  const [showUserModeSelector, setShowUserModeSelector] = useState(false);
  const [showManualCheckIn, setShowManualCheckIn] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [demoDay, setDemoDay] = useState<number>(AMINA_DEMO.defaultDayIndex);
  // missionChoice/missionDeferred track mission lifecycle internally;
  // ConversationHome reads mission status from progress, not these.
  const [, setMissionChoice] = useState<'accept' | 'easier' | 'not_practical' | null>(null);
  const [, setMissionDeferred] = useState(false);
  // Conversation-first: signal path is "chosen" by default (general habit mode).
  // User can change from settings.
  const [signalPathChosen, setSignalPathChosen] = useState(true);
  const [changingSignalSource, setChangingSignalSource] = useState(false);
  const [manualMoment, setManualMoment] = useState<SelfReportedMoment | null>(null);
  const [missionOverride, setMissionOverride] = useState<ProgrammeMission | null>(null);

  // --- Signal / pattern -------------------------------------------------
  const cgm = useCGMConnection();
  const dexcomConfigured = Boolean(process.env.EXPO_PUBLIC_DEXCOM_CLIENT_ID);
  const liveSignalAvailable = dexcomConfigured || cgm.healthKitAvailable;
  const defaultSignalProvider: CGMProvider = dexcomConfigured ? 'dexcom' : 'libre';

  const signalSnapshot = buildSignalSnapshot({
    connected: cgm.connection.isConnected,
    provider: cgm.connection.provider,
    readings: cgm.readings,
    latestReading: cgm.latestReading,
    privacyMode: progress.privacyMode,
  });

  const missionInputSource = demoMode
    ? 'demo'
    : manualMoment
      ? 'manual'
      : signalSnapshot.connected
        ? 'cgm'
        : 'general';
  const amina = useMemo(() => (demoMode ? getAminaDay(demoDay) : null), [demoMode, demoDay]);
  const pattern = useMemo(
    () => {
      if (manualMoment && !demoMode) return buildSelfReportedPattern(manualMoment);
      return resolvePattern({
        readings: demoMode ? amina?.readings : cgm.readings,
        snapshot: signalSnapshot,
        useDemo: demoMode,
        demoDayIndex: demoDay,
      });
    },
    // Depend on stable signal fields — snapshot object is rebuilt each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      demoMode,
      demoDay,
      manualMoment,
      amina?.readings,
      cgm.readings,
      signalSnapshot.connected,
      signalSnapshot.trend,
      signalSnapshot.readingCount,
      signalSnapshot.minimized.band,
    ],
  );
  const displayMission = demoMode ? amina?.mission ?? null : missionOverride || progress.activeMission;
  // --- Hydration --------------------------------------------------------
  useEffect(() => {
    AsyncStorage.multiGet([
      HOME_STORAGE_KEYS.demo,
      HOME_STORAGE_KEYS.demoDay,
      HOME_STORAGE_KEYS.deferred,
      HOME_STORAGE_KEYS.signalPath,
    ]).then((pairs) => {
      const [demoVal, dayVal, deferredVal, signalPathVal] = pairs.map((p) => p[1]);
      // If signal path was never chosen, default to 'general' (without_signal).
      // Conversation-first: don't block on signal picker.
      if (signalPathVal !== '1') {
        persistSignalPath('without_signal');
        setSignalPathChosen(true);
      }
      if (demoVal === '1') setDemoMode(true);
      if (dayVal != null) {
        const n = Number(dayVal);
        if (Number.isFinite(n)) setDemoDay(n);
      }
      if (deferredVal) {
        try {
          const parsed = JSON.parse(deferredVal) as { dateKey?: string };
          const today = new Date();
          const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          if (parsed.dateKey === key) {
            setMissionDeferred(true);
            setMissionChoice('accept');
          }
        } catch {
          /* ignore */
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!showUserModeSelector && !demoMode) {
      ensureTodayMission(signalSnapshot);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showUserModeSelector, cgm.connection.isConnected, progress.userMode, demoMode]);

  // A new mission re-arms the support proposal.
  useEffect(() => {
  }, [displayMission?.templateId]);

  useEffect(() => {
    if (missionOverride && progress.activeMission?.id === missionOverride.id) {
      setMissionOverride(null);
    }
  }, [missionOverride, progress.activeMission?.id]);

  useEffect(() => {
    if (cgm.connection.isConnected && !demoMode) {
      cgm.syncReadings(180).catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cgm.connection.isConnected, demoMode]);

  useEffect(() => {
    if (showUserModeSelector) {
      track('user_mode_selector_shown', { privacy_mode: progress.privacyMode });
    }
  }, [showUserModeSelector, progress.privacyMode]);

  // --- Demo controls ----------------------------------------------------
  const setDemo = async (on: boolean, startDay?: number) => {
    setDemoMode(on);
    setMissionChoice(null);
    setMissionOverride(null);
    await AsyncStorage.setItem(HOME_STORAGE_KEYS.demo, on ? '1' : '0');
    track('demo_amina_toggled', { on });
    if (on) {
      const day = startDay ?? AMINA_DEMO.scenes.pattern;
      setDemoDay(day);
      await AsyncStorage.setItem(HOME_STORAGE_KEYS.demoDay, String(day));
    }
  };

  const jumpDemoDay = async (next: number) => {
    const clamped = Math.max(0, Math.min(AMINA_DEMO.totalDays - 1, next));
    setDemoDay(clamped);
    setMissionChoice(null);
    await AsyncStorage.setItem(HOME_STORAGE_KEYS.demoDay, String(clamped));
    track('demo_amina_day_jump', { day: clamped });
  };

  // --- Mission assignment ----------------------------------------------
  const assignFromPattern = (
    templateId?: string,
    response: WorldResponse = 'ready',
    sourcePattern: MetabolicPattern = pattern,
  ) => {
    if (demoMode) return;
    const selected = selectMission({
      userMode: progress.userMode,
      snapshot: signalSnapshot,
      activeMission: null,
      missionHistory: progress.missionHistory,
      forceTemplateId: templateId || pattern.suggestedBehaviour,
    });
    setMissionOverride(selected);
    ensureTodayMission(signalSnapshot, selected.templateId);
    setWorldState(buildPersonalisedWorldState(sourcePattern, selected, response));
  };

  const deferMission = async () => {
    const mission = displayMission || selectMission({
      userMode: progress.userMode,
      forceTemplateId: pattern.suggestedBehaviour,
      activeMission: null,
    });
    await AsyncStorage.setItem(HOME_STORAGE_KEYS.deferred, JSON.stringify({ dateKey: mission.dateKey }));
    setMissionDeferred(true);
    setMissionChoice('accept');
    if (!demoMode) setWorldState(buildPersonalisedWorldState(pattern, mission, 'later'));
    track('mission_deferred', {
      template_id: mission.templateId,
      from: 'home_pattern_card',
      demo: demoMode,
      input_source: missionInputSource,
    });
    track('mission_response_selected', {
      choice: 'later',
      template_id: mission.templateId,
      input_source: missionInputSource,
    });
  };

  // --- Signal path ------------------------------------------------------
  const persistSignalPath = async (path: SignalPath) => {
    setSignalPathChosen(true);
    await AsyncStorage.setItem(HOME_STORAGE_KEYS.signalPath, '1');
    track('signal_path_selected', { path, privacy_mode: progress.privacyMode });
  };

  const beginSignalSourceChange = () => {
    setChangingSignalSource(true);
    setShowManualCheckIn(false);
    setShowSettings(false);
    setSignalPathChosen(false);
    track('signal_source_change_opened', {
      current_source: missionInputSource,
      privacy_mode: progress.privacyMode,
    });
  };

  const returnToCurrentSource = () => {
    setChangingSignalSource(false);
    setShowManualCheckIn(false);
    setSignalPathChosen(true);
  };

  const acceptSignalConnection = async (provider: CGMProvider) => {
    if (demoMode) await setDemo(false);
    setManualMoment(null);
    await persistSignalPath('connect');
    setChangingSignalSource(false);
    cgm.connect(provider);
  };

  const chooseSignalPath = async (path: SignalPath) => {
    if (path === 'connect') {
      // Handled inside SignalSourcePicker (it opens the disclaimer modal).
      return;
    }
    if (path === 'manual') {
      if (demoMode) await setDemo(false);
      setShowManualCheckIn(true);
      track('manual_signal_started', { privacy_mode: progress.privacyMode });
      return;
    }
    if (path === 'without_signal') {
      if (demoMode) await setDemo(false);
      setManualMoment(null);
    }
    await persistSignalPath(path);
    setChangingSignalSource(false);
    if (path === 'demo') {
      setManualMoment(null);
      await setDemo(true, AMINA_DEMO.scenes.pattern);
    }
  };

  const chooseManualMoment = async (moment: SelfReportedMoment) => {
    if (demoMode) await setDemo(false);
    setManualMoment(moment);
    await persistSignalPath('manual');
    setChangingSignalSource(false);
    setShowManualCheckIn(false);
    assignFromPattern(moment.templateId, 'ready', buildSelfReportedPattern(moment));
    track('manual_signal_submitted', {
      moment: moment.id,
      template_id: moment.templateId,
      privacy_mode: progress.privacyMode,
    });
  };

  const openSignalConnection = (provider: CGMProvider = defaultSignalProvider) => {
    // Routed through SignalSourcePicker when shown; here it's only called
    // from HomeSettings, which delegates back to the picker by opening a
    // signal-source change.
    if ((provider === 'dexcom' && !dexcomConfigured) || (provider === 'libre' && !cgm.healthKitAvailable)) {
      // No live availability modal here — HomeSettings doesn't host one.
      // Fall through to the picker, which does.
      beginSignalSourceChange();
      return;
    }
    setChangingSignalSource(true);
    setSignalPathChosen(false);
    // The picker will open the disclaimer for this provider.
    // We persist the requested provider via a transient ref-like state by
    // reusing the picker's own internal state.
    track('signal_connection_chosen', { available: liveSignalAvailable, privacy_mode: progress.privacyMode });
  };

  const openCareTeamSummary = async () => {
    const digest = demoMode
      ? buildAminaClinicianDigest(demoDay)
      : buildLocalDigest({
          adherence: progress.adherenceWeek,
          missionHistory: progress.missionHistory,
          patientLabel: progress.userMode ? `Programme member · ${progress.userMode}` : 'Programme member',
          recurringPatterns: [pattern.headline],
          dataCoverage: signalSnapshot.connected
            ? `CGM connected · ${signalSnapshot.readingCount} readings in snapshot`
            : 'No CGM · adherence only',
        });
    const published = await publishWeeklyDigest(digest);
    if (published?.token) {
      setDigestMeta(published.token);
      track('weekly_digest_created', { week: digest.weekKey, mode: 'clinician' });
      router.push({ pathname: '/digest/[token]' as any, params: { token: published.token } });
    }
  };

  // --- Render -----------------------------------------------------------
  // Conversation-first: always show ConversationHome immediately.
  // Role and signal configuration happen in settings (HomeSettings).
  // The only exception is if the user explicitly opens role/signal pickers from settings.
  
  if (showUserModeSelector) {
    return (
      <RoleSelector
        privacyMode={progress.privacyMode}
        pattern={pattern}
        signalSnapshot={signalSnapshot}
        onSelect={(mode: UserMode) => {
          setUserMode(mode);
          setShowUserModeSelector(false);
          onUserModeSelected?.(mode);
        }}
      />
    );
  }

  if (!signalPathChosen) {
    if (showManualCheckIn) {
      return (
        <ManualCheckIn
          userMode={progress.userMode}
          changingSignalSource={changingSignalSource}
          onBack={() => {
            if (changingSignalSource) returnToCurrentSource();
            else setShowManualCheckIn(false);
          }}
          onSelect={chooseManualMoment}
        />
      );
    }
    return (
      <SignalSourcePicker
        changingSignalSource={changingSignalSource}
        liveSignalAvailable={liveSignalAvailable}
        dexcomConfigured={dexcomConfigured}
        healthKitAvailable={cgm.healthKitAvailable}
        defaultProvider={defaultSignalProvider}
        privacyMode={progress.privacyMode}
        pattern={pattern}
        signalSnapshot={signalSnapshot}
        onChoosePath={chooseSignalPath}
        onKeepCurrent={returnToCurrentSource}
        onAcceptConnection={acceptSignalConnection}
      />
    );
  }

  return (
    <>
      <ConversationHome
        mission={displayMission}
        pattern={pattern}
        signalSnapshot={signalSnapshot}
        userMode={progress.userMode}
        demoMode={demoMode}
        onOpenSettings={() => setShowSettings(true)}
        onOpenCharter={() => {
          track('charter_opened', { from: 'home_topbar' });
          router.push('/charter');
        }}
        onOpenCareTeamSummary={openCareTeamSummary}
        onAccept={() => {
          setMissionChoice('accept');
          setMissionDeferred(false);
          assignFromPattern(pattern.suggestedBehaviour, 'ready');
          track('mission_accepted', { template: pattern.suggestedBehaviour, demo: demoMode });
          track('role_to_mission_accepted', { template: pattern.suggestedBehaviour, demo: demoMode });
          track('mission_response_selected', {
            choice: 'do_now',
            template_id: pattern.suggestedBehaviour,
            input_source: missionInputSource,
          });
        }}
        onMakeEasier={() => {
          setMissionChoice('easier');
          setMissionDeferred(false);
          assignFromPattern(pattern.suggestedBehaviour, 'easier');
          track('mission_made_easier', { template: pattern.suggestedBehaviour });
          track('role_to_mission_accepted', { template: pattern.suggestedBehaviour, variant: 'easier' });
          track('mission_response_selected', {
            choice: 'easier',
            template_id: pattern.suggestedBehaviour,
            input_source: missionInputSource,
          });
        }}
        onNotPractical={() => {
          setMissionChoice('not_practical');
          track('mission_not_practical', { template: pattern.suggestedBehaviour });
          track('mission_response_selected', {
            choice: 'not_practical',
            template_id: pattern.suggestedBehaviour,
            input_source: missionInputSource,
          });
        }}
        onMarkDone={() => {
          if (!demoMode) completeActiveMission();
          if (!demoMode && displayMission) {
            setWorldState(buildPersonalisedWorldState(pattern, displayMission, 'completed'));
          }
          setMissionDeferred(false);
        }}
        onLater={deferMission}
        onRelapse={() => {
          if (!demoMode) relapseActiveMission();
          setMissionDeferred(false);
        }}
        onCaptureOutcome={(outcome, reflection) => {
          if (!demoMode) captureMissionOutcome(outcome, reflection);
        }}
      />

      <HomeSettings
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        demoMode={demoMode}
        onToggleDemo={(on) => setDemo(on)}
        onJumpDemoDay={jumpDemoDay}
        cgm={{
          isConnected: cgm.connection.isConnected,
          provider: cgm.connection.provider,
          latestReading: cgm.latestReading,
          disconnect: cgm.disconnect,
        }}
        dexcomConfigured={dexcomConfigured}
        healthKitAvailable={cgm.healthKitAvailable}
        liveSignalAvailable={liveSignalAvailable}
        onChangeSignalSource={beginSignalSourceChange}
        onOpenSignalConnection={openSignalConnection}
        onShowSignalAvailability={beginSignalSourceChange}
        privacyMode={progress.privacyMode}
        onSetPrivacyMode={setPrivacyMode}
        privacySettings={
          progress.privacySettings || {
            mode: 'standard',
            encryptHealthData: false,
            glucoseLevels: 'public',
            insulinDoses: 'public',
            achievements: 'public',
            gameStats: 'public',
            healthProfile: 'public',
          }
        }
        onUpdatePrivacySettings={updatePrivacySettings}
      />
    </>
  );
};
