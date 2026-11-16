import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { COLORS } from '@/constants/designSystem';
import type { FieldBand } from '@/domain/patterns';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  hexToRgb,
  rgbToHex,
  lerpFieldState,
  isFieldSettled,
  tintedAccent,
  type FieldVisual,
} from '@/utils/fieldColor';
import type { FieldQuality } from '@/domain/patterns/fieldState';
import type { CircadianCharacter } from '@/domain/atmosphere';

/** Band type lives in the domain (fieldState) — single source of truth. */
export type MetabolicBand = FieldBand;

/** Exponential approach per frame — the field melts to its new state in ~1.2s. */
const SETTLE_STEP = 0.06;

/**
 * Live signal channel — a measured reading rendered into the field's
 * motion. pulseBpm becomes a heartbeat shimmer (thump-and-decay, not a
 * sine wobble); breathPerMin a slow amplitude swell. `gain` scales both:
 * 1 while measuring, ~0.35 as the post-check-in imprint. This is the
 * embodiment seam (docs/EMBODIED_FIELD_PLAN.md Phase A).
 */
export interface FieldSignal {
  pulseBpm?: number;
  breathPerMin?: number;
  gain?: number;
}

/**
 * Wave texture per quality — continuous parameters so states melt into
 * each other through the same Settle as color (waveK = spatial
 * frequency, jitter = high-frequency roughness, alphaMul = line
 * brightness). steady is the baseline; charged is tighter and rougher;
 * settling is broader and calmer; depleted/unknown recede.
 */
interface FieldTexture {
  waveK: number;
  jitter: number;
  alphaMul: number;
}

const QUALITY_TEXTURE: Record<FieldQuality, FieldTexture> = {
  steady: { waveK: 0.45, jitter: 0.1, alphaMul: 1.0 },
  charged: { waveK: 0.62, jitter: 0.34, alphaMul: 1.08 },
  settling: { waveK: 0.3, jitter: 0.05, alphaMul: 0.9 },
  depleted: { waveK: 0.35, jitter: 0.04, alphaMul: 0.7 },
  unknown: { waveK: 0.4, jitter: 0.06, alphaMul: 0.7 },
};

type Props = {
  band?: MetabolicBand;
  /** 0–1 intensity of wave motion */
  intensity?: number;
  /** Drift-speed multiplier — the semantic tempo channel. */
  tempo?: number;
  /** Live vitals rendered into the field's motion. */
  signal?: FieldSignal;
  /** Semantic weather — selects the wave texture. */
  quality?: FieldQuality;
  /** Time-of-day character — lightness, tempo and warmth shift. */
  circadian?: CircadianCharacter;
};

function bandAccent(band: MetabolicBand): string {
  switch (band) {
    case 'high':
      return COLORS.PROGRAMME.warn;
    case 'low':
      return COLORS.PROGRAMME.cool;
    case 'in_range':
      return COLORS.PROGRAMME.accent;
    default:
      return COLORS.PROGRAMME.accent;
  }
}

/**
 * Living metabolic field — continuous atmosphere, not decoration.
 * Web: canvas wave grid. Native: soft SVG undulation.
 */
export function MetabolicField({
  band = 'unknown',
  intensity = 0.55,
  tempo = 1,
  signal,
  quality = 'unknown',
  circadian,
}: Props) {
  if (Platform.OS === 'web') {
    return <MetabolicFieldWeb band={band} intensity={intensity} tempo={tempo} signal={signal} quality={quality} circadian={circadian} />;
  }
  return <MetabolicFieldNative band={band} intensity={intensity} tempo={tempo} signal={signal} quality={quality} circadian={circadian} />;
}

function MetabolicFieldNative({ band, intensity, tempo, signal, circadian }: Required<Pick<Props, 'band' | 'intensity' | 'tempo'>> & Pick<Props, 'signal' | 'quality' | 'circadian'>) {
  const reducedMotion = useReducedMotion();
  const target = useMemo<FieldVisual>(
    () => ({
      rgb: tintedAccent(hexToRgb(bandAccent(band)), circadian),
      intensity: intensity * (circadian?.activity ?? 1),
      tempo: tempo * (circadian?.tempo ?? 1),
    }),
    [band, intensity, tempo, circadian],
  );
  const [current, setCurrent] = useState<FieldVisual>(target);
  const currentRef = useRef(current);
  currentRef.current = current;

  // The Settle: interpolate toward the new state — never a hard cut.
  useEffect(() => {
    if (reducedMotion) {
      currentRef.current = target;
      setCurrent(target);
      return;
    }
    let raf = 0;
    const step = () => {
      const next = lerpFieldState(currentRef.current, target, SETTLE_STEP);
      if (isFieldSettled(next, target)) {
        currentRef.current = target;
        setCurrent(target);
        return;
      }
      currentRef.current = next;
      setCurrent(next);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, reducedMotion]);

  const accent = rgbToHex(current.rgb);
  const phase = useRef(new Animated.Value(0)).current;
  const pulsePhase = useRef(new Animated.Value(0)).current;
  const breathPhase = useRef(new Animated.Value(0)).current;
  const { width, height } = useWindowDimensions();
  // Quantized so the drift loop restarts at most a few times per transition.
  const loopIntensity = Math.round(current.intensity * 10) / 10;
  const loopTempo = Math.round(current.tempo * 10) / 10;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(phase, {
        toValue: 1,
        duration: 9000 / (Math.max(0.35, loopIntensity) * Math.max(0.3, loopTempo)),
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [loopIntensity, loopTempo, phase]);

  // Signal loops — heartbeat shimmer + breath swell, shaped as
  // attack/decay sequences (a loop that goes there and back, not a
  // sawtooth restart). Primitive deps so a new signal object identity
  // doesn't restart the loops each render.
  const sigPulse = signal?.pulseBpm;
  const sigBreath = signal?.breathPerMin;
  const sigGain = signal?.gain ?? 1;
  useEffect(() => {
    if (reducedMotion || (!sigPulse && !sigBreath)) return;
    const loops: Animated.CompositeAnimation[] = [];
    const gain = sigGain;
    if (sigPulse && gain > 0) {
      const period = 60000 / sigPulse;
      loops.push(
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulsePhase, { toValue: 1, duration: period * 0.28, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(pulsePhase, { toValue: 0, duration: period * 0.72, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          ]),
        ),
      );
    }
    if (sigBreath && gain > 0) {
      const period = 60000 / sigBreath;
      loops.push(
        Animated.loop(
          Animated.sequence([
            Animated.timing(breathPhase, { toValue: 1, duration: period / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(breathPhase, { toValue: 0, duration: period / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ]),
        ),
      );
    }
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [sigPulse, sigBreath, sigGain, reducedMotion, pulsePhase, breathPhase]);

  const drift = phase.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -24],
  });
  const gain = signal?.gain ?? 1;
  const pulseOpacity = pulsePhase.interpolate({
    inputRange: [0, 1],
    outputRange: [1 - 0.12 * gain, 1],
  });
  const breathY = breathPhase.interpolate({
    inputRange: [0, 1],
    outputRange: [-4 * gain, 4 * gain],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.PROGRAMME.ink }]} />
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { opacity: signal ? pulseOpacity : 1, transform: [{ translateY: Animated.add(drift, breathY) }] },
        ]}
      >
        <Svg width={width} height={height * 1.15}>
          <Defs>
            <LinearGradient id="fieldFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={accent} stopOpacity="0.22" />
              <Stop offset="0.55" stopColor={accent} stopOpacity="0.06" />
              <Stop offset="1" stopColor={COLORS.PROGRAMME.ink} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Path
            d={`M0,${height * 0.18} C${width * 0.2},${height * 0.08} ${width * 0.4},${height * 0.28} ${width * 0.55},${height * 0.16} C${width * 0.75},${height * 0.04} ${width * 0.9},${height * 0.22} ${width},${height * 0.12} L${width},0 L0,0 Z`}
            fill="url(#fieldFade)"
          />
          <Path
            d={`M0,${height * 0.36} C${width * 0.22},${height * 0.26} ${width * 0.42},${height * 0.44} ${width * 0.6},${height * 0.32} C${width * 0.78},${height * 0.2} ${width * 0.9},${height * 0.4} ${width},${height * 0.3} L${width},${height * 0.1} L0,${height * 0.1} Z`}
            fill={accent}
            opacity={0.08}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

function MetabolicFieldWeb({ band, intensity, tempo, signal, quality = 'unknown', circadian }: Required<Pick<Props, 'band' | 'intensity' | 'tempo'>> & Pick<Props, 'signal' | 'quality' | 'circadian'>) {
  const hostRef = useRef<View>(null);
  const { width, height } = useWindowDimensions();
  const targetRef = useRef<FieldVisual>({ rgb: tintedAccent(hexToRgb(bandAccent(band)), circadian), intensity: intensity * (circadian?.activity ?? 1), tempo: tempo * (circadian?.tempo ?? 1) });
  const signalRef = useRef<FieldSignal | undefined>(signal);
  const texTargetRef = useRef<FieldTexture>(QUALITY_TEXTURE[quality]);
  const [snapTick, bumpSnapTick] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    targetRef.current = {
      rgb: tintedAccent(hexToRgb(bandAccent(band)), circadian),
      intensity: intensity * (circadian?.activity ?? 1),
      tempo: tempo * (circadian?.tempo ?? 1),
    };
    const rm =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (rm) bumpSnapTick(); // Reduced motion: one repaint snapped to the new state
  }, [band, intensity, tempo, circadian]);

  // Signal and texture flow through refs — per-frame reads in the draw
  // loop, no canvas rebuild as readings or quality change.
  useEffect(() => {
    signalRef.current = signal;
  }, [signal]);
  useEffect(() => {
    texTargetRef.current = QUALITY_TEXTURE[quality];
  }, [quality]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const host = hostRef.current as unknown as HTMLElement | null;
    if (!host) return;

    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    Object.assign(canvas.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
    });
    host.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let t = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Current visual state — lerps toward target each frame (the Settle).
    const current: FieldVisual = {
      rgb: { ...targetRef.current.rgb },
      intensity: targetRef.current.intensity,
      tempo: targetRef.current.tempo,
    };

    // Texture — lerps toward the quality's target alongside FieldVisual,
    // so semantic states melt rather than cut.
    const tex: FieldTexture = { ...texTargetRef.current };

    // Live-signal phases — accumulated from real frame deltas so the
    // heartbeat and breath ride at the measured rates.
    let pulsePhase = 0;
    let breathPhase = 0;
    let lastTs = performance.now();

    const resize = () => {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const draw = () => {
      const target = targetRef.current;
      if (reducedMotion) {
        current.rgb = { ...target.rgb };
        current.intensity = target.intensity;
        current.tempo = target.tempo;
      } else {
        const next = lerpFieldState(current, target, SETTLE_STEP);
        current.rgb = next.rgb;
        current.intensity = next.intensity;
        current.tempo = next.tempo;
      }
      const texT = texTargetRef.current;
      tex.waveK += (texT.waveK - tex.waveK) * SETTLE_STEP;
      tex.jitter += (texT.jitter - tex.jitter) * SETTLE_STEP;
      tex.alphaMul += (texT.alphaMul - tex.alphaMul) * SETTLE_STEP;
      const accent = rgbToHex(current.rgb);

      const now = performance.now();
      const dtSec = Math.min(0.1, (now - lastTs) / 1000);
      lastTs = now;

      // Signal modulations — heartbeat shimmer (sharpened attack, slow
      // decay) and breath swell, scaled by gain.
      const sig = signalRef.current;
      const gain = sig?.gain ?? 1;
      let beat = 0;
      let breath = 0;
      if (sig && !reducedMotion && gain > 0) {
        if (sig.pulseBpm) {
          pulsePhase += dtSec * (sig.pulseBpm / 60);
          beat = Math.pow(0.5 + 0.5 * Math.sin(pulsePhase * Math.PI * 2), 3) * gain;
        }
        if (sig.breathPerMin) {
          breathPhase += dtSec * (sig.breathPerMin / 60);
          breath = Math.sin(breathPhase * Math.PI * 2) * gain;
        }
      }

      t += reducedMotion ? 0 : 0.008 * (0.4 + current.intensity) * current.tempo;
      ctx.fillStyle = COLORS.PROGRAMME.ink;
      ctx.fillRect(0, 0, width, height);

      const cols = 28;
      const rows = 16;
      const amp = (10 + current.intensity * 18) * (1 + 0.22 * breath + 0.06 * beat);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;

      for (let r = 0; r < rows; r++) {
        const yBase = (height / Math.max(rows - 1, 1)) * r;
        ctx.globalAlpha = (0.04 + (1 - r / rows) * 0.14) * tex.alphaMul + beat * 0.1;
        ctx.beginPath();
        for (let c = 0; c < cols; c++) {
          const x = (width / Math.max(cols - 1, 1)) * c;
          const y =
            yBase +
            Math.sin(c * tex.waveK + t * 2 + r * 0.35) * amp * (0.4 + r / rows) +
            Math.cos(c * 0.2 - t + r) * amp * 0.35 +
            Math.sin(c * 1.4 - t * 4 + r * 1.7) * amp * tex.jitter;
          if (c === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, 'rgba(11, 18, 16, 0.12)');
      grad.addColorStop(0.5, 'rgba(11, 18, 16, 0.4)');
      grad.addColorStop(1, 'rgba(11, 18, 16, 0.88)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      if (!reducedMotion) raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      canvas.remove();
    };
  }, [height, width, snapTick]);

  return <View ref={hostRef} style={StyleSheet.absoluteFill} pointerEvents="none" />;
}
