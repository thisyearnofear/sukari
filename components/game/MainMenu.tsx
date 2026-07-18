import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  ScrollView,
  Modal,
  TextInput,
  Share,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ControlMode, UserMode } from '@/types/game';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
import { USER_MODE_CONFIGS } from '@/constants/userModes';
import { PrivacyToggle } from '@/components/PrivacyToggle';
import { PrivacySettingsModal } from '@/components/PrivacySettings';
import { useWeb3 } from '@/context/Web3Context';
import { useBeam } from '@/context/BeamContext';
import { RoleBadgeModal } from '@/components/game/RoleBadgeModal';
import { COLORS, FONTS, ANIMATIONS } from '@/constants/designSystem';
import { GrandLibrary } from '@/components/game/GrandLibrary';
import { BeamAssets } from '@/components/game/BeamAssets';
import { track } from '@/utils/analytics';
import { useCGMConnection } from '@/hooks/useCGMConnection';
import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';
import { useCoach } from '@/hooks/useCoach';
import { buildSignalSnapshot } from '@/domain/signals';
import { buildLocalDigest, publishWeeklyDigest } from '@/domain/digest';
import { buildSupportInvite, supportShareMessage } from '@/domain/invite';
import { resolvePattern } from '@/domain/patterns';
import {
  MAYA_DEMO,
  getMayaDay,
  mayaLoopSteps,
  buildMayaClinicianDigest,
} from '@/domain/demo';
import { selectMission } from '@/domain/programme';
import { MetabolicField } from '@/components/atmosphere/MetabolicField';
import { PressableScale } from '@/components/ui/PressableScale';
import {
  PatternMissionCard,
  MissionEase,
} from '@/components/programme/PatternMissionCard';
import { LoopStrip } from '@/components/programme/LoopStrip';
import { QuietWinBeat } from '@/components/programme/QuietWinBeat';

const maxWidth = 400;
const P = COLORS.PROGRAMME;
const DEMO_KEY = 'glucoseWars.demoMaya';
const DEMO_DAY_KEY = 'glucoseWars.demoMayaDay';
const DEFERRED_KEY = 'glucoseWars.missionDeferred';

interface MainMenuProps {
  onStartGame: (controlMode: ControlMode) => void;
  onSelectGame: () => void;
  onUserModeSelected?: (mode: string) => void;
  userModeSelected?: boolean;
  onViewStats?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onSelectGame,
  onUserModeSelected,
  userModeSelected,
}) => {
  const [selectedMode, setSelectedMode] = useState<ControlMode>('swipe');
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const {
    progress,
    setUserMode,
    setPrivacyMode,
    updatePrivacySettings,
    setSkipOnboarding,
    completeActiveMission,
    setDigestMeta,
    ensureTodayMission,
  } = usePlayerProgressContext();
  const [showUserModeSelector, setShowUserModeSelector] = useState(userModeSelected === false);
  const [selectedRole, setSelectedRole] = useState<UserMode | null>(null);
  const [showMintModal, setShowMintModal] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showTreasury, setShowTreasury] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCGMDisclaimer, setShowCGMDisclaimer] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [coachInput, setCoachInput] = useState('');
  const [demoMode, setDemoMode] = useState(false);
  const [demoDay, setDemoDay] = useState<number>(MAYA_DEMO.defaultDayIndex);
  const [missionChoice, setMissionChoice] = useState<MissionEase | null>(null);
  const [missionDeferred, setMissionDeferred] = useState(false);
  const [showQuietWin, setShowQuietWin] = useState(false);
  const cgm = useCGMConnection();
  const coach = useCoach();
  const { isConnected, address, connectWallet, disconnectWallet } = useWeb3();
  const beamContext = useBeam();
  const playerAccount = beamContext?.playerAccount;
  const showSyncFeedback = beamContext?.showSyncFeedback;
  const [showWelcome, setShowWelcome] = useState(false);
  const welcomeAnim = useRef(new Animated.Value(-80)).current;
  const enterAnim = useRef(new Animated.Value(0)).current;

  const signalSnapshot = buildSignalSnapshot({
    connected: cgm.connection.isConnected,
    provider: cgm.connection.provider,
    readings: cgm.readings,
    latestReading: cgm.latestReading,
    privacyMode: progress.privacyMode,
  });

  const band = signalSnapshot.minimized.band;
  const maya = useMemo(() => (demoMode ? getMayaDay(demoDay) : null), [demoMode, demoDay]);
  const pattern = useMemo(
    () =>
      resolvePattern({
        readings: demoMode ? maya?.readings : cgm.readings,
        snapshot: signalSnapshot,
        useDemo: demoMode,
        demoDayIndex: demoDay,
      }),
    // Depend on stable signal fields — snapshot object is rebuilt each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      demoMode,
      demoDay,
      maya?.readings,
      cgm.readings,
      signalSnapshot.connected,
      signalSnapshot.trend,
      signalSnapshot.readingCount,
      signalSnapshot.minimized.band,
    ],
  );
  const displayMission = demoMode ? maya?.mission ?? null : progress.activeMission;
  const loopSteps = useMemo(() => {
    if (demoMode) return mayaLoopSteps(demoDay);
    const status = progress.activeMission?.status;
    const practiced = status === 'practiced' || status === 'completed';
    const done = status === 'completed';
    return [
      { key: 'detect', title: 'Detect', done: true, active: false },
      { key: 'mission', title: 'Mission', done: !!missionChoice || practiced, active: !missionChoice && !practiced },
      { key: 'rehearse', title: 'Rehearse', done: practiced, active: !!missionChoice && !practiced },
      { key: 'act', title: 'Act', done: done, active: practiced && !done },
      { key: 'measure', title: 'Measure', done: false, active: done },
      { key: 'adapt', title: 'Care team', done: false, active: false },
    ];
  }, [demoMode, demoDay, progress.activeMission?.status, missionChoice]);

  useEffect(() => {
    AsyncStorage.multiGet([DEMO_KEY, DEMO_DAY_KEY, DEFERRED_KEY]).then((pairs) => {
      const demoVal = pairs[0][1];
      const dayVal = pairs[1][1];
      const deferredVal = pairs[2][1];
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
  }, []);

  useEffect(() => {
    if (!showUserModeSelector && !demoMode) {
      ensureTodayMission(signalSnapshot);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showUserModeSelector, cgm.connection.isConnected, progress.userMode, demoMode]);

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

  useEffect(() => {
    if (playerAccount && !showWelcome) {
      setShowWelcome(true);
      const { duration, bezier } = ANIMATIONS.MOTION.toast;
      const ease = Easing.bezier(bezier[0], bezier[1], bezier[2], bezier[3]);
      Animated.sequence([
        Animated.timing(welcomeAnim, { toValue: 48, duration, easing: ease, useNativeDriver: true }),
        Animated.delay(2800),
        Animated.timing(welcomeAnim, {
          toValue: -80,
          duration: ANIMATIONS.MOTION.exit.duration,
          easing: Easing.bezier(
            ANIMATIONS.MOTION.exit.bezier[0],
            ANIMATIONS.MOTION.exit.bezier[1],
            ANIMATIONS.MOTION.exit.bezier[2],
            ANIMATIONS.MOTION.exit.bezier[3],
          ),
          useNativeDriver: true,
        }),
      ]).start(() => setShowWelcome(false));
    }
  }, [playerAccount, showWelcome, welcomeAnim]);

  useEffect(() => {
    if (showUserModeSelector) return;
    const { duration, bezier } = ANIMATIONS.MOTION.enter;
    Animated.timing(enterAnim, {
      toValue: 1,
      duration,
      easing: Easing.bezier(bezier[0], bezier[1], bezier[2], bezier[3]),
      useNativeDriver: true,
    }).start();
  }, [enterAnim, showUserModeSelector]);

  const setDemo = async (on: boolean, startDay?: number) => {
    setDemoMode(on);
    setMissionChoice(null);
    await AsyncStorage.setItem(DEMO_KEY, on ? '1' : '0');
    track('demo_maya_toggled', { on });
    if (on) {
      const day = startDay ?? MAYA_DEMO.scenes.pattern;
      setDemoDay(day);
      await AsyncStorage.setItem(DEMO_DAY_KEY, String(day));
    }
  };

  const jumpDemoDay = async (next: number) => {
    const clamped = Math.max(0, Math.min(MAYA_DEMO.totalDays - 1, next));
    setDemoDay(clamped);
    setMissionChoice(null);
    await AsyncStorage.setItem(DEMO_DAY_KEY, String(clamped));
    track('demo_maya_day_jump', { day: clamped });
  };

  const assignFromPattern = (templateId?: string) => {
    if (demoMode) return;
    ensureTodayMission(signalSnapshot, templateId || pattern.suggestedBehaviour);
  };

  const openCareTeamSummary = async () => {
    const digest = demoMode
      ? buildMayaClinicianDigest(demoDay)
      : buildLocalDigest({
          adherence: progress.adherenceWeek,
          missionHistory: progress.missionHistory,
          gamesPlayedThisWeekApprox: Math.min(progress.gamesPlayed, 14),
          patientLabel: progress.userMode ? `Programme member · ${progress.userMode}` : 'Programme member',
          recurringPatterns: [pattern.headline],
          dataCoverage: signalSnapshot.connected
            ? `CGM connected · ${signalSnapshot.readingCount} readings in snapshot`
            : 'No CGM · adherence + practice only',
        });
    const published = await publishWeeklyDigest(digest);
    if (published?.token) {
      setDigestMeta(published.token);
      track('weekly_digest_created', { week: digest.weekKey, mode: 'clinician' });
      router.push({ pathname: '/digest/[token]' as any, params: { token: published.token } });
    }
  };

  if (showUserModeSelector) {
    return (
      <View style={styles.root}>
        <MetabolicField band="unknown" intensity={0.35} />
        <ScrollView
          style={styles.zContent}
          contentContainerStyle={styles.roleScroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.brandMark}>Glucose Wars</Text>
          <Text style={styles.roleHeadline}>Who is this programme for?</Text>
          <Text style={styles.roleSub}>
            One choice. Changes how missions and coaching are framed — you can change it later.
          </Text>

          <View style={styles.roleList}>
            {(Object.keys(USER_MODE_CONFIGS) as UserMode[]).map((mode) => {
              const config = USER_MODE_CONFIGS[mode];
              return (
                <PressableScale
                  key={mode}
                  onPress={() => {
                    setSelectedRole(mode);
                    setUserMode(mode);
                    setShowUserModeSelector(false);
                    track('user_mode_selected', { user_mode: mode, privacy_mode: progress.privacyMode });
                    onUserModeSelected?.(mode);
                  }}
                  accessibilityLabel={`${config.name}. ${config.description}`}
                  accessibilityRole="button"
                  style={styles.roleRow}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roleName}>{config.name}</Text>
                    <Text style={styles.roleDesc}>{config.subtitle}</Text>
                  </View>
                  <Text style={styles.roleArrow}>→</Text>
                </PressableScale>
              );
            })}
          </View>
        </ScrollView>

        <RoleBadgeModal
          visible={showMintModal}
          onClose={() => setShowMintModal(false)}
          role={selectedRole}
          userMode={progress.userMode}
          onMintSuccess={() => setShowMintModal(false)}
        />
      </View>
    );
  }

  const signalLine = demoMode
    ? `${MAYA_DEMO.patientLabel} · ${maya?.label}`
    : signalSnapshot.connected
      ? `CGM · ${band.replace('_', ' ')}${signalSnapshot.trend ? ` · ${signalSnapshot.trend}` : ''}`
      : 'No CGM · missions use programme defaults';

  const homeBand =
    demoMode
      ? 'high'
      : progress.activeMission?.status === 'completed'
        ? 'in_range'
        : missionDeferred
          ? 'high'
          : band;

  const homeIntensity =
    progress.activeMission?.status === 'completed'
      ? 0.4
      : missionDeferred
        ? 0.7
        : homeBand === 'unknown'
          ? 0.4
          : 0.6;

  return (
    <View style={styles.root}>
      <MetabolicField band={homeBand} intensity={homeIntensity} />

      {showWelcome && (
        <Animated.View style={[styles.toast, { transform: [{ translateY: welcomeAnim }] }]}>
          <Text style={styles.toastTitle}>Signed in</Text>
          <Text style={styles.toastBody}>Progress sync is available.</Text>
        </Animated.View>
      )}

      <View style={styles.topBar}>
        <View>
          <Text style={styles.topEyebrow}>Metabolic programme</Text>
          <Text style={styles.topMeta}>
            {demoMode ? 'Demo timeline' : 'One mission a day'}
            {showSyncFeedback ? ' · synced' : ''}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowSettings(true)}
          accessibilityLabel="Open settings"
          accessibilityRole="button"
          style={styles.iconBtn}
        >
          <Ionicons name="settings-outline" size={20} color={P.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.zContent}
        contentContainerStyle={styles.homeScroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            width: '100%',
            maxWidth,
            opacity: enterAnim,
            transform: [
              {
                translateY: enterAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          }}
        >
          <Text style={styles.brandMark}>Glucose Wars</Text>
          <Text style={styles.tagline}>One mission today. Better evidence for tomorrow.</Text>
          <Text style={styles.signalLine}>{signalLine}</Text>

          {!demoMode ? (
            <PressableScale
              onPress={() => setDemo(true, MAYA_DEMO.scenes.pattern)}
              style={styles.judgeBar}
              accessibilityRole="button"
              accessibilityLabel="Start Maya demo for judging"
            >
              <Text style={styles.judgeBarTitle}>Judging? Start Maya demo</Text>
              <Text style={styles.judgeBarSub}>
                Synthetic 14-day closed loop · no OAuth required →
              </Text>
            </PressableScale>
          ) : (
            <View style={styles.judgeScenes}>
              <Text style={styles.judgeScenesLabel}>Demo scenes</Text>
              <View style={styles.judgeSceneRow}>
                <PressableScale
                  onPress={() => jumpDemoDay(MAYA_DEMO.scenes.pattern)}
                  style={[
                    styles.sceneChip,
                    demoDay === MAYA_DEMO.scenes.pattern && styles.sceneChipOn,
                  ]}
                >
                  <Text style={styles.sceneChipText}>1 · Pattern</Text>
                </PressableScale>
                <PressableScale
                  onPress={() => jumpDemoDay(MAYA_DEMO.scenes.measure)}
                  style={[
                    styles.sceneChip,
                    demoDay === MAYA_DEMO.scenes.measure && styles.sceneChipOn,
                  ]}
                >
                  <Text style={styles.sceneChipText}>2 · Measure</Text>
                </PressableScale>
                <PressableScale
                  onPress={async () => {
                    await jumpDemoDay(MAYA_DEMO.scenes.outreach);
                  }}
                  style={[
                    styles.sceneChip,
                    demoDay >= MAYA_DEMO.scenes.outreach && styles.sceneChipOn,
                  ]}
                >
                  <Text style={styles.sceneChipText}>3 · Outreach</Text>
                </PressableScale>
                <PressableScale
                  onPress={() => openCareTeamSummary()}
                  style={styles.sceneChip}
                >
                  <Text style={styles.sceneChipText}>Care team</Text>
                </PressableScale>
              </View>
              <PressableScale onPress={() => setDemo(false)} style={styles.exitDemo}>
                <Text style={styles.exitDemoText}>Exit demo</Text>
              </PressableScale>
            </View>
          )}

          <View style={{ marginTop: demoMode ? 22 : 12 }}>
            {demoMode ? <LoopStrip steps={loopSteps} /> : null}
          </View>

          {demoMode ? (
            <View style={styles.demoControls}>
              <Text style={styles.demoHint}>{MAYA_DEMO.disclaimer}</Text>
              <View style={styles.demoRow}>
                <PressableScale
                  onPress={() => jumpDemoDay(demoDay - 1)}
                  style={styles.demoChip}
                  accessibilityRole="button"
                >
                  <Text style={styles.demoChipText}>← Prior day</Text>
                </PressableScale>
                <Text style={styles.demoDayLabel}>{maya?.label}</Text>
                <PressableScale
                  onPress={() => jumpDemoDay(demoDay + 1)}
                  style={styles.demoChip}
                  accessibilityRole="button"
                >
                  <Text style={styles.demoChipText}>Time jump →</Text>
                </PressableScale>
              </View>
            </View>
          ) : null}

          <View style={{ marginTop: 8, marginBottom: 20 }}>
            <PatternMissionCard
              pattern={pattern}
              mission={displayMission}
              outcome={maya?.outcome}
              reflection={maya?.reflection}
              demoLabel={demoMode ? MAYA_DEMO.disclaimer : null}
              missionChoice={missionChoice}
              deferred={missionDeferred && !demoMode}
              onAccept={() => {
                setMissionChoice('accept');
                setMissionDeferred(false);
                assignFromPattern(pattern.suggestedBehaviour);
                track('mission_accepted', { template: pattern.suggestedBehaviour, demo: demoMode });
              }}
              onMakeEasier={() => {
                setMissionChoice('easier');
                setMissionDeferred(false);
                assignFromPattern(pattern.suggestedBehaviour);
                track('mission_made_easier', { template: pattern.suggestedBehaviour });
              }}
              onChooseAnother={() => {
                setMissionChoice('another');
                setMissionDeferred(false);
                assignFromPattern('protein_first');
                track('mission_choose_another', { from: pattern.suggestedBehaviour });
              }}
              onNotPractical={() => {
                setMissionChoice('not_practical');
                track('mission_not_practical', { template: pattern.suggestedBehaviour });
              }}
              onMarkDone={() => {
                if (!demoMode) completeActiveMission();
                setMissionDeferred(false);
                AsyncStorage.removeItem(DEFERRED_KEY);
                setShowQuietWin(true);
                track('mission_marked_done', { from: 'home_pattern_card', demo: demoMode });
              }}
            />
          </View>

          <PressableScale
            onPress={() => {
              if (!missionChoice || missionChoice === 'not_practical') {
                setMissionChoice('accept');
              }
              if (!demoMode) {
                const template =
                  missionChoice === 'another'
                    ? 'protein_first'
                    : pattern.suggestedBehaviour;
                assignFromPattern(template);
              }
              onStartGame(selectedMode);
            }}
            accessibilityLabel="Rehearse today’s mission in a short battle"
            accessibilityRole="button"
            style={styles.primaryCta}
          >
            <Text style={styles.primaryCtaText}>Rehearse in 45 seconds</Text>
            <Text style={styles.primaryCtaSub}>Practice the decision — then do it in real life</Text>
          </PressableScale>

          <View style={styles.secondaryRow}>
            <TouchableOpacity onPress={() => setShowCoach(true)} accessibilityRole="button">
              <Text style={styles.link}>Coach</Text>
            </TouchableOpacity>
            <Text style={styles.dot}>·</Text>
            <TouchableOpacity
              onPress={async () => {
                const mission =
                  displayMission ||
                  selectMission({
                    userMode: progress.userMode,
                    forceTemplateId: pattern.suggestedBehaviour,
                    activeMission: null,
                  });
                const invite = buildSupportInvite(mission);
                track('caregiver_invite_shared', { from: 'home', template_id: invite.templateId });
                await Share.share({ message: supportShareMessage(invite) });
              }}
              accessibilityRole="button"
            >
              <Text style={styles.link}>Invite support</Text>
            </TouchableOpacity>
            <Text style={styles.dot}>·</Text>
            <TouchableOpacity onPress={openCareTeamSummary} accessibilityRole="button">
              <Text style={styles.link}>Care team summary</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerHint}>
            Habits only — never dosing or diagnosis. The game is rehearsal; the product is adherence.
          </Text>
        </Animated.View>
      </ScrollView>

      {showQuietWin ? (
        <QuietWinBeat
          message="Logged. Come back tomorrow for the next experiment."
          onDone={() => setShowQuietWin(false)}
        />
      ) : null}

      <Modal
        visible={showSettings}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)} accessibilityRole="button">
                <Text style={styles.link}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <SettingsSection title="Demo (judges)">
                <TouchableOpacity
                  onPress={() => setDemo(!demoMode)}
                  accessibilityRole="switch"
                  style={styles.switchRow}
                >
                  <View>
                    <Text style={styles.sheetBody}>
                      {demoMode ? 'Maya demo on' : 'Maya demo off'}
                    </Text>
                    <Text style={styles.sheetMuted}>Synthetic 14-day closed-loop timeline</Text>
                  </View>
                  <View
                    style={[
                      styles.switchTrack,
                      { backgroundColor: demoMode ? P.accent : P.line },
                    ]}
                  >
                    <View
                      style={[
                        styles.switchThumb,
                        demoMode ? { marginLeft: 18 } : { marginLeft: 2 },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
                {demoMode ? (
                  <>
                    <SheetButton
                      label="Jump to measured-response day"
                      onPress={() => {
                        jumpDemoDay(MAYA_DEMO.scenes.measure);
                        setShowSettings(false);
                      }}
                    />
                    <SheetButton
                      label="Jump to outreach / escalation day"
                      onPress={() => {
                        jumpDemoDay(MAYA_DEMO.scenes.outreach);
                        setShowSettings(false);
                      }}
                    />
                  </>
                ) : null}
              </SettingsSection>

              <SettingsSection title="Signals">
                {cgm.connection.isConnected ? (
                  <View style={styles.switchRow}>
                    <View>
                      <Text style={styles.sheetBody}>
                        {cgm.connection.provider === 'libre' ? 'Apple Health' : 'Dexcom'} connected
                      </Text>
                      {cgm.latestReading && (
                        <Text style={styles.sheetMuted}>
                          Latest {cgm.latestReading.value} mg/dL
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity onPress={cgm.disconnect} accessibilityRole="button">
                      <Text style={[styles.link, { color: P.danger }]}>Disconnect</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <SheetButton label="Connect Dexcom" onPress={() => setShowCGMDisclaimer(true)} />
                    {cgm.healthKitAvailable && (
                      <SheetButton label="Connect Apple Health" onPress={() => cgm.connect('libre')} />
                    )}
                    <Text style={styles.sheetMuted}>Fuels pattern → mission selection</Text>
                  </>
                )}
              </SettingsSection>

              <SettingsSection title="Practice">
                <SheetButton
                  label="Customize practice"
                  onPress={() => {
                    setShowSettings(false);
                    onSelectGame?.();
                  }}
                />
                <View style={styles.controlRow}>
                  {(['swipe', 'tap'] as ControlMode[]).map((mode) => (
                    <PressableScale
                      key={mode}
                      onPress={() => setSelectedMode(mode)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: selectedMode === mode }}
                      style={[
                        styles.controlChip,
                        selectedMode === mode && styles.controlChipOn,
                      ]}
                    >
                      <Text
                        style={[
                          styles.controlChipText,
                          selectedMode === mode && styles.controlChipTextOn,
                        ]}
                      >
                        {mode === 'swipe' ? 'Swipe' : 'Tap'}
                      </Text>
                    </PressableScale>
                  ))}
                </View>
                <TouchableOpacity
                  onPress={() => setSkipOnboarding(!progress.skipOnboarding)}
                  accessibilityRole="switch"
                  style={styles.switchRow}
                >
                  <Text style={styles.sheetBody}>
                    {progress.skipOnboarding ? 'Tutorial off' : 'Tutorial on'}
                  </Text>
                  <View
                    style={[
                      styles.switchTrack,
                      { backgroundColor: progress.skipOnboarding ? P.danger : P.accent },
                    ]}
                  >
                    <View
                      style={[
                        styles.switchThumb,
                        progress.skipOnboarding ? { marginLeft: 18 } : { marginLeft: 2 },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              </SettingsSection>

              <SettingsSection title="Privacy">
                <PrivacyToggle
                  currentMode={progress.privacyMode}
                  onToggle={(mode) => setPrivacyMode(mode)}
                />
                <SheetButton label="Privacy details" onPress={() => setShowPrivacySettings(true)} />
              </SettingsSection>

              <SettingsSection title="Optional / advanced">
                <SheetButton
                  label="Historical meal lab (educational)"
                  onPress={() => {
                    setShowSettings(false);
                    router.push('/slowmo' as any);
                  }}
                />
                <SheetButton
                  label="Challenges"
                  onPress={() => {
                    setShowSettings(false);
                    track('challenge_hub_viewed', { source: 'settings' });
                    router.push('/challenge' as any);
                  }}
                />
                <SheetButton
                  label="Library"
                  onPress={() => {
                    setShowSettings(false);
                    setShowLibrary(true);
                  }}
                />
                <BeamWalletButton
                  isConnected={isConnected}
                  address={address}
                  connectWallet={connectWallet}
                  disconnectWallet={disconnectWallet}
                />
                <SheetButton
                  label="Identity treasury (optional)"
                  onPress={() => {
                    setShowSettings(false);
                    setShowTreasury(true);
                  }}
                />
              </SettingsSection>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showCGMDisclaimer} transparent animationType="fade" onRequestClose={() => setShowCGMDisclaimer(false)}>
        <View style={styles.modalCenter}>
          <MedicalDisclaimer
            onAccept={() => {
              setShowCGMDisclaimer(false);
              cgm.connect();
            }}
            onDecline={() => setShowCGMDisclaimer(false)}
          />
        </View>
      </Modal>

      <PrivacySettingsModal
        settings={
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
        onSave={(settings) => {
          updatePrivacySettings(settings);
          setShowPrivacySettings(false);
        }}
        onClose={() => setShowPrivacySettings(false)}
        visible={showPrivacySettings}
      />

      <Modal visible={showLibrary} animationType="slide" onRequestClose={() => setShowLibrary(false)}>
        <GrandLibrary
          discoveredLoreIds={progress.discoveredLoreIds}
          onClose={() => setShowLibrary(false)}
        />
      </Modal>

      <Modal visible={showTreasury} animationType="slide" transparent onRequestClose={() => setShowTreasury(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <BeamAssets onClose={() => setShowTreasury(false)} />
        </View>
      </Modal>

      <Modal visible={showCoach} animationType="slide" transparent onRequestClose={() => setShowCoach(false)}>
        <View style={styles.coachBackdrop}>
          <View style={styles.coachSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Coach</Text>
              <TouchableOpacity onPress={() => setShowCoach(false)} accessibilityRole="button">
                <Text style={styles.link}>Close</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sheetMuted}>Habit coach only — never dosing or medical advice.</Text>
            {displayMission && (
              <Text style={[styles.sheetBody, { marginTop: 10 }]}>
                Today: {displayMission.realWorldAction}
              </Text>
            )}
            <Text style={[styles.insight, { marginTop: 8 }]}>· {pattern.whyThisExperiment}</Text>
            {coach.insights.map((line, i) => (
              <Text key={i} style={styles.insight}>
                · {line}
              </Text>
            ))}
            {coach.chatReply ? (
              <View style={styles.coachReply}>
                <Text style={styles.sheetBody}>{coach.chatReply}</Text>
              </View>
            ) : null}
            <TextInput
              value={coachInput}
              onChangeText={setCoachInput}
              placeholder="Why this mission? Or ask about barriers…"
              placeholderTextColor={P.textMuted}
              style={styles.input}
            />
            <PressableScale
              disabled={coach.isLoading || !coachInput.trim()}
              onPress={async () => {
                const q = coachInput.trim();
                setCoachInput('');
                await coach.ask(q, signalSnapshot);
              }}
              style={[styles.primaryCta, { opacity: coach.isLoading || !coachInput.trim() ? 0.5 : 1 }]}
            >
              <Text style={styles.primaryCtaText}>{coach.isLoading ? 'Thinking…' : 'Ask'}</Text>
            </PressableScale>
          </View>
        </View>
      </Modal>
    </View>
  );
};

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function SheetButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="button" style={styles.sheetBtn}>
      <Text style={styles.sheetBody}>{label}</Text>
      <Text style={styles.roleArrow}>→</Text>
    </TouchableOpacity>
  );
}

const BeamWalletButton: React.FC<{
  isConnected: boolean;
  address: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}> = ({ isConnected, address, connectWallet, disconnectWallet }) => {
  const beamContext = useBeam();
  const playerAccount = beamContext?.playerAccount;
  const login = beamContext?.login;
  const logout = beamContext?.logout;
  const isLoading = beamContext?.isLoading;

  if (playerAccount) {
    const truncatedAddress = `${playerAccount.address.substring(0, 6)}...${playerAccount.address.substring(playerAccount.address.length - 4)}`;
    return (
      <TouchableOpacity onPress={logout} disabled={isLoading} style={styles.sheetBtn}>
        <Text style={styles.sheetBody}>{truncatedAddress} (optional sync)</Text>
      </TouchableOpacity>
    );
  }

  if (isConnected && address) {
    const truncatedAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    return (
      <TouchableOpacity onPress={disconnectWallet} style={styles.sheetBtn}>
        <Text style={styles.sheetBody}>{truncatedAddress}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      <SheetButton
        label={Platform.OS === 'web' ? 'Connect wallet (optional)' : 'Wallet (optional)'}
        onPress={() => {
          void connectWallet();
        }}
      />
      <SheetButton
        label={isLoading ? '…' : 'Continue with social (optional)'}
        onPress={() => {
          if (login) void login();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.ink,
  },
  zContent: {
    flex: 1,
    zIndex: 10,
  },
  topBar: {
    zIndex: 20,
    paddingTop: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topEyebrow: {
    fontFamily: FONTS.bodyMedium,
    color: P.textMuted,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  topMeta: {
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 13,
    marginTop: 2,
  },
  iconBtn: {
    padding: 10,
    borderWidth: 1,
    borderColor: P.line,
    borderRadius: 2,
    backgroundColor: P.mist,
  },
  homeScroll: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 48,
  },
  brandMark: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
  signalLine: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 12,
    marginTop: 10,
  },
  judgeBar: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: P.warn,
    backgroundColor: P.warnSoft,
    borderRadius: 2,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  judgeBarTitle: {
    fontFamily: FONTS.bodyBold,
    color: P.warn,
    fontSize: 13,
  },
  judgeBarSub: {
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },
  judgeScenes: {
    marginTop: 14,
    gap: 8,
  },
  judgeScenesLabel: {
    fontFamily: FONTS.bodyMedium,
    color: P.textMuted,
    fontSize: 10,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  judgeSceneRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sceneChip: {
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.mist,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 2,
  },
  sceneChipOn: {
    borderColor: P.accent,
    backgroundColor: P.accentSoft,
  },
  sceneChipText: {
    fontFamily: FONTS.bodyMedium,
    color: P.textSoft,
    fontSize: 11,
  },
  exitDemo: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  exitDemoText: {
    fontFamily: FONTS.bodyMedium,
    color: P.cool,
    fontSize: 12,
  },
  demoControls: {
    marginBottom: 12,
    gap: 8,
  },
  demoHint: {
    fontFamily: FONTS.body,
    color: P.warn,
    fontSize: 11,
    lineHeight: 16,
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  demoChip: {
    borderWidth: 1,
    borderColor: P.line,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 2,
    backgroundColor: P.mist,
  },
  demoChipText: {
    fontFamily: FONTS.bodyMedium,
    color: P.textSoft,
    fontSize: 12,
  },
  demoDayLabel: {
    fontFamily: FONTS.bodyBold,
    color: P.text,
    fontSize: 12,
  },
  primaryCta: {
    backgroundColor: P.accent,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 2,
    alignItems: 'center',
  },
  primaryCtaText: {
    fontFamily: FONTS.bodyBold,
    color: P.ink,
    fontSize: 16,
    letterSpacing: 0.2,
  },
  primaryCtaSub: {
    fontFamily: FONTS.body,
    color: 'rgba(11, 18, 16, 0.7)',
    fontSize: 12,
    marginTop: 5,
  },
  secondaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 4,
  },
  link: {
    fontFamily: FONTS.bodyMedium,
    color: P.textSoft,
    fontSize: 13,
    paddingVertical: 4,
  },
  dot: {
    color: P.textMuted,
    fontSize: 13,
  },
  footerHint: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
    maxWidth: 320,
    alignSelf: 'center',
  },
  toast: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 100,
    backgroundColor: P.inkElevated,
    borderWidth: 1,
    borderColor: P.line,
    padding: 14,
    borderRadius: 2,
  },
  toastTitle: {
    fontFamily: FONTS.bodyBold,
    color: P.text,
    fontSize: 14,
  },
  toastBody: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  roleScroll: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    maxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  roleHeadline: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 28,
    lineHeight: 34,
    marginTop: 20,
  },
  roleSub: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 14,
    marginTop: 8,
    marginBottom: 28,
    lineHeight: 20,
  },
  roleList: {
    gap: 10,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.mist,
    borderRadius: 2,
  },
  roleName: {
    fontFamily: FONTS.bodyBold,
    color: P.text,
    fontSize: 16,
  },
  roleDesc: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  roleArrow: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 18,
    marginLeft: 12,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: P.inkElevated,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderColor: P.line,
    padding: 20,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 22,
  },
  section: {
    marginBottom: 22,
    gap: 8,
  },
  sectionTitle: {
    fontFamily: FONTS.bodyMedium,
    color: P.accent,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sheetBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.line,
  },
  sheetBody: {
    fontFamily: FONTS.body,
    color: P.text,
    fontSize: 14,
  },
  sheetMuted: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchTrack: {
    width: 36,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
  },
  controlRow: {
    flexDirection: 'row',
    gap: 8,
  },
  controlChip: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: P.line,
    borderRadius: 2,
    alignItems: 'center',
  },
  controlChipOn: {
    borderColor: P.accent,
    backgroundColor: P.accentSoft,
  },
  controlChipText: {
    fontFamily: FONTS.bodyMedium,
    color: P.textMuted,
    fontSize: 13,
  },
  controlChipTextOn: {
    color: P.text,
  },
  modalCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  coachBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  coachSheet: {
    backgroundColor: P.inkElevated,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: P.line,
    maxHeight: '75%',
  },
  insight: {
    fontFamily: FONTS.body,
    color: P.cool,
    fontSize: 12,
    marginTop: 4,
  },
  coachReply: {
    backgroundColor: P.mist,
    padding: 12,
    borderRadius: 2,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: P.line,
  },
  input: {
    backgroundColor: P.ink,
    color: P.text,
    borderRadius: 2,
    padding: 12,
    borderWidth: 1,
    borderColor: P.line,
    marginVertical: 12,
    fontFamily: FONTS.body,
  },
});
