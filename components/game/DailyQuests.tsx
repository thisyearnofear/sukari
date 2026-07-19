/**
 * Today’s Mission — single programme ask.
 * Visual language: programme instrument, not quest board.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgrammeMission, AdherenceWeek } from '@/domain/programme';
import { COLORS, FONTS } from '@/constants/designSystem';
import { PressableScale } from '@/components/ui/PressableScale';
import { MiraOrb } from '@/components/agent/MiraOrb';
import { steadyPresence } from '@/domain/agent';

interface TodayMissionProps {
  mission: ProgrammeMission | null;
  adherenceWeek?: AdherenceWeek;
  renown: number;
  onPractice?: () => void;
  onMarkDone?: () => void;
  onAskCoach?: () => void;
  /** When true, hide internal Practice (parent owns primary CTA) */
  compact?: boolean;
}

export const DailyQuests: React.FC<TodayMissionProps> = ({
  mission,
  adherenceWeek,
  renown,
  onPractice,
  onMarkDone,
  onAskCoach,
  compact = false,
}) => {
  if (!mission) {
    const presence = steadyPresence();
    return (
      <View style={styles.container}>
        <Text style={styles.eyebrow}>Today</Text>
        <View style={styles.emptyRow}>
          {onAskCoach ? (
            <MiraOrb
              posture="steady"
              presence={presence}
              size={48}
              onPress={onAskCoach}
            />
          ) : null}
          <View style={{ flex: 1, marginLeft: onAskCoach ? 12 : 0 }}>
            <Text style={styles.empty}>Your next mission appears at dawn.</Text>
            {onAskCoach ? (
              <Text style={styles.emptyHint}>Tap Mira to ask anything.</Text>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  const done = mission.status === 'completed';
  const practiced = mission.status === 'practiced' || done;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Today’s mission</Text>
        {adherenceWeek && (
          <Text style={styles.weekLine}>
            {adherenceWeek.completed}/{Math.max(adherenceWeek.assigned, 1)} this week
          </Text>
        )}
      </View>

      <Text style={styles.realmCopy}>{mission.realmCopy}</Text>

      <View style={styles.actionBlock}>
        <Text style={styles.actionLabel}>In the real world</Text>
        <Text style={styles.action}>{mission.realWorldAction}</Text>
      </View>

      <Text style={[styles.status, done && styles.statusDone]}>
        {done ? 'Complete' : practiced ? 'Practiced — mark when done in life' : 'Assigned'}
        {renown > 0 ? ` · ${renown} renown` : ''}
      </Text>

      <View style={styles.row}>
        {!compact && onPractice && !done && (
          <PressableScale
            onPress={onPractice}
            accessibilityRole="button"
            accessibilityLabel="Practice today’s mission"
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Practice</Text>
          </PressableScale>
        )}
        {onMarkDone && practiced && !done && (
          <PressableScale
            onPress={onMarkDone}
            accessibilityRole="button"
            accessibilityLabel="Mark real-world action done"
            style={styles.secondaryBtn}
          >
            <Text style={styles.secondaryBtnText}>I did it</Text>
          </PressableScale>
        )}
        {onAskCoach && (
          <View style={styles.orbAsk}>
            <MiraOrb
              posture="watching"
              size={36}
              onPress={onAskCoach}
            />
            <Text style={styles.orbAskLabel}>Ask Mira</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.PROGRAMME.mist,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.PROGRAMME.line,
    paddingVertical: 20,
    paddingHorizontal: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  eyebrow: {
    fontFamily: FONTS.bodyMedium,
    color: COLORS.PROGRAMME.accent,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  weekLine: {
    fontFamily: FONTS.body,
    color: COLORS.PROGRAMME.textMuted,
    fontSize: 12,
  },
  empty: {
    fontFamily: FONTS.body,
    color: COLORS.PROGRAMME.textSoft,
    fontSize: 15,
    lineHeight: 22,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  emptyHint: {
    fontFamily: FONTS.body,
    color: COLORS.PROGRAMME.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  orbAsk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orbAskLabel: {
    fontFamily: FONTS.bodyMedium,
    color: COLORS.PROGRAMME.cool,
    fontSize: 13,
  },
  realmCopy: {
    fontFamily: FONTS.display,
    color: COLORS.PROGRAMME.text,
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 16,
  },
  actionBlock: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.PROGRAMME.line,
  },
  actionLabel: {
    fontFamily: FONTS.bodyMedium,
    color: COLORS.PROGRAMME.textMuted,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  action: {
    fontFamily: FONTS.body,
    color: COLORS.PROGRAMME.text,
    fontSize: 16,
    lineHeight: 24,
  },
  status: {
    fontFamily: FONTS.body,
    color: COLORS.PROGRAMME.textMuted,
    fontSize: 12,
    marginBottom: 14,
  },
  statusDone: {
    color: COLORS.PROGRAMME.accent,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: COLORS.PROGRAMME.accent,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 2,
  },
  primaryBtnText: {
    fontFamily: FONTS.bodyBold,
    color: COLORS.PROGRAMME.ink,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    backgroundColor: COLORS.PROGRAMME.coolSoft,
    borderWidth: 1,
    borderColor: COLORS.PROGRAMME.cool,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 2,
  },
  secondaryBtnText: {
    fontFamily: FONTS.bodyBold,
    color: COLORS.PROGRAMME.text,
    fontSize: 13,
  },
});
