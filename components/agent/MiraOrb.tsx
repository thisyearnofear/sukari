import React, { useEffect, useId, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { COLORS } from '@/constants/designSystem';
import {
  MiraPaletteTokens,
  POSTURE_TEMPERATURE,
  POSTURE_BREATH_MS,
  tierForSize,
  postureMorph,
} from '@/domain/agent/miraContract';
import type { MorphParams, MiraPosture, MiraRenderTier } from '@/domain/agent/miraContract';
import type { SukariMiraPresence } from '@/domain/agent';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { PressableScale } from '@/components/ui/PressableScale';

const P = COLORS.PROGRAMME;

/**
 * Sukari's palette tokens — one hue per temperature. The orb reads
 * temperature from the posture (via POSTURE_TEMPERATURE) and hue from this
 * table. Other products fill in their own hues; temperature is shared.
 */
const SUKARI_PALETTE: MiraPaletteTokens = {
  cool: '#83B8C8',
  warm: '#77C99E',
  muted: '#D3B36D',
  coolEdge: P.cool,
  warmEdge: P.accent,
  mutedEdge: P.warn,
  coolGlow: 'rgba(74, 143, 168, 0.22)',
  warmGlow: 'rgba(61, 155, 122, 0.30)',
  mutedGlow: 'rgba(196, 146, 58, 0.24)',
};

type OrbVisual = {
  core: string;
  edge: string;
  glow: string;
  breathMs: number;
  haloScale: number;
  tilt: number;
};

/**
 * Resolve the visual for a posture from the contract's temperature mapping
 * and Sukari's palette tokens. Previously this was a hardcoded per-posture
 * table; now it derives from the shared contract so adding a posture in
 * miraContract.ts automatically gets a correct visual here.
 */
function resolveVisual(posture: MiraPosture, morph: MorphParams): OrbVisual {
  const temp = POSTURE_TEMPERATURE[posture];
  const core = temp === 'cool' ? SUKARI_PALETTE.cool : temp === 'warm' ? SUKARI_PALETTE.warm : SUKARI_PALETTE.muted;
  const edge = temp === 'cool' ? SUKARI_PALETTE.coolEdge : temp === 'warm' ? SUKARI_PALETTE.warmEdge : SUKARI_PALETTE.mutedEdge;
  const glow = temp === 'cool' ? SUKARI_PALETTE.coolGlow : temp === 'warm' ? SUKARI_PALETTE.warmGlow : SUKARI_PALETTE.mutedGlow;
  return {
    core,
    edge,
    glow,
    breathMs: POSTURE_BREATH_MS[posture],
    // Halo scale scales with bloom — outward-reaching postures glow larger.
    haloScale: 1.04 + morph.bloom * 0.14,
    // Tilt maps from asymmetry (-1..1 → -10..7 degrees).
    tilt: morph.asymmetry * -10,
  };
}

type Props = {
  posture: MiraPosture;
  morph?: MorphParams;
  size?: number;
  onPress?: () => void;
  /**
   * Optional presence override. When provided, the orb reads posture, morph,
   * and reaction from it — the canonical path. Falls back to posture + morph
   * props for backward compatibility.
   */
  presence?: SukariMiraPresence;
};

/**
 * Shared visual carrier for Famile's Mira. The renderer stays deliberately
 * lightweight; posture belongs to the pure domain contract, not the artwork.
 *
 * Native ceiling is the inline tier (SVG). The component is tier-aware so a
 * future web port or a shared spec reader can ask "what tier would this size
 * be?" and get the right answer from the contract. Tier transitions are
 * seek-safe: the settle animation replays on posture change.
 *
 * Contract: famile/web/docs/MIRA.md
 */
export function MiraOrb({ posture, morph, size = 54, onPress, presence }: Props) {
  const reducedMotion = useReducedMotion();
  const breath = useRef(new Animated.Value(0)).current;
  const settle = useRef(new Animated.Value(0)).current;
  const reactionPulse = useRef(new Animated.Value(0)).current;

  const effectivePosture = presence?.posture ?? posture;
  const effectiveMorph = presence?.morph ?? morph ?? resolveDefaultMorph(effectivePosture);
  const visual = resolveVisual(effectivePosture, effectiveMorph);
  // Tier awareness from the contract. Native ceiling is inline (SVG); the
  // tier is computed so a web port or spec reader gets the right answer.
  // At standard/hero (web only), more satellites would render.
  const tier: MiraRenderTier = tierForSize(size);
  const gradientId = `mira-orb-${useId().replace(/:/g, '')}`;

  // Settle animation on posture change — 420ms ease-in (seek-safe).
  useEffect(() => {
    settle.setValue(0);
    Animated.timing(settle, {
      toValue: 1,
      duration: reducedMotion ? 0 : 420,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [effectivePosture, reducedMotion, settle]);

  // Breath loop — cadence from the contract, modulated by morph.speed.
  useEffect(() => {
    breath.stopAnimation();
    if (reducedMotion) {
      breath.setValue(0);
      return;
    }
    const cycleMs = visual.breathMs / effectiveMorph.speed;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: cycleMs / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: cycleMs / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breath, reducedMotion, visual.breathMs, effectiveMorph.speed]);

  // One-shot reaction pulse — plays when reaction.eventId changes, then
  // eases back to the sustained posture. Subtle at inline sizes.
  const reactionId = presence?.reaction?.eventId;
  const reactionKind = presence?.reaction?.kind;
  useEffect(() => {
    if (!reactionId || reducedMotion) return;
    reactionPulse.setValue(0);
    Animated.sequence([
      Animated.timing(reactionPulse, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(reactionPulse, {
        toValue: 0,
        duration: 520,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [reactionId, reactionKind, reducedMotion, reactionPulse]);

  // Breath amplitude scales with bloom and turbulence.
  const coreScale = breath.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.035 + effectiveMorph.bloom * 0.02] });
  const haloScale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, visual.haloScale] });
  const haloOpacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.32, 0.72] });
  const arrivalScale = settle.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });
  const arrivalOpacity = settle.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
  const reactionScale = reactionPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const reactionOpacity = reactionPulse.interpolate({ inputRange: [0, 1], outputRange: [0, 0.3] });

  const orb = (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.frame,
        {
          width: size,
          height: size,
          opacity: arrivalOpacity,
          transform: [
            { scale: Animated.multiply(arrivalScale, reactionScale) },
            { rotate: `${visual.tilt}deg` },
          ],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.halo,
          {
            backgroundColor: visual.glow,
            opacity: Animated.add(haloOpacity, reactionOpacity),
            transform: [{ scale: Animated.multiply(haloScale, reactionScale) }],
          },
        ]}
      />
      <Animated.View style={{ transform: [{ scale: coreScale }] }}>
        <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden>
          <Defs>
            <RadialGradient id={gradientId} cx="34%" cy="28%" rx="66%" ry="70%">
              <Stop offset="0" stopColor="#F3FCF5" stopOpacity={0.94} />
              <Stop offset="0.24" stopColor={visual.core} stopOpacity={0.96} />
              <Stop offset="0.7" stopColor={visual.edge} stopOpacity={0.96} />
              <Stop offset="1" stopColor={P.ink} stopOpacity={0.94} />
            </RadialGradient>
          </Defs>
          <Circle cx="50" cy="50" r={37 - effectiveMorph.pinch * 6} fill={`url(#${gradientId})`} />
          <Circle cx="50" cy="50" r="39.5" fill="none" stroke={visual.edge} strokeOpacity="0.38" strokeWidth="0.8" />
          <Circle cx="38" cy="35" r={10 - effectiveMorph.pinch * 2} fill="#FFFFFF" fillOpacity={0.11 + effectiveMorph.brightness * 0.05} />
        </Svg>
      </Animated.View>
      <View style={[styles.satellite, styles.satelliteOne, { backgroundColor: visual.core }]} />
      {effectiveMorph.blobCount >= 3 ||
      effectivePosture === 'adapting' ||
      effectivePosture === 'completed' ||
      tier !== 'inline' ? (
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

function resolveDefaultMorph(posture: MiraPosture): MorphParams {
  return postureMorph(posture, 0);
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
