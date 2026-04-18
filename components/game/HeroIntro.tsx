/**
 * HeroIntro — Cinematic intro montage shown on first app open.
 * Quick animated sequence that communicates the game's premise and aesthetic.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, useWindowDimensions, TouchableOpacity } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const SCENES = [
  { emoji: '🏰', title: 'YOUR BODY IS YOUR KINGDOM', sub: '', duration: 1800 },
  { emoji: '🥦⚔️🍩', title: 'ALLIES vs THE SUGAR HORDE', sub: 'Rally the good. Banish the bad.', duration: 2000 },
  { emoji: '👆👇', title: 'SWIPE TO DEFEND', sub: 'Fast reflexes. Smart choices.', duration: 1600 },
  { emoji: '👑', title: 'MASTER YOUR HARMONY', sub: '', duration: 1400 },
];

interface HeroIntroProps {
  onComplete: () => void;
}

export const HeroIntro: React.FC<HeroIntroProps> = ({ onComplete }) => {
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [sceneIndex, setSceneIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const emojiAnim = useRef(new Animated.Value(0)).current;

  // Skip animation entirely for reduced motion
  useEffect(() => {
    if (reducedMotion) { onComplete(); return; }
  }, [reducedMotion, onComplete]);

  useEffect(() => {
    if (sceneIndex >= SCENES.length) { onComplete(); return; }

    const scene = SCENES[sceneIndex];

    // Reset
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.7);
    emojiAnim.setValue(0);

    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.spring(emojiAnim, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
    ]).start();

    // Advance to next scene
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true })
        .start(() => setSceneIndex(i => i + 1));
    }, scene.duration);

    return () => clearTimeout(timer);
  }, [sceneIndex, fadeAnim, scaleAnim, emojiAnim, onComplete]);

  if (sceneIndex >= SCENES.length) return null;
  const scene = SCENES[sceneIndex];

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a12', justifyContent: 'center', alignItems: 'center' }}>
      {/* Radial glow */}
      <View style={{
        position: 'absolute', width: 300, height: 300, borderRadius: 150,
        backgroundColor: sceneIndex === 0 ? 'rgba(251,191,36,0.15)' :
          sceneIndex === 1 ? 'rgba(239,68,68,0.12)' :
          sceneIndex === 2 ? 'rgba(34,197,94,0.12)' : 'rgba(168,85,247,0.15)',
      }} />

      <Animated.View style={{
        alignItems: 'center', opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}>
        <Animated.Text style={{
          fontSize: sceneIndex === 1 ? 48 : 72, marginBottom: 20,
          transform: [{ scale: emojiAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
        }}>
          {scene.emoji}
        </Animated.Text>

        <Text style={{
          color: '#fbbf24', fontSize: 22, fontWeight: 'bold',
          textAlign: 'center', letterSpacing: 2, paddingHorizontal: 32,
        }}>
          {scene.title}
        </Text>

        {scene.sub ? (
          <Text style={{
            color: '#9ca3af', fontSize: 14, textAlign: 'center',
            marginTop: 8, paddingHorizontal: 40,
          }}>
            {scene.sub}
          </Text>
        ) : null}
      </Animated.View>

      {/* Progress dots */}
      <View style={{ position: 'absolute', bottom: 80, flexDirection: 'row', gap: 8 }}>
        {SCENES.map((_, i) => (
          <View key={i} style={{
            width: i === sceneIndex ? 24 : 8, height: 8, borderRadius: 4,
            backgroundColor: i === sceneIndex ? '#fbbf24' : i < sceneIndex ? '#fbbf2480' : '#374151',
          }} />
        ))}
      </View>

      {/* Skip */}
      <TouchableOpacity
        onPress={onComplete}
        style={{ position: 'absolute', bottom: 40 }}
        accessibilityLabel="Skip intro" accessibilityRole="button"
      >
        <Text style={{ color: '#6b7280', fontSize: 13 }}>Skip →</Text>
      </TouchableOpacity>
    </View>
  );
};
