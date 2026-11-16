/**
 * Field state — binds the live metabolic pattern to the ambient field.
 * The home field is an instrument, not wallpaper: band = direction of
 * stress, intensity = how agitated the field feels, tempo = drift speed,
 * quality = the semantic weather-word the state reads as.
 * Design authority: docs/PRODUCT_DESIGN.md §5 (one world) and §7 (motion
 * semantics); docs/EMBODIED_FIELD_PLAN.md Phase C.
 */

import type { MetabolicPattern, PatternKind } from './types';

export type FieldBand = 'low' | 'in_range' | 'high' | 'unknown';

/** Semantic weather-vocabulary for the field — the first-pass states
    from the differentiation doc (steady / charged / depleted / settling). */
export type FieldQuality = 'steady' | 'charged' | 'depleted' | 'settling' | 'unknown';

export interface FieldState {
  band: FieldBand;
  /** 0–1 wave intensity for MetabolicField */
  intensity: number;
  /** Drift-speed multiplier — semantic tempo channel. */
  tempo: number;
  quality: FieldQuality;
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

const TEMPO_STEADY = 1.0;
const TEMPO_CHARGED = 1.5;
const TEMPO_SETTLING = 0.75;
const TEMPO_UNKNOWN = 0.9;

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
    return { band: 'in_range', intensity: SETTLED_INTENSITY, tempo: TEMPO_SETTLING, quality: 'settling' };
  }

  if (!pattern || pattern.kind === 'insufficient_data') {
    return { band: 'unknown', intensity: CALM_INTENSITY, tempo: TEMPO_UNKNOWN, quality: 'unknown' };
  }

  if (pattern.kind === 'stable_baseline') {
    return {
      band: 'in_range',
      intensity: opts.deferred ? 0.5 : SETTLED_INTENSITY,
      tempo: opts.deferred ? 1.15 : TEMPO_STEADY,
      quality: 'steady',
    };
  }

  if (STRESSED_KINDS.has(pattern.kind)) {
    // Activity stress is real but milder than a glucose excursion.
    const base = pattern.kind === 'low_activity_days' ? 0.45 : 0.55;
    let intensity = base + pattern.dataCoverage * 0.3;
    if (opts.deferred) intensity += 0.1;
    return {
      band: 'high',
      intensity: Math.min(MAX_INTENSITY, Number(intensity.toFixed(2))),
      tempo: TEMPO_CHARGED,
      quality: 'charged',
    };
  }

  return { band: 'unknown', intensity: CALM_INTENSITY, tempo: TEMPO_UNKNOWN, quality: 'unknown' };
}
