/**
 * VictoryCelebration — Brief overlay with confetti on victory, skull on defeat.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, useWindowDimensions } from 'react-native';

const CONFETTI = ['🎉', '✨', '⭐', '🏆', '👑', '💎', '🎊', '⚡'];

const ConfettiPiece: React.FC<{ emoji: string; x: number; delay: number; screenH: number }> = ({ emoji, x, delay, screenH }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: true }),
    ]).start();
  }, [anim, delay]);

  return (
    <Animated.Text style={{
      position: 'absolute', left: x, top: 0, fontSize: 24,
      opacity: anim.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] }),
      transform: [
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, screenH * 0.7] }) },
        { rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${180 + Math.random() * 360}deg`] }) },
      ],
    }}>
      {emoji}
    </Animated.Text>
  );
};

interface Props { result: 'victory' | 'defeat'; onComplete: () => void; isPersonalBest?: boolean }

export const VictoryCelebration: React.FC<Props> = ({ result, onComplete, isPersonalBest }) => {
  const { width: viewportWidth, height } = useWindowDimensions();
  const width = Math.min(viewportWidth, 500);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isVictory = result === 'victory';

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      Animated.delay(1000),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(onComplete);
  }, [scaleAnim, fadeAnim, onComplete]);

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      {isVictory && Array.from({ length: 16 }).map((_, i) => (
        <ConfettiPiece
          key={i}
          emoji={CONFETTI[i % CONFETTI.length]}
          x={Math.random() * width}
          delay={i * 60}
          screenH={height}
        />
      ))}
      <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
        <Text style={styles.emoji}>{isVictory ? '👑' : '💀'}</Text>
        <Text style={[styles.title, { color: isVictory ? '#fbbf24' : '#ef4444' }]}>
          {isVictory ? 'VICTORY!' : 'DEFEATED'}
        </Text>
        <Text style={styles.sub}>
          {isPersonalBest ? '⭐ NEW PERSONAL BEST!' : isVictory ? 'The Kingdom stands strong!' : 'The Horde prevails...'}
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center', alignItems: 'center', zIndex: 9999,
  },
  emoji: { fontSize: 72, marginBottom: 12 },
  title: { fontSize: 36, fontWeight: 'bold', letterSpacing: 4 },
  sub: { color: '#9ca3af', fontSize: 14, marginTop: 8 },
});
