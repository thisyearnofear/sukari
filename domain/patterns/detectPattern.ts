/**
 * Deterministic pattern detector + experiment framing.
 * LLM may explain; this layer chooses the bounded intervention.
 */

import type { SignalSnapshot } from '@/domain/signals/snapshot';
import type { GlucoseReading } from '@/types/health';
import type { MetabolicPattern } from './types';
import { MAYA_DEMO, getMayaDay } from '@/domain/demo/mayaPatient';

const SAFETY =
  'Habits and lifestyle experiments only — never insulin, medication dosing, or diagnosis.';

function coverageFromReadings(count: number): number {
  if (count >= 48) return 0.85;
  if (count >= 24) return 0.65;
  if (count >= 8) return 0.4;
  return 0.2;
}

/** Heuristic evening-window excursion from CGM readings (last ~3 days). */
export function detectPatternFromReadings(
  readings: GlucoseReading[],
  snapshot?: SignalSnapshot | null,
): MetabolicPattern | null {
  if (!readings.length) return null;

  const latestTs = Math.max(...readings.map((r) => r.timestamp));
  const windowMs = 3 * 24 * 60 * 60 * 1000;
  const recent = readings.filter((r) => latestTs - r.timestamp <= windowMs);
  if (recent.length < 6) return null;

  const evening = recent.filter((r) => {
    const h = new Date(r.timestamp).getUTCHours();
    return h >= 19 && h <= 21;
  });
  const daytime = recent.filter((r) => {
    const h = new Date(r.timestamp).getUTCHours();
    return h >= 10 && h <= 16;
  });

  if (evening.length < 3) return null;

  const avg = (arr: GlucoseReading[]) =>
    arr.reduce((s, r) => s + r.value, 0) / arr.length;
  const eveningAvg = avg(evening);
  const dayAvg = daytime.length ? avg(daytime) : eveningAvg - 10;

  if (eveningAvg <= dayAvg + 15 && snapshot?.minimized.band !== 'high') {
    return null;
  }

  const coverage = coverageFromReadings(recent.length);
  return {
    id: `pattern-evening-${new Date(latestTs).toISOString().slice(0, 10)}`,
    kind: 'evening_excursion',
    headline:
      'Your glucose response is most elevated between 7:00 and 9:00 PM, especially on lower-activity days.',
    explanation:
      'Across recent evenings, readings in the post-dinner window tended higher than mid-day. This is an observational pattern — not a diagnosis.',
    evidence: [
      {
        label: 'Evening window',
        detail: `Avg ~${Math.round(eveningAvg)} mg/dL (7–9 PM, last 3 days)`,
      },
      {
        label: 'Mid-day comparison',
        detail: daytime.length
          ? `Avg ~${Math.round(dayAvg)} mg/dL (10 AM–4 PM)`
          : 'Limited mid-day coverage',
      },
      {
        label: 'Data coverage',
        detail: `${recent.length} readings in the last 72 hours of series`,
      },
    ],
    dataCoverage: coverage,
    whySeeingThis:
      'We compare time-of-day averages from your connected CGM when enough readings exist. Coverage below ~50% means treat this as a provisional signal.',
    safetyBoundary: SAFETY,
    suggestedBehaviour: 'post_meal_walk',
    suggestedExperiment:
      'Take a 10-minute walk within 30 minutes after dinner on three evenings this week.',
    whyThisExperiment:
      'A short post-meal walk is a low-risk habit that programmes often use when evening excursions recur. You can make it easier or swap it if it is not practical.',
    source: 'cgm',
    detectedAt: latestTs,
  };
}

/** Fallback when CGM sparse — still produces one actionable experiment. */
export function detectPatternFromSnapshot(
  snapshot: SignalSnapshot | null | undefined,
): MetabolicPattern {
  const now = Date.now();
  if (!snapshot || !snapshot.connected) {
    return {
      id: `pattern-default-${new Date().toISOString().slice(0, 10)}`,
      kind: 'insufficient_data',
      headline: 'No continuous signal yet — starting with one high-leverage evening habit.',
      explanation:
        'Without CGM coverage we cannot personalize from biomarker patterns. The programme still assigns one achievable experiment so adherence can start today.',
      evidence: [
        { label: 'Signal', detail: 'CGM not connected' },
        { label: 'Approach', detail: 'Programme default based on common metabolic friction points' },
      ],
      dataCoverage: 0.15,
      whySeeingThis:
        'Connect Dexcom or Apple Health to turn this into a pattern-backed mission. Until then, defaults keep the loop moving.',
      safetyBoundary: SAFETY,
      suggestedBehaviour: 'post_meal_walk',
      suggestedExperiment:
        'Take a 10-minute walk within 30 minutes after your largest meal today.',
      whyThisExperiment:
        'Post-meal movement is practical, reversible, and easy to measure once signals are connected.',
      source: 'rules',
      detectedAt: now,
    };
  }

  if (snapshot.minimized.band === 'high' || snapshot.trend === 'rising') {
    return {
      id: `pattern-rise-${new Date().toISOString().slice(0, 10)}`,
      kind: 'post_meal_rise',
      headline: 'Recent readings trend higher — a protein-first meal structure is a useful experiment.',
      explanation:
        'Your latest signal band suggests elevated or rising glucose. We recommend one meal-structure habit, not a medication change.',
      evidence: [
        {
          label: 'Latest band',
          detail: snapshot.minimized.band.replace('_', ' '),
        },
        {
          label: 'Trend',
          detail: snapshot.trend || 'unknown',
        },
        {
          label: 'Coverage',
          detail: `${snapshot.readingCount} readings in snapshot`,
        },
      ],
      dataCoverage: coverageFromReadings(snapshot.readingCount),
      whySeeingThis:
        'Mission selection uses coarse bands and trends from your connected device — not a clinical forecast.',
      safetyBoundary: SAFETY,
      suggestedBehaviour: 'protein_first',
      suggestedExperiment: 'Eat protein before carbs at your next main meal.',
      whyThisExperiment:
        'Protein-first ordering is a rehearsable decision that many programmes use when readings trend high.',
      source: 'cgm',
      detectedAt: now,
    };
  }

  return {
    id: `pattern-stable-${new Date().toISOString().slice(0, 10)}`,
    kind: 'stable_baseline',
    headline: 'Signals look relatively steady — protect the evening with one light habit.',
    explanation:
      'When the day is stable, the programme still assigns one small action so adherence does not depend on crisis motivation.',
    evidence: [
      { label: 'Band', detail: snapshot.minimized.band.replace('_', ' ') },
      { label: 'Trend', detail: snapshot.trend || 'stable' },
    ],
    dataCoverage: coverageFromReadings(snapshot.readingCount),
    whySeeingThis: 'Stable periods are when habit systems usually decay — one mission keeps the loop alive.',
    safetyBoundary: SAFETY,
    suggestedBehaviour: 'steady_evening',
    suggestedExperiment:
      'Keep evening snacks light and finish eating at least 2 hours before bed.',
    whyThisExperiment:
      'Protecting a calm evening is a durable habit when daytime control is already reasonable.',
    source: 'cgm',
    detectedAt: now,
  };
}

export function resolvePattern(input: {
  readings?: GlucoseReading[];
  snapshot?: SignalSnapshot | null;
  useDemo?: boolean;
  demoDayIndex?: number;
}): MetabolicPattern {
  if (input.useDemo) {
    return getMayaDay(input.demoDayIndex ?? MAYA_DEMO.defaultDayIndex).pattern;
  }
  const fromReadings = input.readings?.length
    ? detectPatternFromReadings(input.readings, input.snapshot)
    : null;
  return fromReadings || detectPatternFromSnapshot(input.snapshot);
}
