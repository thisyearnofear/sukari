/**
 * HomeMission — the main home surface: signal line, demo controls, mission
 * card, support proposal, secondary links.
 *
 * Extracted from MainMenu.tsx. The orchestrator owns all state; this
 * component renders the current mission view and emits user choices.
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  Easing,
  TouchableOpacity,
  Share,
  StyleSheet,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, FONTS, ANIMATIONS } from '@/constants/designSystem';
import { MetabolicField } from '@/components/atmosphere/MetabolicField';
import { PressableScale } from '@/components/ui/PressableScale';
import { PatternMissionCard } from '@/components/programme/PatternMissionCard';
import type { MissionEase } from '@/domain/agent/intentParser';
import { LoopStrip } from '@/components/programme/LoopStrip';
import { AgencyLaneTag } from '@/components/programme/AgencyLaneTag';
import { QuietWinBeat } from '@/components/programme/QuietWinBeat';
import { CoachModal } from '@/components/agent/CoachModal';
import { useCoach } from '@/hooks/useCoach';
import { track } from '@/utils/analytics';
import { completionHeartbeat } from '@/utils/haptics';
import {
  type MissionAdaptation,
  type PersonalisedWorldState,
  type SukariMiraPresence,
} from '@/domain/agent';
import type { MetabolicPattern, ExperimentOutcome } from '@/domain/patterns';
import type { ProgrammeMission } from '@/domain/programme';
import { selectMission } from '@/domain/programme';
import { buildSupportInvite, supportShareMessage } from '@/domain/invite';
import { AMINA_DEMO } from '@/domain/demo';
import type { SignalSnapshot } from '@/domain/signals';
import type { UserMode } from '@/types/game';
import { fieldStateFromPattern } from '@/domain/patterns';

const P = COLORS.PROGRAMME;
const maxWidth = Platform.OS === 'web' ? 760 : 400;

interface LoopStep {
  key: string;
  title: string;
  done: boolean;
  active: boolean;
}

interface HomeMissionProps {
  signalLine: string;
  pattern: MetabolicPattern;
  displayMission: ProgrammeMission | null;
  displayWorldState: PersonalisedWorldState | null;
  adaptation: MissionAdaptation | null;
  missionChoice: MissionEase | null;
  missionDeferred: boolean;
  proactivePresence: SukariMiraPresence | null;
  signalSnapshot: SignalSnapshot;
  userMode: UserMode | null;
  demoMode: boolean;
  demoDay: number;
  aminaLabel?: string;
  aminaOutcome?: ExperimentOutcome | null;
  aminaReflection?: string | null;
  loopSteps: LoopStep[];
  onOpenSettings: () => void;
  onOpenCharter: () => void;
  onOpenCareTeamSummary: () => void;
  onJumpDemoDay: (day: number) => void;
  onExitDemo: () => void;
  onAccept: () => void;
  onMakeEasier: () => void;
  onNotPractical: () => void;
  onMarkDone: () => void;
  onLater: () => void;
  onWhy: () => void;
  onDismissSupport: () => void;
  supportDismissed: boolean;
}

export const HomeMission: React.FC<HomeMissionProps> = ({
  signalLine,
  pattern,
  displayMission,
  displayWorldState,
  adaptation,
  missionChoice,
  missionDeferred,
  proactivePresence,
  signalSnapshot,
  userMode,
  demoMode,
  demoDay,
  aminaLabel,
  aminaOutcome,
  aminaReflection,
  loopSteps,
  onOpenSettings,
  onOpenCharter,
  onOpenCareTeamSummary,
  onJumpDemoDay,
  onExitDemo,
  onAccept,
  onMakeEasier,
  onNotPractical,
  onMarkDone,
  onLater,
  onWhy,
  onDismissSupport,
  supportDismissed,
}) => {
  const [showCoach, setShowCoach] = React.useState(false);
  const [coachInput, setCoachInput] = React.useState('');
  const [showQuietWin, setShowQuietWin] = React.useState(false);
  const [showDemoTools, setShowDemoTools] = React.useState(false);
  const coach = useCoach();
  const enterAnim = useRef(new Animated.Value(0)).current;

  const done = displayMission?.status === 'completed';

  useEffect(() => {
    const { duration, bezier } = ANIMATIONS.MOTION.enter;
    Animated.timing(enterAnim, {
      toValue: 1,
      duration,
      easing: Easing.bezier(bezier[0], bezier[1], bezier[2], bezier[3]),
      useNativeDriver: true,
    }).start();
  }, [enterAnim]);

  const { band: homeBand, intensity: homeIntensity } = fieldStateFromPattern(pattern, {
    missionCompleted: done,
    deferred: !demoMode && missionDeferred,
  });

  const handleMarkDone = () => {
    completionHeartbeat();
    onMarkDone();
    AsyncStorage.removeItem('sukari.missionDeferred');
    setShowQuietWin(true);
    track('mission_marked_done', { from: 'home_pattern_card', demo: demoMode });
    track('completion_to_measured_response', { from: 'home_pattern_card', demo: demoMode });
    track('mission_response_selected', {
      choice: 'completed_directly',
      template_id: displayMission?.templateId || pattern.suggestedBehaviour,
    });
  };

  return (
    <View style={styles.root}>
      <MetabolicField band={homeBand} intensity={homeIntensity} />

      <View style={styles.topBar}>
        <View>
          <Text style={styles.topEyebrow}>Metabolic programme</Text>
          <Text style={styles.topMeta}>
            {demoMode ? 'Demo timeline' : 'One mission a day'}
          </Text>
        </View>
        <View style={styles.topBarActions}>
          <TouchableOpacity
            onPress={onOpenCharter}
            accessibilityLabel="What your agent does"
            accessibilityRole="button"
            style={styles.iconBtn}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={P.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onOpenSettings}
            accessibilityLabel="Open settings"
            accessibilityRole="button"
            style={styles.iconBtn}
          >
            <Ionicons name="settings-outline" size={20} color={P.textMuted} />
          </TouchableOpacity>
        </View>
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
          <Text style={styles.brandMark}>Sukari</Text>
          {!demoMode ? <Text style={styles.tagline}>One mission today. Better evidence for tomorrow.</Text> : null}
          {!demoMode ? <Text style={styles.signalLine}>{signalLine}</Text> : null}

          {demoMode ? (
            <View style={styles.demoSummary}>
              <View style={{ flex: 1 }}>
                <Text style={styles.demoSummaryLabel}>Synthetic example · {aminaLabel}</Text>
                <Text style={styles.demoSummaryText}>A labelled walkthrough, never patient data.</Text>
              </View>
              <PressableScale
                onPress={() => setShowDemoTools((visible) => !visible)}
                style={styles.demoToolsButton}
                accessibilityRole="button"
              >
                <Text style={styles.demoToolsButtonText}>{showDemoTools ? 'Hide controls' : 'Demo controls'}</Text>
              </PressableScale>
            </View>
          ) : null}

          {demoMode && showDemoTools ? (
            <View style={styles.demoTools}>
              <View style={styles.judgeSceneRow}>
                <PressableScale
                  onPress={() => onJumpDemoDay(AMINA_DEMO.scenes.pattern)}
                  style={[
                    styles.sceneChip,
                    demoDay === AMINA_DEMO.scenes.pattern && styles.sceneChipOn,
                  ]}
                >
                  <Text style={styles.sceneChipText}>1 · Pattern</Text>
                </PressableScale>
                <PressableScale
                  onPress={() => onJumpDemoDay(AMINA_DEMO.scenes.measure)}
                  style={[
                    styles.sceneChip,
                    demoDay === AMINA_DEMO.scenes.measure && styles.sceneChipOn,
                  ]}
                >
                  <Text style={styles.sceneChipText}>2 · Measure</Text>
                </PressableScale>
                <PressableScale
                  onPress={() => onJumpDemoDay(AMINA_DEMO.scenes.outreach)}
                  style={[
                    styles.sceneChip,
                    demoDay >= AMINA_DEMO.scenes.outreach && styles.sceneChipOn,
                  ]}
                >
                  <Text style={styles.sceneChipText}>3 · Outreach</Text>
                </PressableScale>
                <PressableScale
                  onPress={onOpenCareTeamSummary}
                  style={styles.sceneChip}
                >
                  <Text style={styles.sceneChipText}>Care team</Text>
                </PressableScale>
              </View>
              <PressableScale onPress={() => onExitDemo()} style={styles.exitDemo}>
                <Text style={styles.exitDemoText}>Exit demo</Text>
              </PressableScale>
              <LoopStrip steps={loopSteps} />
              <View style={styles.demoRow}>
                <PressableScale
                  onPress={() => onJumpDemoDay(demoDay - 1)}
                  style={styles.demoChip}
                  accessibilityRole="button"
                >
                  <Text style={styles.demoChipText}>← Prior day</Text>
                </PressableScale>
                <Text style={styles.demoDayLabel}>{aminaLabel}</Text>
                <PressableScale
                  onPress={() => onJumpDemoDay(demoDay + 1)}
                  style={styles.demoChip}
                  accessibilityRole="button"
                >
                  <Text style={styles.demoChipText}>Next day →</Text>
                </PressableScale>
              </View>
            </View>
          ) : null}

          <View style={styles.missionCardWrap}>
            <PatternMissionCard
              pattern={pattern}
              mission={displayMission}
              outcome={aminaOutcome}
              reflection={aminaReflection}
              demoLabel={null}
              missionChoice={missionChoice}
              adaptation={adaptation}
              worldState={displayWorldState}
              deferred={missionDeferred && !demoMode}
              onAskMira={() => setShowCoach(true)}
              proactivePresence={proactivePresence}
              onAccept={onAccept}
              onMakeEasier={onMakeEasier}
              onNotPractical={onNotPractical}
              onMarkDone={handleMarkDone}
              onLater={onLater}
              onWhy={onWhy}
            />
          </View>

          {missionChoice === 'not_practical' && !supportDismissed && displayMission ? (
            <View style={styles.supportCard}>
              <View style={styles.supportHead}>
                <Text style={styles.supportEyebrow}>Mira suggests support here</Text>
                <AgencyLaneTag lane="asks_first" />
              </View>
              <Text style={styles.supportTitle}>A human can help with this one.</Text>
              <Text style={styles.supportBody}>
                {displayMission.caregiverSupportAction ||
                  'Someone you trust can make today’s ask easier — one concrete action, no monitoring.'}
              </Text>
              <View style={styles.supportRow}>
                <PressableScale
                  onPress={async () => {
                    const invite = buildSupportInvite(displayMission);
                    track('support_invite_shared', {
                      from: 'decline_proposal',
                      template_id: invite.templateId,
                    });
                    await Share.share({ message: supportShareMessage(invite) });
                  }}
                  style={styles.supportBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.supportBtnText}>Invite support</Text>
                </PressableScale>
                <PressableScale
                  onPress={onDismissSupport}
                  accessibilityRole="button"
                >
                  <Text style={styles.supportGhost}>Not now</Text>
                </PressableScale>
              </View>
            </View>
          ) : null}

          <View style={styles.secondaryRow}>
            <TouchableOpacity
              onPress={async () => {
                const mission =
                  displayMission ||
                  selectMission({
                    userMode,
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
            <TouchableOpacity onPress={() => router.push('/care' as any)} accessibilityRole="button">
              <Text style={styles.link}>Care team summary</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerHint}>
            Habits only — never dosing or diagnosis. Follow-through is what counts.
          </Text>
        </Animated.View>
      </ScrollView>

      {showQuietWin ? (
        <QuietWinBeat
          message="Logged. Come back tomorrow for the next experiment."
          onDone={() => setShowQuietWin(false)}
        />
      ) : null}

      <CoachModal
        visible={showCoach}
        onClose={() => setShowCoach(false)}
        mission={displayMission}
        pattern={pattern}
        insights={coach.insights}
        chatReply={coach.chatReply}
        isLoading={coach.isLoading}
        input={coachInput}
        setInput={setCoachInput}
        onAsk={async () => {
          const q = coachInput.trim();
          setCoachInput('');
          await coach.ask(q, signalSnapshot);
        }}
        messages={coach.messages}
        onClearChat={coach.clearChat}
        presence={proactivePresence ?? undefined}
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
  topBarActions: {
    flexDirection: 'row',
    gap: 8,
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
    paddingTop: 18,
    paddingBottom: 48,
  },
  brandMark: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
  },
  signalLine: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 14,
    marginTop: 10,
  },
  demoSummary: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: P.warn,
    backgroundColor: P.warnSoft,
    padding: 10,
  },
  demoSummaryLabel: {
    fontFamily: FONTS.bodyBold,
    color: P.warn,
    fontSize: 13,
  },
  demoSummaryText: {
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  demoToolsButton: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.inkElevated,
  },
  demoToolsButtonText: {
    fontFamily: FONTS.bodyMedium,
    color: P.textSoft,
    fontSize: 12,
  },
  demoTools: {
    marginTop: 10,
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.inkElevated,
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
    fontSize: 12,
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
    fontSize: 13,
  },
  missionCardWrap: {
    marginTop: 10,
    marginBottom: 16,
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
    fontSize: 14,
    paddingVertical: 4,
  },
  dot: {
    color: P.textMuted,
    fontSize: 14,
  },
  footerHint: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 19,
    maxWidth: 320,
    alignSelf: 'center',
  },
  supportCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: P.cool,
    backgroundColor: P.coolSoft,
    borderRadius: 2,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  supportHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  supportEyebrow: {
    fontFamily: FONTS.bodyMedium,
    color: P.textMuted,
    fontSize: 10,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  supportTitle: {
    fontFamily: FONTS.bodyBold,
    color: P.text,
    fontSize: 14,
  },
  supportBody: {
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  supportBtn: {
    backgroundColor: P.cool,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 2,
  },
  supportBtnText: {
    fontFamily: FONTS.bodyBold,
    color: P.ink,
    fontSize: 13,
  },
  supportGhost: {
    fontFamily: FONTS.bodyMedium,
    color: P.cool,
    fontSize: 14,
  },
});
