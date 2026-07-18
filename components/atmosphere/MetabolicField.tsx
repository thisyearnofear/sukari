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
  type FieldVisual,
} from '@/utils/fieldColor';

/** Band type lives in the domain (fieldState) — single source of truth. */
export type MetabolicBand = FieldBand;

/** Exponential approach per frame — the field melts to its new state in ~1.2s. */
const SETTLE_STEP = 0.06;

type Props = {
  band?: MetabolicBand;
  /** 0–1 intensity of wave motion */
  intensity?: number;
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
export function MetabolicField({ band = 'unknown', intensity = 0.55 }: Props) {
  if (Platform.OS === 'web') {
    return <MetabolicFieldWeb band={band} intensity={intensity} />;
  }
  return <MetabolicFieldNative band={band} intensity={intensity} />;
}

function MetabolicFieldNative({ band, intensity }: Required<Props>) {
  const reducedMotion = useReducedMotion();
  const target = useMemo<FieldVisual>(
    () => ({ rgb: hexToRgb(bandAccent(band)), intensity }),
    [band, intensity],
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
  const { width, height } = useWindowDimensions();
  // Quantized so the drift loop restarts at most a few times per transition.
  const loopIntensity = Math.round(current.intensity * 10) / 10;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(phase, {
        toValue: 1,
        duration: 9000 / Math.max(0.35, loopIntensity),
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [loopIntensity, phase]);

  const drift = phase.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -24],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.PROGRAMME.ink }]} />
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: drift }] }]}>
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

function MetabolicFieldWeb({ band, intensity }: Required<Props>) {
  const hostRef = useRef<View>(null);
  const { width, height } = useWindowDimensions();
  const targetRef = useRef<FieldVisual>({ rgb: hexToRgb(bandAccent(band)), intensity });
  const [snapTick, bumpSnapTick] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    targetRef.current = { rgb: hexToRgb(bandAccent(band)), intensity };
    const rm =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (rm) bumpSnapTick(); // Reduced motion: one repaint snapped to the new state
  }, [band, intensity]);

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
    };

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
      } else {
        const next = lerpFieldState(current, target, SETTLE_STEP);
        current.rgb = next.rgb;
        current.intensity = next.intensity;
      }
      const accent = rgbToHex(current.rgb);

      t += reducedMotion ? 0 : 0.008 * (0.4 + current.intensity);
      ctx.fillStyle = COLORS.PROGRAMME.ink;
      ctx.fillRect(0, 0, width, height);

      const cols = 28;
      const rows = 16;
      const amp = 10 + current.intensity * 18;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;

      for (let r = 0; r < rows; r++) {
        const yBase = (height / Math.max(rows - 1, 1)) * r;
        ctx.globalAlpha = 0.04 + (1 - r / rows) * 0.14;
        ctx.beginPath();
        for (let c = 0; c < cols; c++) {
          const x = (width / Math.max(cols - 1, 1)) * c;
          const y =
            yBase +
            Math.sin(c * 0.45 + t * 2 + r * 0.35) * amp * (0.4 + r / rows) +
            Math.cos(c * 0.2 - t + r) * amp * 0.35;
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
