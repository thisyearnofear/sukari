/**
 * HeroIntro — short first-open beat. Rare delight; skippable.
 * Communicates programme premise, not castle fantasy.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { COLORS, FONTS, ANIMATIONS } from '@/constants/designSystem';
import { MetabolicField } from '@/components/atmosphere/MetabolicField';
import { PressableScale } from '@/components/ui/PressableScale';

const P = COLORS.PROGRAMME;

const SCENES = [
  {
    title: 'Care happens every day — not just at appointments',
    sub: 'Glucose Wars is an adherence engine for at-home metabolic care.',
    duration: 2400,
    band: 'in_range' as const,
  },
  {
    title: 'One personalized mission',
    sub: 'AI finds a pattern in your signals, then proposes one achievable experiment.',
    duration: 2400,
    band: 'high' as const,
  },
  {
    title: 'Rehearse, act, measure, adapt',
    sub: 'Practice the decision in 45 seconds. Do it in real life. Learn what helped.',
    duration: 2600,
    band: 'in_range' as const,
  },
  {
    title: 'Your care team stays informed — without another dashboard',
    sub: 'Exception-oriented summaries when human attention can help.',
    duration: 2400,
    band: 'in_range' as const,
  },
];

interface HeroIntroProps {
  onComplete: () => void;
}

export const HeroIntro: React.FC<HeroIntroProps> = ({ onComplete }) => {
  const reducedMotion = useReducedMotion();
  const [sceneIndex, setSceneIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (reducedMotion) {
      onComplete();
    }
  }, [reducedMotion, onComplete]);

  useEffect(() => {
    if (reducedMotion) return;
    if (sceneIndex >= SCENES.length) {
      onComplete();
      return;
    }

    const scene = SCENES[sceneIndex];
    const enter = ANIMATIONS.MOTION.enter;
    const exit = ANIMATIONS.MOTION.exit;
    const easeIn = Easing.bezier(enter.bezier[0], enter.bezier[1], enter.bezier[2], enter.bezier[3]);
    const easeOut = Easing.bezier(exit.bezier[0], exit.bezier[1], exit.bezier[2], exit.bezier[3]);

    fadeAnim.setValue(0);
    slideAnim.setValue(14);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: enter.duration,
        easing: easeIn,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: enter.duration,
        easing: easeIn,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: exit.duration,
          easing: easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -8,
          duration: exit.duration,
          easing: easeOut,
          useNativeDriver: true,
        }),
      ]).start(() => setSceneIndex((i) => i + 1));
    }, scene.duration);

    return () => clearTimeout(timer);
  }, [sceneIndex, fadeAnim, slideAnim, onComplete, reducedMotion]);

  if (reducedMotion || sceneIndex >= SCENES.length) return null;

  const scene = SCENES[sceneIndex];

  return (
    <View style={styles.root}>
      <MetabolicField band={scene.band} intensity={0.5} />

      <Animated.View
        style={[
          styles.scene,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.brand}>Glucose Wars</Text>
        <Text style={styles.title}>{scene.title}</Text>
        {scene.sub ? <Text style={styles.sub}>{scene.sub}</Text> : null}
      </Animated.View>

      <View style={styles.dots}>
        {SCENES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === sceneIndex && styles.dotActive,
              i < sceneIndex && styles.dotDone,
            ]}
          />
        ))}
      </View>

      <PressableScale
        onPress={onComplete}
        accessibilityLabel="Skip intro"
        accessibilityRole="button"
        style={styles.skip}
      >
        <Text style={styles.skipText}>Skip</Text>
      </PressableScale>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scene: {
    zIndex: 10,
    alignItems: 'center',
    paddingHorizontal: 36,
    maxWidth: 420,
  },
  brand: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 22,
    letterSpacing: -0.3,
    marginBottom: 28,
  },
  title: {
    fontFamily: FONTS.display,
    color: P.textSoft,
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  sub: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: 14,
  },
  dots: {
    position: 'absolute',
    bottom: 88,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  dot: {
    width: 8,
    height: 3,
    borderRadius: 1,
    backgroundColor: P.line,
  },
  dotActive: {
    width: 22,
    backgroundColor: P.accent,
  },
  dotDone: {
    backgroundColor: 'rgba(61, 155, 122, 0.45)',
  },
  skip: {
    position: 'absolute',
    bottom: 40,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontFamily: FONTS.bodyMedium,
    color: P.textMuted,
    fontSize: 13,
  },
});
