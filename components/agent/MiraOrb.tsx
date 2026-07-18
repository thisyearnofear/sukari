import React, { useEffect, useId, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { COLORS } from '@/constants/designSystem';
import type { MiraPosture } from '@/domain/agent';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { PressableScale } from '@/components/ui/PressableScale';

const P = COLORS.PROGRAMME;

type OrbVisual = {
  core: string;
  edge: string;
  glow: string;
  breathMs: number;
  haloScale: number;
  tilt: number;
};

const VISUALS: Record<MiraPosture, OrbVisual> = {
  offering: { core: '#77C99E', edge: P.accent, glow: 'rgba(61, 155, 122, 0.30)', breathMs: 3600, haloScale: 1.13, tilt: 0 },
  adapting: { core: '#8ABBC8', edge: P.cool, glow: 'rgba(74, 143, 168, 0.28)', breathMs: 3000, haloScale: 1.08, tilt: -10 },
  holding: { core: '#D3B36D', edge: P.warn, glow: 'rgba(196, 146, 58, 0.24)', breathMs: 4300, haloScale: 1.05, tilt: 7 },
  waiting: { core: '#83B8C8', edge: P.cool, glow: 'rgba(74, 143, 168, 0.20)', breathMs: 5200, haloScale: 1.04, tilt: -5 },
  completed: { core: '#9CD8AD', edge: '#67B985', glow: 'rgba(103, 185, 133, 0.28)', breathMs: 4600, haloScale: 1.18, tilt: 0 },
};

type Props = {
  posture: MiraPosture;
  size?: number;
  onPress?: () => void;
};

/**
 * Shared visual carrier for Famile's Mira. The renderer stays deliberately
 * lightweight; posture belongs to the pure domain contract, not the artwork.
 */
export function MiraOrb({ posture, size = 54, onPress }: Props) {
  const reducedMotion = useReducedMotion();
  const breath = useRef(new Animated.Value(0)).current;
  const settle = useRef(new Animated.Value(0)).current;
  const visual = VISUALS[posture];
  const gradientId = `mira-orb-${useId().replace(/:/g, '')}`;

  useEffect(() => {
    settle.setValue(0);
    Animated.timing(settle, {
      toValue: 1,
      duration: reducedMotion ? 0 : 420,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [posture, reducedMotion, settle]);

  useEffect(() => {
    breath.stopAnimation();
    if (reducedMotion) {
      breath.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: visual.breathMs / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: visual.breathMs / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breath, reducedMotion, visual.breathMs]);

  const coreScale = breath.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.035] });
  const haloScale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, visual.haloScale] });
  const haloOpacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.32, 0.72] });
  const arrivalScale = settle.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });
  const arrivalOpacity = settle.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });

  const orb = (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.frame,
        {
          width: size,
          height: size,
          opacity: arrivalOpacity,
          transform: [{ scale: arrivalScale }, { rotate: `${visual.tilt}deg` }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.halo,
          {
            backgroundColor: visual.glow,
            opacity: haloOpacity,
            transform: [{ scale: haloScale }],
          },
        ]}
      />
      <Animated.View style={{ transform: [{ scale: coreScale }] }}>
        <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden>
          <Defs>
            <RadialGradient id={gradientId} cx="34%" cy="28%" rx="66%" ry="70%">
              <Stop offset="0" stopColor="#F3FCF5" stopOpacity="0.94" />
              <Stop offset="0.24" stopColor={visual.core} stopOpacity="0.96" />
              <Stop offset="0.7" stopColor={visual.edge} stopOpacity="0.96" />
              <Stop offset="1" stopColor={P.ink} stopOpacity="0.94" />
            </RadialGradient>
          </Defs>
          <Circle cx="50" cy="50" r="37" fill={`url(#${gradientId})`} />
          <Circle cx="50" cy="50" r="39.5" fill="none" stroke={visual.edge} strokeOpacity="0.38" strokeWidth="0.8" />
          <Circle cx="38" cy="35" r="10" fill="#FFFFFF" fillOpacity="0.11" />
        </Svg>
      </Animated.View>
      <View style={[styles.satellite, styles.satelliteOne, { backgroundColor: visual.core }]} />
      {posture === 'adapting' || posture === 'completed' ? (
        <View style={[styles.satellite, styles.satelliteTwo, { backgroundColor: visual.edge }]} />
      ) : null}
    </Animated.View>
  );

  if (!onPress) return orb;

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Open Mira"
      style={styles.pressable}
      pressedScale={0.94}
    >
      {orb}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'flex-start',
  },
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: '72%',
    height: '72%',
    borderRadius: 999,
  },
  satellite: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 999,
    opacity: 0.72,
  },
  satelliteOne: {
    top: '19%',
    right: '15%',
  },
  satelliteTwo: {
    bottom: '17%',
    left: '14%',
    opacity: 0.48,
  },
});
