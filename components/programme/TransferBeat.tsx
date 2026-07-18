/**
 * Transfer beat — the product moment after rehearsal.
 * Practice is done; the real-world mission is the ask.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import type { TransferResult } from '@/domain/programme';
import { COLORS, FONTS, ANIMATIONS } from '@/constants/designSystem';
import { PressableScale } from '@/components/ui/PressableScale';

const P = COLORS.PROGRAMME;

export type TransferCommit = 'done' | 'later' | null;

interface TransferBeatProps {
  transfer: TransferResult;
  commit: TransferCommit;
  onMarkDone: () => void;
  onLater: () => void;
  onInviteSupport: () => void;
}

export function TransferBeat({
  transfer,
  commit,
  onMarkDone,
  onLater,
  onInviteSupport,
}: TransferBeatProps) {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const { duration, bezier } = ANIMATIONS.MOTION.enter;
    Animated.timing(enter, {
      toValue: 1,
      duration: Math.min(duration, 280),
      easing: Easing.bezier(bezier[0], bezier[1], bezier[2], bezier[3]),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  const done = commit === 'done';
  const later = commit === 'later';

  return (
    <Animated.View
      style={[
        styles.root,
        {
          opacity: enter,
          transform: [
            {
              translateY: enter.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.stepRow}>
        <View style={[styles.stepDot, styles.stepDone]} />
        <Text style={styles.stepLabel}>Rehearsed</Text>
        <View style={styles.stepLine} />
        <View style={[styles.stepDot, done ? styles.stepDone : styles.stepActive]} />
        <Text style={[styles.stepLabel, !done && styles.stepLabelActive]}>
          {done ? 'Done in life' : 'Act in life'}
        </Text>
      </View>

      <Text style={styles.eyebrow}>{transfer.headline}</Text>
      <Text style={styles.action}>{transfer.realWorldAction}</Text>
      <Text style={styles.body}>{transfer.body}</Text>

      {done ? (
        <View style={styles.doneBanner}>
          <Text style={styles.doneTitle}>Logged — real-world mission complete</Text>
          <Text style={styles.doneSub}>
            Return home when you want the next experiment. Care-team summaries stay exception-oriented.
          </Text>
        </View>
      ) : later ? (
        <View style={styles.laterBanner}>
          <Text style={styles.laterTitle}>Saved for later today</Text>
          <Text style={styles.laterSub}>
            No penalty. Mark it done from home when you’ve finished the action.
          </Text>
          <PressableScale
            onPress={onMarkDone}
            style={styles.primaryBtn}
            accessibilityRole="button"
            accessibilityLabel="Mark real-world mission done"
          >
            <Text style={styles.primaryText}>I did it now</Text>
          </PressableScale>
        </View>
      ) : (
        <View style={styles.actions}>
          <PressableScale
            onPress={onMarkDone}
            style={styles.primaryBtn}
            accessibilityRole="button"
            accessibilityLabel="Mark real-world mission done"
          >
            <Text style={styles.primaryText}>I did it</Text>
          </PressableScale>
          <PressableScale
            onPress={onLater}
            style={styles.secondaryBtn}
            accessibilityRole="button"
            accessibilityLabel="Do mission later today"
          >
            <Text style={styles.secondaryText}>Later today</Text>
          </PressableScale>
          <PressableScale
            onPress={onInviteSupport}
            style={styles.ghostBtn}
            accessibilityRole="button"
            accessibilityLabel="Invite support for this mission"
          >
            <Text style={styles.ghostText}>Invite support</Text>
          </PressableScale>
        </View>
      )}

      {!done ? (
        <Text style={styles.supportHint}>
          Support ask: {transfer.caregiverSupportAction}
        </Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderWidth: 1,
    borderColor: P.accent,
    backgroundColor: P.accentSoft,
    borderRadius: 2,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: P.line,
  },
  stepDone: {
    backgroundColor: P.accent,
  },
  stepActive: {
    backgroundColor: P.warn,
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  stepLine: {
    width: 18,
    height: 1,
    backgroundColor: P.line,
    marginHorizontal: 6,
  },
  stepLabel: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 11,
    marginLeft: 6,
  },
  stepLabelActive: {
    color: P.text,
    fontFamily: FONTS.bodyMedium,
  },
  eyebrow: {
    fontFamily: FONTS.bodyMedium,
    color: P.accent,
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  action: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  body: {
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: P.accent,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 2,
  },
  primaryText: {
    fontFamily: FONTS.bodyBold,
    color: P.ink,
    fontSize: 13,
  },
  secondaryBtn: {
    backgroundColor: P.mist,
    borderWidth: 1,
    borderColor: P.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 2,
  },
  secondaryText: {
    fontFamily: FONTS.bodyMedium,
    color: P.text,
    fontSize: 13,
  },
  ghostBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  ghostText: {
    fontFamily: FONTS.bodyMedium,
    color: P.cool,
    fontSize: 13,
  },
  doneBanner: {
    borderTopWidth: 1,
    borderTopColor: P.line,
    paddingTop: 12,
  },
  doneTitle: {
    fontFamily: FONTS.bodyBold,
    color: P.accent,
    fontSize: 14,
  },
  doneSub: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  laterBanner: {
    borderTopWidth: 1,
    borderTopColor: P.line,
    paddingTop: 12,
    gap: 10,
  },
  laterTitle: {
    fontFamily: FONTS.bodyBold,
    color: P.warn,
    fontSize: 14,
  },
  laterSub: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  supportHint: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 14,
  },
});
