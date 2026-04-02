import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DailyQuest } from '@/hooks/usePlayerProgress';
import { COLORS } from '@/constants/designSystem';

interface DailyQuestsProps {
  quests: DailyQuest[];
  renown: number;
}

export const DailyQuests: React.FC<DailyQuestsProps> = ({ quests, renown }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📜 DAILY ROYAL DECREES</Text>
        <View style={styles.renownBadge}>
          <Text style={styles.renownText}>👑 {renown}</Text>
        </View>
      </View>
      
      {quests.map((quest) => {
        const progress = quest.current / quest.target;
        return (
          <View key={quest.id} style={styles.questCard}>
            <View style={styles.questInfo}>
              <View style={styles.textContainer}>
                <Text style={[styles.questTitle, quest.completed && styles.completedText]}>
                  {quest.title} {quest.completed ? '✅' : ''}
                </Text>
                <Text style={styles.questDescription}>{quest.description}</Text>
              </View>
              <Text style={styles.rewardText}>+{quest.reward} XP</Text>
            </View>
            
            <View style={styles.progressBarBg}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${progress * 100}%` },
                  quest.completed && { backgroundColor: COLORS.ALLY }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {quest.current} / {quest.target}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fbbf24', // amber-400
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: 'bold',
  },
  renownBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  renownText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: 'bold',
  },
  questCard: {
    marginBottom: 12,
  },
  questInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  textContainer: {
    flex: 1,
  },
  questTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  completedText: {
    color: COLORS.ALLY,
    textDecorationLine: 'line-through',
  },
  questDescription: {
    color: '#9ca3af', // gray-400
    fontSize: 11,
  },
  rewardText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fbbf24',
  },
  progressText: {
    color: '#9ca3af',
    fontSize: 10,
    textAlign: 'right',
    marginTop: 2,
  },
});
