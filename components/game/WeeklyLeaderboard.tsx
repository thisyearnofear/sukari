import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  const proclamationAnim = useRef(new Animated.Value(0)).current;
  const [showProclamation, setShowProclamation] = useState(false);
  const [proclamation, setProclamation] = useState('');

  useEffect(() => {
    const PROCLAMATIONS = [
      "Alchemist Scribe just unlocked a new Deed!",
      "Lady Insulin has secured the Royal Treasury.",
      "Knight Fiber is leading the Alchemist's Lab.",
      "A new Squire has entered the Realm!",
      "The Sugar Horde is retreating in Sector 7."
    ];

    const cycleProclamations = () => {
      setProclamation(PROCLAMATIONS[Math.floor(Math.random() * PROCLAMATIONS.length)]);
      setShowProclamation(true);
      
      Animated.sequence([
        Animated.timing(proclamationAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.delay(4000),
        Animated.timing(proclamationAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]).start(() => {
        setShowProclamation(false);
        setTimeout(cycleProclamations, 5000);
      });
    };

    const timer = setTimeout(cycleProclamations, 2000);
    return () => clearTimeout(timer);
  }, [proclamationAnim]);

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
      {showProclamation && (
        <Animated.View 
          style={[
            styles.proclamation,
            { opacity: proclamationAnim, transform: [{ translateY: proclamationAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }
          ]}
        >
          <Text style={styles.proclamationText}>📢 {proclamation}</Text>
        </Animated.View>
      )}

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
            <TouchableOpacity 
              onPress={() => {
                const message = `I just achieved ${entry.score} pts in the Alchemist's Lab! Can you beat my score in #GlucoseWars? ⚔️🧪`;
                if (Platform.OS === 'web') {
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`, '_blank');
                } else {
                  // Fallback for native
                  console.log('Sharing:', message);
                }
              }}
              style={styles.shareBtn}
            >
              <Ionicons name="share-social-outline" size={14} color="#a78bfa" />
            </TouchableOpacity>
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
  proclamation: {
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    marginBottom: 12,
    alignSelf: 'center',
  },
  proclamationText: {
    color: '#a78bfa',
    fontSize: 10,
    fontWeight: 'bold',
    fontStyle: 'italic',
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
  shareBtn: {
    marginLeft: 12,
    padding: 6,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.4)',
  },
});
