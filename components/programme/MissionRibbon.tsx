/**
 * Mission ribbon — keeps rehearsal tied to the real-world ask.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS, FONTS, ANIMATIONS } from '@/constants/designSystem';

const P = COLORS.PROGRAMME;

interface MissionRibbonProps {
  action: string;
  compact?: boolean;
}

export function MissionRibbon({ action, compact }: MissionRibbonProps) {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const { duration, bezier } = ANIMATIONS.MOTION.enter;
    Animated.timing(enter, {
      toValue: 1,
      duration: Math.min(220, duration),
      easing: Easing.bezier(bezier[0], bezier[1], bezier[2], bezier[3]),
      useNativeDriver: true,
    }).start();
  }, [enter, action]);

  return (
    <Animated.View
      style={[
        styles.root,
        compact && styles.compact,
        {
          opacity: enter,
          transform: [
            {
              translateY: enter.interpolate({
                inputRange: [0, 1],
                outputRange: [-6, 0],
              }),
            },
          ],
        },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`Rehearsing mission: ${action}`}
    >
      <Text style={styles.eyebrow}>Rehearsing</Text>
      <Text style={styles.action} numberOfLines={compact ? 1 : 2}>
        {action}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderWidth: 1,
    borderColor: P.accent,
    backgroundColor: P.accentSoft,
    borderRadius: 2,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  compact: {
    paddingVertical: 6,
    marginBottom: 6,
  },
  eyebrow: {
    fontFamily: FONTS.bodyMedium,
    color: P.accent,
    fontSize: 9,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  action: {
    fontFamily: FONTS.bodyMedium,
    color: P.text,
    fontSize: 12,
    lineHeight: 16,
  },
});
