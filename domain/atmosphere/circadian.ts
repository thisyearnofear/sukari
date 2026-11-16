/**
 * Circadian field character — the app has a body clock.
 *
 * Metabolic care is inherently temporal (fasting mornings, post-meal
 * windows, evening patterns), so the field's palette and activity follow
 * the patient's day rather than a fixed look. Four day-parts:
 *
 *   night   22–6   nearly asleep — dim, slow, cool
 *   dawn    6–10   pale, quiet, waking
 *   day     10–17  clear — full character
 *   evening 17–22  warm dim, winding down
 *
 * `hour` is injectable for tests. Design authority:
 * docs/INTERFACE_DIFFERENTIATION.md (move 4).
 */

export interface CircadianCharacter {
  /** Accent lightness multiplier — 0.55 (night) → 1.0 (day). */
  lightness: number;
  /** Drift-speed multiplier layered on semantic tempo. */
  tempo: number;
  /** Wave-intensity multiplier — the field's rest/activity level. */
  activity: number;
  /** Warmth shift applied to the accent (−1 cool … +1 warm). */
  warm: number;
}

export type DayPart = 'night' | 'dawn' | 'day' | 'evening';

export function dayPartForHour(hour: number): DayPart {
  if (hour >= 22 || hour < 6) return 'night';
  if (hour < 10) return 'dawn';
  if (hour < 17) return 'day';
  return 'evening';
}

const CHARACTER: Record<DayPart, CircadianCharacter> = {
  night: { lightness: 0.55, tempo: 0.6, activity: 0.7, warm: -0.3 },
  dawn: { lightness: 0.8, tempo: 0.85, activity: 0.9, warm: -0.1 },
  day: { lightness: 1.0, tempo: 1.0, activity: 1.0, warm: 0 },
  evening: { lightness: 0.8, tempo: 0.8, activity: 0.85, warm: 0.5 },
};

export function circadianFieldCharacter(hour: number): CircadianCharacter {
  return CHARACTER[dayPartForHour(((hour % 24) + 24) % 24)];
}
