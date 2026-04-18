/**
 * useReducedMotion — Respects system accessibility preference for reduced motion.
 * Components should check `prefersReducedMotion` before running non-essential animations.
 */
import { useState, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setPrefersReducedMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setPrefersReducedMotion);
    return () => sub.remove();
  }, []);

  return prefersReducedMotion;
}
