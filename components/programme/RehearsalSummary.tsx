/**
 * Compact rehearsal summary — score is secondary to the real-world transfer.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '@/constants/designSystem';
import { PressableScale } from '@/components/ui/PressableScale';

const P = COLORS.PROGRAMME;

interface RehearsalSummaryProps {
  score: number;
  accuracy: number;
  correctSwipes: number;
  incorrectSwipes: number;
  stability?: number;
  showStability?: boolean;
}

export function RehearsalSummary({
  score,
  accuracy,
  correctSwipes,
  incorrectSwipes,
  stability,
  showStability,
}: RehearsalSummaryProps) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.root}>
      <PressableScale
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={open ? 'Hide rehearsal details' : 'Show rehearsal details'}
        style={styles.header}
      >
        <Text style={styles.eyebrow}>Rehearsal</Text>
        <Text style={styles.summaryLine}>
          {score.toLocaleString()} pts · {accuracy}% decisions
          {open ? ' · hide' : ' · details'}
        </Text>
      </PressableScale>

      {open ? (
        <View style={styles.detail}>
          <Row label="Score" value={score.toLocaleString()} />
          <Row label="Decision accuracy" value={`${accuracy}%`} />
          <Row label="Steady / spike choices" value={`${correctSwipes} / ${incorrectSwipes}`} />
          {showStability && stability != null ? (
            <Row
              label="Stability"
              value={`${Math.round(stability)}%`}
              valueColor={stability >= 40 && stability <= 60 ? P.accent : P.warn}
            />
          ) : null}
          <Text style={styles.note}>
            Score measures rehearsal quality. Adherence is measured when you complete the mission in
            real life.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function Row({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.mist,
    borderRadius: 2,
    marginBottom: 14,
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  eyebrow: {
    fontFamily: FONTS.bodyMedium,
    color: P.textMuted,
    fontSize: 10,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryLine: {
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 13,
  },
  detail: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: P.line,
    paddingTop: 10,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 13,
  },
  rowValue: {
    fontFamily: FONTS.bodyBold,
    color: P.text,
    fontSize: 13,
  },
  note: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },
});
