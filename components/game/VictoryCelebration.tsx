/**
 * VictoryCelebration — Brief overlay shown on game end before results screen.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

interface Props {
  result: 'victory' | 'defeat';
  onComplete: () => void;
}

export const VictoryCelebration: React.FC<Props> = ({ result, onComplete }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      Animated.delay(800),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(onComplete);
  }, [scaleAnim, fadeAnim, onComplete]);

  const isVictory = result === 'victory';

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
        <Text style={styles.emoji}>{isVictory ? '👑' : '💀'}</Text>
        <Text style={[styles.title, { color: isVictory ? '#fbbf24' : '#ef4444' }]}>
          {isVictory ? 'VICTORY!' : 'DEFEATED'}
        </Text>
        <Text style={styles.sub}>
          {isVictory ? 'The Kingdom stands strong!' : 'The Horde prevails...'}
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  emoji: { fontSize: 72, marginBottom: 12 },
  title: { fontSize: 36, fontWeight: 'bold', letterSpacing: 4 },
  sub: { color: '#9ca3af', fontSize: 14, marginTop: 8 },
});
