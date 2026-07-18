/**
 * Quiet win — rare delight when a real-world mission is logged.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS, FONTS, ANIMATIONS } from '@/constants/designSystem';

const P = COLORS.PROGRAMME;

interface QuietWinBeatProps {
  message?: string;
  onDone?: () => void;
}

export function QuietWinBeat({
  message = 'Mission logged. The field remembers.',
  onDone,
}: QuietWinBeatProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    const enter = ANIMATIONS.MOTION.enter;
    const exit = ANIMATIONS.MOTION.exit;
    const easeIn = Easing.bezier(enter.bezier[0], enter.bezier[1], enter.bezier[2], enter.bezier[3]);
    const easeOut = Easing.bezier(exit.bezier[0], exit.bezier[1], exit.bezier[2], exit.bezier[3]);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: easeIn,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 220,
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
          toValue: -6,
          duration: 180,
          easing: easeOut,
          useNativeDriver: true,
        }),
      ]).start(() => onDone?.());
    }, 1600);

    return () => clearTimeout(hold);
  }, [opacity, slide, onDone]);

  return (
    <Animated.View
      style={[
        styles.root,
        {
          opacity,
          transform: [{ translateY: slide }],
        },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.title}>Done in real life</Text>
      <Text style={styles.body}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 72,
    left: 20,
    right: 20,
    zIndex: 120,
    borderWidth: 1,
    borderColor: P.accent,
    backgroundColor: P.inkElevated,
    borderRadius: 2,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: FONTS.bodyBold,
    color: P.accent,
    fontSize: 14,
  },
  body: {
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
});
