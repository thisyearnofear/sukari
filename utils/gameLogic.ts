import { StabilityZone } from '@/types/game';
import { STABILITY_ZONES } from '@/constants/gameConfig';

/**
 * Single source of truth for stability zone calculation.
 * Supports optional challenge-narrowed balanced range.
 */
export const getStabilityZone = (
  stability: number,
  balancedRange?: { min: number; max: number },
): StabilityZone => {
  const bMin = balancedRange?.min ?? STABILITY_ZONES.BALANCED.min;
  const bMax = balancedRange?.max ?? STABILITY_ZONES.BALANCED.max;

  if (stability >= bMin && stability <= bMax) return 'balanced';
  if (stability >= STABILITY_ZONES.CRITICAL_HIGH.min) return 'critical-high';
  if (stability <= STABILITY_ZONES.CRITICAL_LOW.max) return 'critical-low';
  if (stability > bMax) return 'warning-high';
  return 'warning-low';
};

export const getStabilityColor = (stability: number): string => {
  const zone = getStabilityZone(stability);
  switch (zone) {
    case 'balanced':
      return STABILITY_ZONES.BALANCED.color;
    case 'critical-high':
      return STABILITY_ZONES.CRITICAL_HIGH.color;
    case 'critical-low':
      return STABILITY_ZONES.CRITICAL_LOW.color;
    default:
      return STABILITY_ZONES.WARNING_LOW.color;
  }
};

export const clampStability = (value: number): number => {
  return Math.max(0, Math.min(100, value));
};

export const calculateFinalScore = (
  battlePoints: number,
  stability: number,
  timeInBalanced: number,
  correctSwipes: number,
  incorrectSwipes: number,
  tierDuration?: number,
): { score: number; grade: string } => {
  const stabilityBonus = stability >= 40 && stability <= 60 ? 1.2 : 0.8;
  const timeBonus = 1 + (timeInBalanced / 60) * 0.5;
  const accuracy = correctSwipes + incorrectSwipes > 0 
    ? correctSwipes / (correctSwipes + incorrectSwipes) 
    : 0;
  const accuracyBonus = 1 + accuracy * 0.3;
  
  const score = Math.floor(battlePoints * stabilityBonus * timeBonus * accuracyBonus);

  // Tier-aware grading: scale thresholds by duration relative to 90s baseline
  const scale = (tierDuration ?? 90) / 90;
  
  let grade = 'D';
  if (score >= Math.floor(500 * scale) && accuracy >= 0.9) grade = 'S';
  else if (score >= Math.floor(400 * scale) && accuracy >= 0.8) grade = 'A';
  else if (score >= Math.floor(300 * scale) && accuracy >= 0.7) grade = 'B';
  else if (score >= Math.floor(200 * scale) && accuracy >= 0.6) grade = 'C';
  
  return { score, grade };
};
