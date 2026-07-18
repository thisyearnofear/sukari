/**
 * Brief bridge between battle and transfer — same world, not arcade fanfare.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Easing } from 'react-native';
import { COLORS, FONTS, ANIMATIONS } from '@/constants/designSystem';
import { MetabolicField } from '@/components/atmosphere/MetabolicField';

const P = COLORS.PROGRAMME;

interface Props {
  result: 'victory' | 'defeat';
  onComplete: () => void;
  isPersonalBest?: boolean;
}

export const VictoryCelebration: React.FC<Props> = ({ result, onComplete, isPersonalBest }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(10)).current;
  const isVictory = result === 'victory';

  useEffect(() => {
    const enter = ANIMATIONS.MOTION.enter;
    const exit = ANIMATIONS.MOTION.exit;
    const easeIn = Easing.bezier(enter.bezier[0], enter.bezier[1], enter.bezier[2], enter.bezier[3]);
    const easeOut = Easing.bezier(exit.bezier[0], exit.bezier[1], exit.bezier[2], exit.bezier[3]);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        easing: easeIn,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 200,
        easing: easeIn,
        useNativeDriver: true,
      }),
    ]).start();

    const hold = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          easing: easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(slide, {
          toValue: -8,
          duration: 180,
          easing: easeOut,
          useNativeDriver: true,
        }),
      ]).start(onComplete);
    }, 900);

    return () => clearTimeout(hold);
  }, [opacity, slide, onComplete]);

  return (
    <View style={styles.overlay} pointerEvents="none">
      <MetabolicField band={isVictory ? 'in_range' : 'high'} intensity={isVictory ? 0.55 : 0.75} />
      <Animated.View
        style={[
          styles.center,
          {
            opacity,
            transform: [{ translateY: slide }, { scale: opacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0.96, 1],
            }) }],
          },
        ]}
      >
        <Text style={styles.brand}>Sukari</Text>
        <Text style={[styles.title, { color: isVictory ? P.accent : P.danger }]}>
          {isVictory ? 'Field steadied' : 'Field collapsed'}
        </Text>
        <Text style={styles.sub}>
          {isPersonalBest
            ? 'Strongest rehearsal yet — now the real mission.'
            : isVictory
              ? 'Rehearsal complete. Take it into real life.'
              : 'Tough round — the real-world ask still stands.'}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: P.ink,
  },
  center: {
    zIndex: 10,
    alignItems: 'center',
    paddingHorizontal: 32,
    maxWidth: 360,
  },
  brand: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 18,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 28,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  sub: {
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
  },
});
