/**
 * TodayMission — single daily programme mission card.
 * Enhances former DailyQuests multi-list into one adherence ask.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ProgrammeMission, AdherenceWeek } from '@/domain/programme';
import { COLORS } from '@/constants/designSystem';

interface TodayMissionProps {
  mission: ProgrammeMission | null;
  adherenceWeek?: AdherenceWeek;
  renown: number;
  onPractice?: () => void;
  onMarkDone?: () => void;
  onAskCoach?: () => void;
}

export const DailyQuests: React.FC<TodayMissionProps> = ({
  mission,
  adherenceWeek,
  renown,
  onPractice,
  onMarkDone,
  onAskCoach,
}) => {
  if (!mission) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>TODAY’S MISSION</Text>
        <Text style={styles.empty}>Your next decree appears at dawn.</Text>
      </View>
    );
  }

  const done = mission.status === 'completed';
  const practiced = mission.status === 'practiced' || done;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TODAY’S MISSION</Text>
        <View style={styles.renownBadge}>
          <Text style={styles.renownText}>👑 {renown}</Text>
        </View>
      </View>

      {adherenceWeek && (
        <Text style={styles.weekLine}>
          Week {adherenceWeek.completed}/{Math.max(adherenceWeek.assigned, 1)} complete
          {adherenceWeek.relapses > 0 ? ` · ${adherenceWeek.relapses} recovery` : ''}
        </Text>
      )}

      <View style={[styles.card, done && styles.cardDone]}>
        <Text style={styles.realmCopy}>{mission.realmCopy}</Text>
        <Text style={styles.actionLabel}>REAL WORLD</Text>
        <Text style={styles.action}>{mission.realWorldAction}</Text>
        <Text style={styles.status}>
          {done ? '✓ Complete' : practiced ? 'Practiced — mark when done in real life' : 'Assigned'}
        </Text>

        <View style={styles.row}>
          {onPractice && !done && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={onPractice}
              accessibilityRole="button"
              accessibilityLabel="Practice today’s mission"
            >
              <Text style={styles.primaryBtnText}>PRACTICE</Text>
            </TouchableOpacity>
          )}
          {onMarkDone && practiced && !done && (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={onMarkDone}
              accessibilityRole="button"
              accessibilityLabel="Mark real-world action done"
            >
              <Text style={styles.secondaryBtnText}>I DID IT</Text>
            </TouchableOpacity>
          )}
          {onAskCoach && (
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={onAskCoach}
              accessibilityRole="button"
              accessibilityLabel="Ask the Alchemist"
            >
              <Text style={styles.ghostBtnText}>ALCHEMIST</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    color: COLORS.ALLY || '#fbbf24',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  renownBadge: {
    backgroundColor: 'rgba(217, 119, 6, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  renownText: { color: '#fde68a', fontSize: 11, fontWeight: 'bold' },
  weekLine: { color: '#9ca3af', fontSize: 10, marginBottom: 8 },
  empty: { color: '#9ca3af', fontSize: 12 },
  card: {
    backgroundColor: 'rgba(15, 15, 26, 0.9)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
  },
  cardDone: { borderColor: 'rgba(34, 197, 94, 0.5)' },
  realmCopy: { color: '#e5e7eb', fontSize: 13, fontWeight: '600', marginBottom: 8, lineHeight: 18 },
  actionLabel: {
    color: '#60a5fa',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 2,
  },
  action: { color: '#fff', fontSize: 13, marginBottom: 8, lineHeight: 18 },
  status: { color: '#a78bfa', fontSize: 11, marginBottom: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  primaryBtn: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
  secondaryBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    borderWidth: 1,
    borderColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  secondaryBtnText: { color: '#93c5fd', fontWeight: 'bold', fontSize: 11 },
  ghostBtn: {
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  ghostBtnText: { color: '#c4b5fd', fontWeight: 'bold', fontSize: 11 },
});
