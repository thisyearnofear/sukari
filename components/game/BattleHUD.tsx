/**
 * InstrumentHUD — clinical-instrument battle chrome.
 * Field stability is the hero; score/timer/actions stay quiet.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StabilityZone } from '@/types/game';
import { COMBO_TIERS } from '@/constants/gameConfig';
import { COLORS, FONTS, ANIMATIONS } from '@/constants/designSystem';
import { useAccessibility } from '@/hooks/useAccessibility';
import { AnimatedCounter } from './AnimatedCounter';
import { getStabilityZone } from '@/utils/gameLogic';
import { PressableScale } from '@/components/ui/PressableScale';
import { MissionRibbon } from '@/components/programme/MissionRibbon';

const P = COLORS.PROGRAMME;

interface BattleHUDProps {
  score: number;
  stability: number;
  timer: number;
  comboCount: number;
  exerciseCharges: number;
  rationCharges: number;
  announcement: string | null;
  announcementType:
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
    | 'plot_twist'
    | 'joke'
    | 'fact'
    | 'special_mode'
    | 'reflection';
  onExercise: () => void;
  onRations: () => void;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onRestart?: () => void;
  showComboCounter?: boolean;
  controlMode?: 'swipe' | 'tap';
  onToggleControlMode?: () => void;
  minimal?: boolean;
  /** Today's real-world mission — keeps play tied to adherence */
  missionAction?: string | null;
  /** Bounded focus derived from the approved mission template. */
  missionPracticeFocus?: string | null;
  missionTone?: string | null;
}

function zoneAccent(zone: StabilityZone): string {
  switch (zone) {
    case 'balanced':
      return P.accent;
    case 'warning-low':
    case 'critical-low':
      return P.cool;
    case 'warning-high':
      return P.warn;
    case 'critical-high':
      return P.danger;
  }
}

function zoneLabel(zone: StabilityZone): string {
  switch (zone) {
    case 'balanced':
      return 'In range';
    case 'warning-low':
      return 'Falling';
    case 'warning-high':
      return 'Rising';
    case 'critical-low':
      return 'Critical low';
    case 'critical-high':
      return 'Critical high';
  }
}

const BattleHUDComponent: React.FC<BattleHUDProps> = React.memo(
  ({
    score,
    stability,
    timer,
    comboCount,
    exerciseCharges,
    rationCharges,
    announcement,
    announcementType,
    onExercise,
    onRations,
    isPaused = false,
    onPause,
    onResume,
    onRestart,
    showComboCounter = true,
    controlMode = 'swipe',
    onToggleControlMode,
    minimal = false,
    missionAction = null,
    missionPracticeFocus = null,
    missionTone = null,
  }) => {
    const { getButtonLabel, getHUDLabel } = useAccessibility();
    const zone = getStabilityZone(stability);
    const accent = zoneAccent(zone);
    const isLowTimer = timer <= 10;
    const isCritical = zone === 'critical-low' || zone === 'critical-high';
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const compactViewport = width < 430 || height < 760;

    const scoreFlashAnim = useRef(new Animated.Value(0)).current;
    const timerShakeAnim = useRef(new Animated.Value(0)).current;
    const toastAnim = useRef(new Animated.Value(0)).current;
    const prevScoreRef = useRef(score);
    const prevComboRef = useRef(comboCount);
    const [showComboBreak, setShowComboBreak] = useState(false);

    useEffect(() => {
      if (prevComboRef.current >= 3 && comboCount === 0) {
        setShowComboBreak(true);
        const t = setTimeout(() => setShowComboBreak(false), 900);
        return () => clearTimeout(t);
      }
      prevComboRef.current = comboCount;
    }, [comboCount]);

    useEffect(() => {
      if (score !== prevScoreRef.current) {
        Animated.sequence([
          Animated.timing(scoreFlashAnim, {
            toValue: 1,
            duration: ANIMATIONS.MOTION.press.duration,
            useNativeDriver: true,
          }),
          Animated.timing(scoreFlashAnim, {
            toValue: 0,
            duration: ANIMATIONS.MOTION.exit.duration,
            useNativeDriver: true,
          }),
        ]).start();
        prevScoreRef.current = score;
      }
    }, [score, scoreFlashAnim]);

    useEffect(() => {
      if (isLowTimer && !isPaused) {
        const shake = Animated.loop(
          Animated.sequence([
            Animated.timing(timerShakeAnim, { toValue: 2, duration: 40, useNativeDriver: true }),
            Animated.timing(timerShakeAnim, { toValue: -2, duration: 40, useNativeDriver: true }),
            Animated.timing(timerShakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
          ]),
        );
        shake.start();
        return () => shake.stop();
      }
      timerShakeAnim.setValue(0);
    }, [isLowTimer, isPaused, timerShakeAnim]);

    useEffect(() => {
      if (!announcement) {
        toastAnim.setValue(0);
        return;
      }
      const { duration, bezier } = ANIMATIONS.MOTION.toast;
      Animated.timing(toastAnim, {
        toValue: 1,
        duration,
        easing: Easing.bezier(bezier[0], bezier[1], bezier[2], bezier[3]),
        useNativeDriver: true,
      }).start();
    }, [announcement, toastAnim]);

    const currentTier = [...COMBO_TIERS].reverse().find((t) => comboCount >= t.count);
    const scoreScale = scoreFlashAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.08],
    });

    const announcementTint =
      announcementType === 'success'
        ? P.accent
        : announcementType === 'warning'
          ? P.warn
          : announcementType === 'error'
            ? P.danger
            : announcementType === 'plot_twist'
              ? P.cool
              : P.textSoft;

    return (
      <>
        <View style={[styles.topWrap, { paddingTop: Math.max(insets.top, 12) }]} pointerEvents="box-none">
          <View style={styles.topStrip}>
            <View
              style={styles.scoreBlock}
              accessible
              accessibilityLabel={getHUDLabel('score', score)}
              accessibilityRole="text"
            >
              <Text style={styles.metaLabel}>Score</Text>
              <Animated.View style={{ transform: [{ scale: scoreScale }] }}>
                <AnimatedCounter value={score} style={styles.scoreValue} />
              </Animated.View>
            </View>

            <Animated.View
              style={[
                styles.timerBlock,
                isLowTimer && styles.timerUrgent,
                { transform: [{ translateX: timerShakeAnim }] },
              ]}
              accessible
              accessibilityLabel={getHUDLabel('timer', timer)}
              accessibilityRole="timer"
            >
              <Text style={[styles.timerValue, isLowTimer && { color: P.danger }]}>{timer}</Text>
              <Text style={styles.metaLabel}>{isLowTimer ? 'Finish' : 'Seconds'}</Text>
            </Animated.View>

            <View style={styles.topActions}>
              {onToggleControlMode ? (
                <PressableScale
                  onPress={onToggleControlMode}
                  accessibilityLabel={`Switch to ${controlMode === 'swipe' ? 'tap' : 'swipe'} controls`}
                  accessibilityRole="button"
                  style={styles.iconChip}
                >
                  <Text style={styles.iconChipText}>{controlMode === 'swipe' ? 'Swipe' : 'Tap'}</Text>
                </PressableScale>
              ) : null}
              {onPause && !isPaused ? (
                <PressableScale
                  onPress={onPause}
                  accessibilityLabel={getButtonLabel('pause')}
                  accessibilityRole="button"
                  style={styles.iconChip}
                >
                  <Text style={styles.iconChipText}>Pause</Text>
                </PressableScale>
              ) : null}
            </View>
          </View>

          {missionAction ? (
            <MissionRibbon
              action={missionAction}
              compact={compactViewport}
              practiceFocus={missionTone ? `${missionPracticeFocus || 'Practice'} · ${missionTone}` : missionPracticeFocus}
            />
          ) : null}

          {!minimal ? (
            <View
              style={[styles.harmonyCard, isCritical && { borderColor: accent }]}
              accessible
              accessibilityLabel={getHUDLabel('harmony', Math.round(stability))}
              accessibilityRole="progressbar"
            >
              <View style={styles.harmonyHeader}>
                <Text style={[styles.harmonyZone, { color: accent }]}>{zoneLabel(zone)}</Text>
                <Text style={[styles.harmonyPercent, { color: accent }]}>
                  {Math.round(stability)}%
                </Text>
              </View>
              <View style={styles.harmonyTrack}>
                <View style={styles.zoneBands}>
                  <View style={[styles.zoneSeg, { flex: 25, backgroundColor: 'rgba(74,143,168,0.35)' }]} />
                  <View style={[styles.zoneSeg, { flex: 15, backgroundColor: 'rgba(196,146,58,0.28)' }]} />
                  <View style={[styles.zoneSeg, { flex: 20, backgroundColor: 'rgba(61,155,122,0.4)' }]} />
                  <View style={[styles.zoneSeg, { flex: 15, backgroundColor: 'rgba(196,146,58,0.28)' }]} />
                  <View style={[styles.zoneSeg, { flex: 25, backgroundColor: 'rgba(196,92,92,0.35)' }]} />
                </View>
                <View
                  style={[
                    styles.harmonyNeedle,
                    {
                      left: `${Math.min(98, Math.max(2, stability))}%`,
                      backgroundColor: accent,
                    },
                  ]}
                />
              </View>
              <Text style={styles.harmonyCaption}>Steady the field</Text>
            </View>
          ) : null}
        </View>

        {isPaused ? (
          <View style={styles.pauseOverlay}>
            <View style={styles.pauseSheet}>
              <Text style={styles.pauseBrand}>Sukari</Text>
              <Text style={styles.pauseTitle}>Paused</Text>
              <Text style={styles.pauseSub}>{timer}s remaining</Text>

              <PressableScale
                onPress={onResume}
                accessibilityLabel={getButtonLabel('resume')}
                accessibilityRole="button"
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>Resume</Text>
              </PressableScale>

              {onToggleControlMode ? (
                <PressableScale onPress={onToggleControlMode} style={styles.ghostBtn}>
                  <Text style={styles.ghostBtnText}>
                    Controls: {controlMode === 'swipe' ? 'Swipe' : 'Tap'}
                  </Text>
                </PressableScale>
              ) : null}

              <View style={styles.pauseRow}>
                <PressableScale
                  onPress={onRestart}
                  accessibilityLabel={getButtonLabel('restart')}
                  accessibilityRole="button"
                  style={[styles.ghostBtn, { flex: 1 }]}
                >
                  <Text style={styles.ghostBtnText}>Restart</Text>
                </PressableScale>
                {onPause ? (
                  <PressableScale
                    onPress={onPause}
                    accessibilityLabel={getButtonLabel('exit')}
                    accessibilityRole="button"
                    style={[styles.ghostBtn, { flex: 1 }]}
                  >
                    <Text style={styles.ghostBtnText}>Exit</Text>
                  </PressableScale>
                ) : null}
              </View>
            </View>
          </View>
        ) : null}

        {showComboCounter !== false && comboCount >= 3 ? (
          <View
            style={styles.comboWrap}
            accessible
            accessibilityLabel={getHUDLabel('combo', comboCount)}
            accessibilityRole="text"
          >
            <View style={[styles.comboChip, { borderColor: currentTier?.color || P.accent }]}>
              <Text style={[styles.comboText, { color: currentTier?.color || P.accent }]}>
                {comboCount}× {currentTier?.title || 'Streak'}
              </Text>
            </View>
          </View>
        ) : null}

        {showComboBreak ? (
          <View style={styles.comboWrap}>
            <View style={[styles.comboChip, { borderColor: P.danger }]}>
              <Text style={[styles.comboText, { color: P.danger }]}>Streak broken</Text>
            </View>
          </View>
        ) : null}

        {announcement ? (
          <Animated.View
            style={[
              styles.toastWrap,
              {
                opacity: toastAnim,
                transform: [
                  {
                    translateY: toastAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-12, 0],
                    }),
                  },
                ],
              },
            ]}
            accessible
            accessibilityLabel={announcement}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            <View style={[styles.toast, { borderColor: announcementTint }]}>
              <Text style={styles.toastText}>{announcement}</Text>
            </View>
          </Animated.View>
        ) : null}

        {!minimal ? (
          <View style={[styles.bottomWrap, { bottom: Math.max(insets.bottom, 8) }]}>
            <View style={styles.actionRow}>
              <PressableScale
                onPress={onExercise}
                disabled={exerciseCharges <= 0}
                accessibilityLabel={getButtonLabel('exercise', exerciseCharges)}
                accessibilityRole="button"
                style={[
                  styles.actionChip,
                  exerciseCharges <= 0 && styles.actionDisabled,
                ]}
              >
                <Text style={styles.actionTitle}>Move</Text>
                <Text style={styles.actionSub}>−harmony · {exerciseCharges}</Text>
              </PressableScale>
              <PressableScale
                onPress={onRations}
                disabled={rationCharges <= 0}
                accessibilityLabel={getButtonLabel('rations', rationCharges)}
                accessibilityRole="button"
                style={[
                  styles.actionChip,
                  rationCharges <= 0 && styles.actionDisabled,
                ]}
              >
                <Text style={styles.actionTitle}>Fuel</Text>
                <Text style={styles.actionSub}>+harmony · {rationCharges}</Text>
              </PressableScale>
            </View>
          </View>
        ) : null}
      </>
    );
  },
);

BattleHUDComponent.displayName = 'BattleHUD';
export const BattleHUD = BattleHUDComponent;

const styles = StyleSheet.create({
  topWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: 16,
  },
  topStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  scoreBlock: {
    minWidth: 72,
  },
  metaLabel: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  scoreValue: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 26,
    lineHeight: 30,
  },
  timerBlock: {
    alignItems: 'center',
    minWidth: 64,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.mist,
    borderRadius: 2,
  },
  timerUrgent: {
    borderColor: P.danger,
    backgroundColor: 'rgba(196,92,92,0.12)',
  },
  timerValue: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 28,
    lineHeight: 32,
  },
  topActions: {
    flexDirection: 'row',
    gap: 6,
    minWidth: 72,
    justifyContent: 'flex-end',
  },
  iconChip: {
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.mist,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 2,
  },
  iconChipText: {
    fontFamily: FONTS.bodyMedium,
    color: P.textSoft,
    fontSize: 11,
  },
  harmonyCard: {
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: 'rgba(11,18,16,0.72)',
    borderRadius: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  harmonyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  harmonyZone: {
    fontFamily: FONTS.display,
    fontSize: 18,
    letterSpacing: -0.2,
  },
  harmonyPercent: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
  },
  harmonyTrack: {
    height: 10,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.35)',
    position: 'relative',
  },
  zoneBands: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  zoneSeg: {
    height: '100%',
  },
  harmonyNeedle: {
    position: 'absolute',
    top: -2,
    width: 3,
    height: 14,
    marginLeft: -1.5,
    borderRadius: 1,
  },
  harmonyCaption: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 80,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pauseSheet: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: P.inkElevated,
    borderWidth: 1,
    borderColor: P.line,
    borderRadius: 2,
    padding: 24,
  },
  pauseBrand: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 20,
  },
  pauseTitle: {
    fontFamily: FONTS.display,
    color: P.textSoft,
    fontSize: 26,
    marginTop: 6,
  },
  pauseSub: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 13,
    marginTop: 6,
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: P.accent,
    paddingVertical: 14,
    borderRadius: 2,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    fontFamily: FONTS.bodyBold,
    color: P.ink,
    fontSize: 15,
  },
  ghostBtn: {
    borderWidth: 1,
    borderColor: P.line,
    paddingVertical: 12,
    borderRadius: 2,
    alignItems: 'center',
    marginBottom: 8,
  },
  ghostBtnText: {
    fontFamily: FONTS.bodyMedium,
    color: P.textSoft,
    fontSize: 13,
  },
  pauseRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  comboWrap: {
    position: 'absolute',
    top: '28%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 40,
  },
  comboChip: {
    borderWidth: 1,
    backgroundColor: 'rgba(11,18,16,0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 2,
  },
  comboText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  toastWrap: {
    position: 'absolute',
    top: '22%',
    left: 20,
    right: 20,
    zIndex: 45,
    alignItems: 'center',
  },
  toast: {
    borderWidth: 1,
    backgroundColor: 'rgba(11,18,16,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 2,
    maxWidth: 400,
  },
  toastText: {
    fontFamily: FONTS.body,
    color: P.text,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomWrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 50,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: 'rgba(11,18,16,0.75)',
    borderRadius: 2,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  actionDisabled: {
    opacity: 0.35,
  },
  actionTitle: {
    fontFamily: FONTS.bodyBold,
    color: P.text,
    fontSize: 13,
  },
  actionSub: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});
