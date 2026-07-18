/**
 * ShareCard — screenshot-ready share surface for social / caregivers.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '@/constants/designSystem';

const P = COLORS.PROGRAMME;

interface Props {
  score: number;
  grade: string;
  accuracy: number;
  result: 'victory' | 'defeat';
  tier?: string;
  comboMax?: number;
  /** Caregiver support ask — distribution artifact */
  supportAction?: string;
  missionLabel?: string;
}

export const ShareCard: React.FC<Props> = ({
  score,
  grade,
  accuracy,
  result,
  comboMax,
  supportAction,
  missionLabel,
}) => {
  const isVictory = result === 'victory';
  const gradeColors: Record<string, string> = {
    S: P.warn,
    A: P.accent,
    B: P.cool,
    C: P.warn,
    D: P.danger,
  };

  return (
    <View style={styles.card}>
      <Text style={styles.brand}>Sukari</Text>
      <Text style={[styles.result, { color: isVictory ? P.accent : P.danger }]}>
        {isVictory ? 'Rehearsal complete' : 'Rehearsal interrupted'}
      </Text>

      {missionLabel ? <Text style={styles.mission}>{missionLabel}</Text> : null}

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{score.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Rehearsal</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.gradeValue, { color: gradeColors[grade] || P.text }]}>
            {grade}
          </Text>
          <Text style={styles.statLabel}>Grade</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{accuracy}%</Text>
          <Text style={styles.statLabel}>Decisions</Text>
        </View>
      </View>

      {comboMax && comboMax >= 3 ? (
        <Text style={styles.combo}>Best streak · {comboMax}×</Text>
      ) : null}

      {supportAction ? (
        <View style={styles.supportBox}>
          <Text style={styles.supportLabel}>Support ask</Text>
          <Text style={styles.supportText}>{supportAction}</Text>
        </View>
      ) : null}

      <Text style={styles.footer}>sukari.famile.xyz</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: P.ink,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: P.line,
    paddingVertical: 22,
    paddingHorizontal: 20,
    width: 300,
    alignItems: 'center',
  },
  brand: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 20,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  result: {
    fontFamily: FONTS.display,
    fontSize: 18,
    marginBottom: 12,
  },
  mission: {
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: P.line,
  },
  stat: { alignItems: 'center', flex: 1 },
  statValue: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 20,
  },
  gradeValue: {
    fontFamily: FONTS.display,
    fontSize: 26,
  },
  statLabel: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  combo: {
    fontFamily: FONTS.bodyMedium,
    color: P.warn,
    fontSize: 12,
    marginBottom: 8,
  },
  supportBox: {
    marginTop: 8,
    marginBottom: 4,
    padding: 12,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.mist,
    width: '100%',
  },
  supportLabel: {
    fontFamily: FONTS.bodyMedium,
    color: P.accent,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  supportText: {
    fontFamily: FONTS.body,
    color: P.text,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 10,
    marginTop: 12,
  },
});
