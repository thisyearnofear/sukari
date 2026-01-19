/**
 * ANIMATION UTILITIES - Reusable animation builders
 * 
 * Consolidates all animation logic into configurable builders
 * Reduces duplication and makes animations easy to tune
 * 
 * Usage:
 * ```
 * const pulseAnim = useRef(new Animated.Value(1)).current;
 * const pulse = createPulseAnimation(pulseAnim, { duration: 1000 });
 * ```
 */

import { Animated, Easing } from 'react-native';
import { ANIMATIONS } from '@/constants/designSystem';

// ============================================
// BASIC ANIMATION BUILDERS
// ============================================

/**
 * Create a pulse/loop animation
 * Used for buttons, emphasis effects
 */
export function createPulseAnimation(
  value: Animated.Value,
  options: { duration?: number; minScale?: number; maxScale?: number } = {},
): Animated.CompositeAnimation {
  const { duration = ANIMATIONS.DURATION.SLOWER, minScale = 1, maxScale = 1.05 } = options;

  return Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: maxScale,
        duration: duration / 2,
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: minScale,
        duration: duration / 2,
        useNativeDriver: true,
      }),
    ]),
  );
}

/**
 * Create a fade-in animation
 */
export function createFadeInAnimation(
  value: Animated.Value,
  options: { duration?: number; delay?: number } = {},
): Animated.CompositeAnimation {
  const { duration = ANIMATIONS.DURATION.BASE, delay = 0 } = options;

  return Animated.sequence([
    Animated.delay(delay),
    Animated.timing(value, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }),
  ]);
}

/**
 * Create a fade-out animation
 */
export function createFadeOutAnimation(
  value: Animated.Value,
  options: { duration?: number; delay?: number } = {},
): Animated.CompositeAnimation {
  const { duration = ANIMATIONS.DURATION.BASE, delay = 0 } = options;

  return Animated.sequence([
    Animated.delay(delay),
    Animated.timing(value, {
      toValue: 0,
      duration,
      useNativeDriver: true,
    }),
  ]);
}

/**
 * Create a scale-in animation
 */
export function createScaleInAnimation(
  value: Animated.Value,
  options: { duration?: number; startScale?: number; endScale?: number } = {},
): Animated.CompositeAnimation {
  const { duration = ANIMATIONS.DURATION.BASE, startScale = 0.5, endScale = 1 } = options;

  value.setValue(startScale);

  return Animated.timing(value, {
    toValue: endScale,
    duration,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  });
}

/**
 * Create a scale-out animation
 */
export function createScaleOutAnimation(
  value: Animated.Value,
  options: { duration?: number; startScale?: number; endScale?: number } = {},
): Animated.CompositeAnimation {
  const { duration = ANIMATIONS.DURATION.FAST, startScale = 1, endScale = 0 } = options;

  value.setValue(startScale);

  return Animated.timing(value, {
    toValue: endScale,
    duration,
    easing: Easing.in(Easing.cubic),
    useNativeDriver: true,
  });
}

/**
 * Create a slide-up animation
 */
export function createSlideUpAnimation(
  value: Animated.Value,
  options: { duration?: number; distance?: number } = {},
): Animated.CompositeAnimation {
  const { duration = ANIMATIONS.DURATION.BASE, distance = 100 } = options;

  value.setValue(distance);

  return Animated.timing(value, {
    toValue: 0,
    duration,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  });
}

/**
 * Create a slide-down animation
 */
export function createSlideDownAnimation(
  value: Animated.Value,
  options: { duration?: number; distance?: number } = {},
): Animated.CompositeAnimation {
  const { duration = ANIMATIONS.DURATION.BASE, distance = 100 } = options;

  value.setValue(0);

  return Animated.timing(value, {
    toValue: distance,
    duration,
    easing: Easing.in(Easing.cubic),
    useNativeDriver: true,
  });
}

// ============================================
// COMPLEX ANIMATION BUILDERS
// ============================================

/**
 * Create a glow/brightness animation (looping)
 * Used for special effects, notifications
 */
export function createGlowAnimation(
  value: Animated.Value,
  options: { duration?: number; minOpacity?: number; maxOpacity?: number } = {},
): Animated.CompositeAnimation {
  const { duration = ANIMATIONS.DURATION.SLOWEST, minOpacity = 0, maxOpacity = 1 } = options;

  return Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: maxOpacity,
        duration: duration / 2,
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: minOpacity,
        duration: duration / 2,
        useNativeDriver: true,
      }),
    ]),
  );
}

/**
 * Create a combo burst animation
 * Particle expansion with opacity fade
 */
export function createComboBurstAnimation(
  scaleValue: Animated.Value,
  opacityValue: Animated.Value,
  options: { duration?: number } = {},
): void {
  const { duration = ANIMATIONS.DURATION.SLOWEST } = options;

  scaleValue.setValue(0.5);
  opacityValue.setValue(0);

  Animated.parallel([
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.5,
        duration: duration * 0.3,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 2,
        duration: duration * 0.7,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]),
    Animated.sequence([
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: duration * 0.2,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 0.5,
        duration: duration * 0.3,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 0,
        duration: duration * 0.5,
        useNativeDriver: true,
      }),
    ]),
  ]).start();
}

/**
 * Create a floating animation (vertical movement)
 * Used for background elements, food items
 */
export function createFloatingAnimation(
  value: Animated.Value,
  options: {
    duration?: number;
    distance?: number;
    delay?: number;
    startOpacity?: number;
    endOpacity?: number;
  } = {},
): Animated.CompositeAnimation {
  const {
    duration = 8000,
    distance = 600,
    delay = 0,
    startOpacity = 0,
    endOpacity = 0,
  } = options;

  return Animated.sequence([
    Animated.delay(delay),
    Animated.parallel([
      Animated.timing(value, {
        toValue: distance,
        duration,
        useNativeDriver: true,
      }),
    ]),
  ]);
}

/**
 * Create a wobble/shake animation
 * Used for warnings, errors
 */
export function createWobbleAnimation(
  value: Animated.Value,
  options: { duration?: number; intensity?: number } = {},
): Animated.CompositeAnimation {
  const { duration = ANIMATIONS.DURATION.BASE, intensity = 10 } = options;

  return Animated.sequence([
    Animated.timing(value, {
      toValue: intensity,
      duration: duration / 4,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: -intensity,
      duration: duration / 4,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: intensity,
      duration: duration / 4,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 0,
      duration: duration / 4,
      useNativeDriver: true,
    }),
  ]);
}

// ============================================
// PARTICLE & EFFECT BUILDERS
// ============================================

/**
 * Calculate particle trajectory for burst effects
 */
export function calculateParticleTrajectory(
  angle: number,
  distance: number,
): { x: number; y: number } {
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
  };
}

/**
 * Create particle opacity animation
 */
export function createParticleOpacityAnimation(
  value: Animated.Value,
  options: { duration?: number } = {},
): void {
  const { duration = ANIMATIONS.DURATION.SLOWEST } = options;

  Animated.sequence([
    Animated.timing(value, {
      toValue: 1,
      duration: duration * 0.3,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 0.5,
      duration: duration * 0.4,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 0,
      duration: duration * 0.3,
      useNativeDriver: true,
    }),
  ]).start();
}

// ============================================
// SCREEN TRANSITION BUILDERS
// ============================================

/**
 * Create screen fade transition
 */
export function createScreenFadeTransition(
  value: Animated.Value,
  direction: 'in' | 'out' = 'in',
  options: { duration?: number } = {},
): Animated.CompositeAnimation {
  const { duration = ANIMATIONS.DURATION.BASE } = options;

  if (direction === 'in') {
    return createFadeInAnimation(value, { duration });
  } else {
    return createFadeOutAnimation(value, { duration });
  }
}

/**
 * Create screen slide transition
 */
export function createScreenSlideTransition(
  value: Animated.Value,
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
  options: { duration?: number } = {},
): Animated.CompositeAnimation {
  const { duration = ANIMATIONS.DURATION.BASE } = options;

  switch (direction) {
    case 'up':
      return createSlideUpAnimation(value, { duration });
    case 'down':
      return createSlideDownAnimation(value, { duration });
    default:
      return createFadeInAnimation(value, { duration });
  }
}

// ============================================
// INTERPOLATION HELPERS
// ============================================

/**
 * Create interpolation function for color transitions
 */
export function createColorInterpolation(
  value: Animated.Value,
  colors: string[],
): any {
  return value.interpolate({
    inputRange: Array.from({ length: colors.length }, (_, i) =>
      (i / (colors.length - 1)),
    ),
    outputRange: colors,
  });
}

/**
 * Create scale interpolation
 */
export function createScaleInterpolation(
  value: Animated.Value,
  options: { minScale?: number; maxScale?: number } = {},
): any {
  const { minScale = 1, maxScale = 1.5 } = options;

  return value.interpolate({
    inputRange: [0, 1],
    outputRange: [minScale, maxScale],
  });
}

/**
 * Stop all animations on a value
 */
export function stopAnimation(value: Animated.Value): void {
  value.stopAnimation();
}

/**
 * Reset animated value to initial state
 */
export function resetAnimatedValue(value: Animated.Value, initialValue: number): void {
  value.setValue(initialValue);
}
