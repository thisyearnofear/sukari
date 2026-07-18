import React, { useState, useEffect, useRef } from 'react';
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
import { ControlMode, UserMode } from '@/types/game';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
import { USER_MODE_CONFIGS } from '@/constants/userModes';
import { PrivacyToggle } from '@/components/PrivacyToggle';
import { PrivacySettingsModal } from '@/components/PrivacySettings';
import { useWeb3 } from '@/context/Web3Context';
import { useBeam } from '@/context/BeamContext';
import { RoleBadgeModal } from '@/components/game/RoleBadgeModal';
import { COLORS, FONTS, ANIMATIONS } from '@/constants/designSystem';
import { ProgressIndicator } from '@/components/game/ProgressIndicator';
import { DailyQuests } from '@/components/game/DailyQuests';
import { GrandLibrary } from '@/components/game/GrandLibrary';
import { BeamAssets } from '@/components/game/BeamAssets';
import { track } from '@/utils/analytics';
import { useCGMConnection } from '@/hooks/useCGMConnection';
import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';
import { useCoach } from '@/hooks/useCoach';
import { buildSignalSnapshot } from '@/domain/signals';
import { buildLocalDigest, publishWeeklyDigest } from '@/domain/digest';
import { buildSupportInvite, supportShareMessage } from '@/domain/invite';
import { MetabolicField } from '@/components/atmosphere/MetabolicField';
import { PressableScale } from '@/components/ui/PressableScale';

const maxWidth = 400;
const P = COLORS.PROGRAMME;

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
    getKingdomTitle,
    completeActiveMission,
    setDigestMeta,
    ensureTodayMission,
  } = usePlayerProgressContext();
  const kingdomTitle = getKingdomTitle();
  const [showUserModeSelector, setShowUserModeSelector] = useState(userModeSelected === false);
  const [selectedRole, setSelectedRole] = useState<UserMode | null>(null);
  const [showMintModal, setShowMintModal] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showTreasury, setShowTreasury] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCGMDisclaimer, setShowCGMDisclaimer] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [coachInput, setCoachInput] = useState('');
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
  const isNewUser = progress.gamesPlayed === 0;

  useEffect(() => {
    if (!showUserModeSelector) {
      ensureTodayMission(signalSnapshot);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showUserModeSelector, cgm.connection.isConnected, progress.userMode]);

  useEffect(() => {
    if (cgm.connection.isConnected) {
      cgm.syncReadings(180).catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cgm.connection.isConnected]);

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
          <Text style={styles.roleHeadline}>How will you use the programme?</Text>
          <Text style={styles.roleSub}>
            One choice. You can change it later in settings.
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

  const signalLine = signalSnapshot.connected
    ? `CGM · ${band.replace('_', ' ')}${signalSnapshot.trend ? ` · ${signalSnapshot.trend}` : ''}`
    : 'No CGM · missions use programme defaults';

  return (
    <View style={styles.root}>
      <MetabolicField band={band} intensity={band === 'unknown' ? 0.4 : 0.65} />

      {showWelcome && (
        <Animated.View style={[styles.toast, { transform: [{ translateY: welcomeAnim }] }]}>
          <Text style={styles.toastTitle}>Signed in</Text>
          <Text style={styles.toastBody}>Progress sync is available.</Text>
        </Animated.View>
      )}

      <View style={styles.topBar}>
        <View>
          <Text style={styles.topEyebrow}>{kingdomTitle.title}</Text>
          <Text style={styles.topMeta}>
            {progress.kingdomRenown} renown
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
          <Text style={styles.tagline}>Practice that becomes the day.</Text>
          <Text style={styles.signalLine}>{signalLine}</Text>

          <View style={{ marginTop: 28, marginBottom: 20 }}>
            <DailyQuests
              mission={progress.activeMission}
              adherenceWeek={progress.adherenceWeek}
              renown={progress.kingdomRenown}
              compact
              onMarkDone={() => completeActiveMission()}
              onAskCoach={() => {
                setShowCoach(true);
                coach.refreshMission(signalSnapshot);
              }}
            />
          </View>

          <PressableScale
            onPress={() => onStartGame(selectedMode)}
            accessibilityLabel="Practice today’s mission"
            accessibilityRole="button"
            style={styles.primaryCta}
          >
            <Text style={styles.primaryCtaText}>Practice</Text>
          </PressableScale>

          <View style={styles.secondaryRow}>
            <TouchableOpacity onPress={() => setShowCoach(true)} accessibilityRole="button">
              <Text style={styles.link}>Coach</Text>
            </TouchableOpacity>
            <Text style={styles.dot}>·</Text>
            <TouchableOpacity
              onPress={async () => {
                if (!progress.activeMission) return;
                const invite = buildSupportInvite(progress.activeMission);
                track('caregiver_invite_shared', { from: 'home', template_id: invite.templateId });
                await Share.share({ message: supportShareMessage(invite) });
              }}
              accessibilityRole="button"
            >
              <Text style={styles.link}>Invite support</Text>
            </TouchableOpacity>
            <Text style={styles.dot}>·</Text>
            <TouchableOpacity
              onPress={async () => {
                const digest = buildLocalDigest({
                  adherence: progress.adherenceWeek,
                  missionHistory: progress.missionHistory,
                  gamesPlayedThisWeekApprox: Math.min(progress.gamesPlayed, 14),
                });
                const published = await publishWeeklyDigest(digest);
                if (published?.token) {
                  setDigestMeta(published.token);
                  track('weekly_digest_created', { week: digest.weekKey });
                  router.push({ pathname: '/digest/[token]' as any, params: { token: published.token } });
                }
              }}
              accessibilityRole="button"
            >
              <Text style={styles.link}>Weekly digest</Text>
            </TouchableOpacity>
          </View>

          {!isNewUser && progress.gamesPlayed > 0 && (
            <View style={styles.progressBlock}>
              <Text style={styles.weekNote}>
                {progress.adherenceWeek.completed} missions completed this week
              </Text>
              <ProgressIndicator
                currentTier={progress.currentTier || 'tier1'}
                unlockedTiers={[
                  ...(['tier1'] as const),
                  ...(progress.maxTierUnlocked !== 'tier1' ? [progress.maxTierUnlocked] : []),
                ]}
                variant="detailed"
                showLabel={true}
              />
            </View>
          )}

          <Text style={styles.footerHint}>
            {isNewUser
              ? 'One mission a day. Practice, then do it in real life.'
              : 'Practice trains the decision — the mission changes the day.'}
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Settings sheet */}
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
              <SettingsSection title="Care & growth">
                <SheetButton
                  label="Customize practice"
                  onPress={() => {
                    setShowSettings(false);
                    onSelectGame?.();
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
                <SheetButton label="Library" onPress={() => { setShowSettings(false); setShowLibrary(true); }} />
                <SheetButton label="Slow Mo lab" onPress={() => { setShowSettings(false); router.push('/slowmo' as any); }} />
              </SettingsSection>

              <SettingsSection title="Privacy">
                <PrivacyToggle
                  currentMode={progress.privacyMode}
                  onToggle={(mode) => setPrivacyMode(mode)}
                />
                <SheetButton label="Privacy details" onPress={() => setShowPrivacySettings(true)} />
              </SettingsSection>

              <SettingsSection title="Tutorial">
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

              <SettingsSection title="Controls">
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
              </SettingsSection>

              <SettingsSection title="CGM">
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
                    <Text style={styles.sheetMuted}>Fuels today’s mission selection</Text>
                  </>
                )}
              </SettingsSection>

              <SettingsSection title="Optional identity">
                <BeamWalletButton
                  isConnected={isConnected}
                  address={address}
                  connectWallet={connectWallet}
                  disconnectWallet={disconnectWallet}
                />
                <SheetButton
                  label="Royal Treasury (optional)"
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
            {progress.activeMission && (
              <Text style={[styles.sheetBody, { marginTop: 10 }]}>
                Today: {progress.activeMission.realWorldAction}
              </Text>
            )}
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
              placeholder="Ask about today’s mission…"
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
        <Text style={styles.sheetBody}>{truncatedAddress} (Beam)</Text>
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
        label={Platform.OS === 'web' ? 'Connect wallet' : 'Wallet'}
        onPress={() => {
          void connectWallet();
        }}
      />
      <SheetButton
        label={isLoading ? '…' : 'Continue with social'}
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
    paddingTop: 36,
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
  primaryCta: {
    backgroundColor: P.accent,
    paddingVertical: 16,
    borderRadius: 2,
    alignItems: 'center',
  },
  primaryCtaText: {
    fontFamily: FONTS.bodyBold,
    color: P.ink,
    fontSize: 16,
    letterSpacing: 0.2,
  },
  secondaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
  },
  link: {
    fontFamily: FONTS.bodyMedium,
    color: P.textSoft,
    fontSize: 13,
  },
  dot: {
    color: P.textMuted,
    fontSize: 13,
  },
  progressBlock: {
    marginTop: 28,
    gap: 10,
  },
  weekNote: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  footerHint: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 28,
    lineHeight: 18,
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
