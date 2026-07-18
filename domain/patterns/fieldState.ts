/**
 * Field state — binds the live metabolic pattern to the ambient field.
 * The home field is an instrument, not wallpaper: band = direction of
 * stress, intensity = how agitated the field feels.
 * Design authority: docs/PRODUCT_DESIGN.md §5 (one world) and §7 (motion semantics).
 */

import type { MetabolicPattern, PatternKind } from './types';

export type FieldBand = 'low' | 'in_range' | 'high' | 'unknown';

export interface FieldState {
  band: FieldBand;
  /** 0–1 wave intensity for MetabolicField */
  intensity: number;
}

/** Pattern kinds that read as a stressed (amber) field. */
const STRESSED_KINDS: ReadonlySet<PatternKind> = new Set([
  'evening_excursion',
  'post_meal_rise',
  'liquid_sugar_suspect',
  'low_activity_days',
]);

const SETTLED_INTENSITY = 0.4;
const CALM_INTENSITY = 0.35;
const MAX_INTENSITY = 0.85;

export interface FieldStateOpts {
  /** Settled field is the reward for acting — never alarm after completion. */
  missionCompleted?: boolean;
  /** "Waiting on you today" — gentle urgency, same band. */
  deferred?: boolean;
}

export function fieldStateFromPattern(
  pattern: MetabolicPattern | null | undefined,
  opts: FieldStateOpts = {},
): FieldState {
  if (opts.missionCompleted) {
    return { band: 'in_range', intensity: SETTLED_INTENSITY };
  }

  if (!pattern || pattern.kind === 'insufficient_data') {
    return { band: 'unknown', intensity: CALM_INTENSITY };
  }

  if (pattern.kind === 'stable_baseline') {
    return { band: 'in_range', intensity: opts.deferred ? 0.5 : SETTLED_INTENSITY };
  }

  if (STRESSED_KINDS.has(pattern.kind)) {
    // Activity stress is real but milder than a glucose excursion.
    const base = pattern.kind === 'low_activity_days' ? 0.45 : 0.55;
    let intensity = base + pattern.dataCoverage * 0.3;
    if (opts.deferred) intensity += 0.1;
    return { band: 'high', intensity: Math.min(MAX_INTENSITY, Number(intensity.toFixed(2))) };
  }

  return { band: 'unknown', intensity: CALM_INTENSITY };
}
