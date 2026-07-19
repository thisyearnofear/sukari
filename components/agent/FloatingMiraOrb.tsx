/**
 * FloatingMiraOrb — a small, steady Mira presence that floats in the corner
 * of screens where Mira is available but not the primary content (role
 * selection, signal path, etc.). Tapping opens the coach modal.
 *
 * Posture is `steady` — Mira is present and available, not actively doing
 * anything. This is the "I'm nearby" signal from the tier-transition
 * vocabulary in famile/web/docs/MIRA.md §3.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MiraOrb } from './MiraOrb';
import { steadyPresence } from '@/domain/agent';

interface FloatingMiraOrbProps {
  onPress: () => void;
  size?: number;
}

export const FloatingMiraOrb: React.FC<FloatingMiraOrbProps> = ({ onPress, size = 44 }) => {
  const presence = steadyPresence();
  return (
    <View style={styles.floating} pointerEvents="box-none">
      <MiraOrb
        posture="steady"
        presence={presence}
        size={size}
        onPress={onPress}
      />
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
