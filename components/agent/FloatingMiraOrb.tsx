/**
 * FloatingMiraOrb — a small, steady Mira presence that floats in the corner
 * of screens where Mira is available but not the primary content (role
 * selection, signal path, etc.). Tapping opens the coach modal.
 *
 * Posture is `steady` — Mira is present and available, not actively doing
 * anything. This is the "I'm nearby" signal from the tier-transition
 * vocabulary in famile/web/docs/MIRA.md §3.
 *
 * On press, the orb briefly grows (inline → standard tier transition)
 * before the modal opens — a 200ms "leaning in" signal.
 */
import React, { useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { MiraOrb } from './MiraOrb';
import { steadyPresence } from '@/domain/agent';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface FloatingMiraOrbProps {
  onPress: () => void;
  size?: number;
}

export const FloatingMiraOrb: React.FC<FloatingMiraOrbProps> = ({ onPress, size = 44 }) => {
  const presence = steadyPresence();
  const reducedMotion = useReducedMotion();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    // Brief "leaning in" tier transition — grow 10% then settle as modal opens.
    if (!reducedMotion) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 200,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
    onPress();
  };

  return (
    <View style={styles.floating} pointerEvents="box-none">
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <MiraOrb
          posture="steady"
          presence={presence}
          size={size}
          onPress={handlePress}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  floating: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 50,
  },
});
