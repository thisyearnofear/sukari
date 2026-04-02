import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '@/constants/designSystem';

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  title: string;
  isPlayer?: boolean;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'Sir Glucose', score: 1250, title: 'Grand Master', isPlayer: false },
  { rank: 2, name: 'Lady Insulin', score: 1180, title: 'Guardian', isPlayer: false },
  { rank: 3, name: 'Knight Fiber', score: 1050, title: 'Knight', isPlayer: false },
  { rank: 4, name: 'Alchemist Ben', score: 980, title: 'Royal Alchemist', isPlayer: false },
  { rank: 5, name: 'Squire Sam', score: 850, title: 'Squire', isPlayer: false },
];

interface WeeklyLeaderboardProps {
  playerScore?: number;
  playerTitle?: string;
  seed: number;
}

export const WeeklyLeaderboard: React.FC<WeeklyLeaderboardProps> = ({ playerScore, playerTitle, seed }) => {
  // In a real app, we'd fetch based on seed. Here we just show mock data.
  const displayData = [...MOCK_LEADERBOARD];
  
  if (playerScore !== undefined) {
    const playerRank = displayData.findIndex(e => e.score < playerScore);
    const finalRank = playerRank === -1 ? displayData.length + 1 : playerRank + 1;
    
    // Insert player if not already in top 5, or just update if they are
    if (finalRank <= 5) {
      displayData.splice(finalRank - 1, 0, {
        rank: finalRank,
        name: 'YOU',
        score: playerScore,
        title: playerTitle || 'Squire',
        isPlayer: true
      });
      // Re-rank
      displayData.forEach((e, i) => e.rank = i + 1);
    } else {
      displayData.push({
        rank: finalRank,
        name: 'YOU',
        score: playerScore,
        title: playerTitle || 'Squire',
        isPlayer: true
      });
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 WEEKLY ALCHEMIST RANKINGS</Text>
      <Text style={styles.subtitle}>Seed: #{seed} • Ends in 3 days</Text>
      
      <ScrollView style={styles.scroll}>
        {displayData.slice(0, 6).map((entry) => (
          <View 
            key={entry.rank} 
            style={[
              styles.row, 
              entry.isPlayer && styles.playerRow
            ]}
          >
            <Text style={styles.rank}>#{entry.rank}</Text>
            <View style={styles.nameCol}>
              <Text style={[styles.name, entry.isPlayer && styles.playerText]}>{entry.name}</Text>
              <Text style={styles.entryTitle}>{entry.title}</Text>
            </View>
            <Text style={styles.score}>{entry.score} pts</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(30, 27, 75, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.4)',
    marginVertical: 10,
    width: '100%',
  },
  title: {
    color: '#a78bfa',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 1,
  },
  subtitle: {
    color: '#6d6e9c',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 12,
  },
  scroll: {
    maxHeight: 200,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(124, 58, 237, 0.1)',
  },
  playerRow: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderRadius: 8,
    borderBottomWidth: 0,
    marginVertical: 2,
  },
  rank: {
    color: '#94a3b8',
    width: 30,
    fontWeight: 'bold',
    fontSize: 12,
  },
  nameCol: {
    flex: 1,
  },
  name: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  playerText: {
    color: '#fbbf24',
  },
  entryTitle: {
    color: '#64748b',
    fontSize: 10,
  },
  score: {
    color: '#fbbf24',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
