/**
 * ShareCard — Visual share card rendered as a View.
 * Designed to look good as a screenshot on social media.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  score: number;
  grade: string;
  accuracy: number;
  result: 'victory' | 'defeat';
  tier?: string;
  comboMax?: number;
}

export const ShareCard: React.FC<Props> = ({ score, grade, accuracy, result, tier, comboMax }) => {
  const isVictory = result === 'victory';
  const gradeColors: Record<string, string> = { S: '#fbbf24', A: '#22c55e', B: '#3b82f6', C: '#f59e0b', D: '#ef4444' };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.logo}>🏰</Text>
        <Text style={styles.title}>GLUCOSE WARS</Text>
      </View>

      <View style={styles.resultRow}>
        <Text style={styles.resultEmoji}>{isVictory ? '👑' : '💀'}</Text>
        <Text style={[styles.resultText, { color: isVictory ? '#fbbf24' : '#ef4444' }]}>
          {isVictory ? 'VICTORY' : 'DEFEATED'}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{score.toLocaleString()}</Text>
          <Text style={styles.statLabel}>SCORE</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.gradeValue, { color: gradeColors[grade] || '#fff' }]}>{grade}</Text>
          <Text style={styles.statLabel}>GRADE</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{accuracy}%</Text>
          <Text style={styles.statLabel}>ACCURACY</Text>
        </View>
      </View>

      {comboMax && comboMax >= 3 && (
        <Text style={styles.combo}>⚡ Best combo: {comboMax}x</Text>
      )}

      <Text style={styles.footer}>glucosewars.app</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0a0a12',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fbbf24',
    padding: 20,
    width: 300,
    alignItems: 'center',
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  logo: { fontSize: 24, marginRight: 8 },
  title: { color: '#fbbf24', fontSize: 18, fontWeight: 'bold', letterSpacing: 2 },
  resultRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  resultEmoji: { fontSize: 32, marginRight: 8 },
  resultText: { fontSize: 24, fontWeight: 'bold', letterSpacing: 3 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 12 },
  stat: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  gradeValue: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { color: '#6b7280', fontSize: 9, fontWeight: 'bold', marginTop: 2 },
  combo: { color: '#fbbf24', fontSize: 12, marginBottom: 8 },
  footer: { color: '#374151', fontSize: 10, marginTop: 8 },
});
