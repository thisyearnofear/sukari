/**
 * Results after rehearsal — transfer to real life is the hero; score is secondary.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  Easing,
  Share,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { BodyMetrics, GameMode, MorningCondition, GameState, UserMode } from '@/types/game';
import { HealthProfile } from '@/types/health';
import { GameTier } from '@/constants/gameTiers';
import { useCGMConnection } from '@/hooks/useCGMConnection';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
import { buildTransfer } from '@/domain/programme';
import { buildSupportInvite, supportShareMessage } from '@/domain/invite';
import { track } from '@/utils/analytics';
import { MetabolicField } from '@/components/atmosphere/MetabolicField';
import { completionHeartbeat } from '@/utils/haptics';
import { PressableScale } from '@/components/ui/PressableScale';
import { TransferBeat, TransferCommit } from '@/components/programme/TransferBeat';
import { RehearsalSummary } from '@/components/programme/RehearsalSummary';
import { QuietWinBeat } from '@/components/programme/QuietWinBeat';
import { COLORS, FONTS, ANIMATIONS } from '@/constants/designSystem';
import AsyncStorage from '@react-native-async-storage/async-storage';

const P = COLORS.PROGRAMME;
const DEFERRED_KEY = 'glucoseWars.missionDeferred';

interface ResultsScrollProps {
  result: 'victory' | 'defeat';
  score: number;
  glucoseLevel: number;
  correctSwipes?: number;
  incorrectSwipes?: number;
  timeInBalanced?: number;
  comboMax?: number;
  onPlayAgain: () => void;
  onMainMenu: () => void;
  gameMode?: GameMode;
  finalMetrics?: BodyMetrics;
  morningCondition?: MorningCondition;
  gameState?: GameState;
  healthProfile?: HealthProfile;
  tier?: GameTier;
  dexcomOption?: boolean;
  userMode?: UserMode;
}

export const ResultsScroll: React.FC<ResultsScrollProps> = ({
  result,
  score,
  glucoseLevel,
  correctSwipes = 0,
  incorrectSwipes = 0,
  onPlayAgain,
  onMainMenu,
  gameMode = 'classic',
  gameState,
  healthProfile,
  tier,
}) => {
  const isVictory = result === 'victory';
  const enter = useRef(new Animated.Value(0)).current;
  const {
    progress,
    markMissionPracticed,
    completeActiveMission,
  } = usePlayerProgressContext();
  const cgm = useCGMConnection();
  const transfer = buildTransfer(progress.activeMission, {
    result,
    correctSwipes,
    incorrectSwipes,
    score,
  });
  const [commit, setCommit] = useState<TransferCommit>(
    progress.activeMission?.status === 'completed' ? 'done' : null,
  );
  const [showQuietWin, setShowQuietWin] = useState(false);

  useEffect(() => {
    if (cgm.connection.isConnected) {
      cgm.syncReadings(10).catch(() => undefined);
    }
    if (transfer?.practiced && progress.activeMission?.status === 'assigned') {
      markMissionPracticed(transfer.mission);
      track('mission_transfer_shown', {
        template_id: transfer.mission.templateId,
        result,
        privacy_mode: progress.privacyMode,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const { duration, bezier } = ANIMATIONS.MOTION.enter;
    Animated.timing(enter, {
      toValue: 1,
      duration: Math.min(duration, 320),
      easing: Easing.bezier(bezier[0], bezier[1], bezier[2], bezier[3]),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  const accuracy =
    correctSwipes + incorrectSwipes > 0
      ? Math.round((correctSwipes / (correctSwipes + incorrectSwipes)) * 100)
      : 0;

  const { width: screenWidth } = useWindowDimensions();
  const cardMaxWidth = Math.min(screenWidth * 0.92, 400);

  const markDone = () => {
    completionHeartbeat();
    completeActiveMission();
    setCommit('done');
    setShowQuietWin(true);
    AsyncStorage.removeItem(DEFERRED_KEY);
    track('mission_marked_done', {
      from: 'results',
      template_id: transfer?.mission.templateId,
      privacy_mode: progress.privacyMode,
    });
  };

  const deferMission = async () => {
    setCommit('later');
    const dateKey =
      transfer?.mission.dateKey ||
      (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })();
    await AsyncStorage.setItem(DEFERRED_KEY, JSON.stringify({ dateKey }));
    track('mission_deferred', {
      template_id: transfer?.mission.templateId,
      privacy_mode: progress.privacyMode,
    });
  };

  return (
    <View style={styles.root}>
      <MetabolicField band={isVictory ? 'in_range' : 'high'} intensity={isVictory ? 0.35 : 0.55} />

      <Animated.View
        style={[
          styles.card,
          {
            width: cardMaxWidth,
            opacity: enter,
            transform: [
              {
                translateY: enter.interpolate({
                  inputRange: [0, 1],
                  outputRange: [14, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.brand}>Sukari</Text>
        <Text style={[styles.status, { color: isVictory ? P.accent : P.danger }]}>
          {isVictory ? 'Rehearsal complete' : 'Rehearsal interrupted'}
        </Text>
        <Text style={styles.statusSub}>
          {isVictory
            ? 'You practiced the decision. The product moment is what happens next.'
            : 'The field collapsed — you can rehearse again, or still take the mission into real life.'}
        </Text>

        {transfer ? (
          <TransferBeat
            transfer={transfer}
            commit={commit}
            onMarkDone={markDone}
            onLater={deferMission}
            onInviteSupport={async () => {
              const invite = buildSupportInvite(transfer.mission);
              track('caregiver_invite_shared', {
                template_id: invite.templateId,
                privacy_mode: progress.privacyMode,
              });
              await Share.share({ message: supportShareMessage(invite) });
            }}
          />
        ) : (
          <View style={styles.noMission}>
            <Text style={styles.noMissionTitle}>No active mission</Text>
            <Text style={styles.noMissionBody}>
              Return home to receive today’s pattern-backed experiment, then rehearse it here.
            </Text>
          </View>
        )}

        <RehearsalSummary
          score={score}
          accuracy={accuracy}
          correctSwipes={correctSwipes}
          incorrectSwipes={incorrectSwipes}
          showStability={gameMode === 'classic'}
          stability={glucoseLevel}
        />

        {cgm.latestReading && healthProfile && tier === 'tier2' ? (
          <View style={styles.cgmNote}>
            <Text style={styles.cgmEyebrow}>Signal context</Text>
            <Text style={styles.cgmBody}>
              Latest CGM {cgm.latestReading.value} mg/dL
              {cgm.latestReading.trendArrow ? ` ${cgm.latestReading.trendArrow}` : ''}. Educational
              context only — not a comparison that predicts your next reading.
            </Text>
          </View>
        ) : null}

        {gameState && gameState.comboCount >= 5 ? (
          <Text style={styles.quietHighlight}>
            Strong streak in rehearsal · {gameState.comboCount}× combo
          </Text>
        ) : null}

        <View style={styles.ctaBlock}>
          <PressableScale
            onPress={onMainMenu}
            style={styles.primaryCta}
            accessibilityRole="button"
            accessibilityLabel="Back to programme home"
          >
            <Text style={styles.primaryCtaText}>
              {commit === 'done' ? 'Back to programme' : 'Back to today’s mission'}
            </Text>
          </PressableScale>

          <PressableScale
            onPress={onPlayAgain}
            style={styles.secondaryCta}
            accessibilityRole="button"
            accessibilityLabel="Rehearse again"
          >
            <Text style={styles.secondaryCtaText}>
              {isVictory ? 'Rehearse once more' : 'Try rehearsal again'}
            </Text>
          </PressableScale>

          <PressableScale
            onPress={async () => {
              const missionLine = transfer
                ? `Today’s mission: ${transfer.realWorldAction}`
                : 'Practicing metabolic decisions in Sukari.';
              const url = process.env.EXPO_PUBLIC_APP_URL || 'https://glucosewars.netlify.app';
              await Share.share({
                message: `${missionLine}\nRehearsal: ${score} pts · ${accuracy}%.\nHabits only — never dosing.\n${url}`,
                title: 'Sukari',
              });
              track('share_action', { from: 'results', privacy_mode: progress.privacyMode });
            }}
            style={styles.ghostCta}
            accessibilityRole="button"
          >
            <Text style={styles.ghostCtaText}>Share mission (not just score)</Text>
          </PressableScale>
        </View>
      </Animated.View>

      {showQuietWin ? (
        <QuietWinBeat
          message="Logged. Head home when you’re ready."
          onDone={() => setShowQuietWin(false)}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.ink,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    zIndex: 10,
    backgroundColor: 'rgba(11,18,16,0.92)',
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: P.line,
    maxHeight: '92%',
  },
  brand: {
    fontFamily: FONTS.display,
    fontSize: 20,
    color: P.text,
    letterSpacing: -0.3,
  },
  status: {
    fontFamily: FONTS.display,
    fontSize: 24,
    marginTop: 6,
    letterSpacing: -0.2,
  },
  statusSub: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 16,
  },
  noMission: {
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.mist,
    padding: 14,
    borderRadius: 2,
    marginBottom: 14,
  },
  noMissionTitle: {
    fontFamily: FONTS.bodyBold,
    color: P.text,
    fontSize: 14,
  },
  noMissionBody: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  cgmNote: {
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.coolSoft,
    padding: 12,
    borderRadius: 2,
    marginBottom: 12,
  },
  cgmEyebrow: {
    fontFamily: FONTS.bodyMedium,
    color: P.cool,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cgmBody: {
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 12,
    lineHeight: 18,
  },
  quietHighlight: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  ctaBlock: {
    marginTop: 4,
    gap: 8,
  },
  primaryCta: {
    backgroundColor: P.accent,
    paddingVertical: 15,
    borderRadius: 2,
    alignItems: 'center',
  },
  primaryCtaText: {
    fontFamily: FONTS.bodyBold,
    color: P.ink,
    fontSize: 15,
  },
  secondaryCta: {
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.mist,
    paddingVertical: 13,
    borderRadius: 2,
    alignItems: 'center',
  },
  secondaryCtaText: {
    fontFamily: FONTS.bodyMedium,
    color: P.textSoft,
    fontSize: 14,
  },
  ghostCta: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  ghostCtaText: {
    fontFamily: FONTS.bodyMedium,
    color: P.cool,
    fontSize: 12,
  },
});
