/**
 * Synthetic demo patient "Amina" — deterministic 14-day timeline for hackathon demos.
 * Explicitly labeled synthetic; never presented as a real patient record.
 */

import type { GlucoseReading } from '@/types/health';
import type { MetabolicPattern, ExperimentOutcome } from '@/domain/patterns/types';
import type { AdherenceWeek, ProgrammeMission } from '@/domain/programme/types';
import type { WeeklyDigestPayload } from '@/domain/digest/types';

const SAFETY =
  'Habits and lifestyle experiments only — never insulin, medication dosing, or diagnosis.';

export const AMINA_DEMO = {
  patientLabel: 'Amina · demo patient (synthetic)',
  age: 51,
  condition: 'Type 2 diabetes — home metabolic-care programme',
  defaultDayIndex: 10,
  totalDays: 14,
  /** One-tap judge scenes */
  scenes: {
    pattern: 2,
    measure: 10,
    outreach: 12,
  },
  disclaimer:
    'Synthetic fixture for reliable demos. Not a real patient. Live Dexcom remains available separately as technical proof.',
} as const;

function dayStart(dayIndex: number): number {
  // Fixed epoch so demos are stable across machines
  const base = Date.UTC(2026, 6, 1, 0, 0, 0); // 2026-07-01
  return base + dayIndex * 24 * 60 * 60 * 1000;
}

/** Generate a day of synthetic CGM-like points (every ~15 min, daytime denser). */
export function aminaReadingsForDay(dayIndex: number, walkedAfterDinner: boolean): GlucoseReading[] {
  const start = dayStart(dayIndex);
  const points: GlucoseReading[] = [];
  for (let m = 6 * 60; m <= 22 * 60; m += 15) {
    const h = Math.floor(m / 60);
    let value = 105 + Math.sin(m / 40) * 8;
    // Breakfast bump
    if (h >= 8 && h < 10) value += 35;
    // Lunch bump
    if (h >= 12 && h < 14) value += 28;
    // Dinner excursion — smaller when walked
    if (h >= 19 && h <= 21) {
      value += walkedAfterDinner ? 22 : 48;
    }
    // Slight day-of-week drift
    value += (dayIndex % 3) * 2;
    points.push({
      value: Math.round(Math.max(72, Math.min(240, value))),
      timestamp: start + m * 60 * 1000,
      source: 'cgm',
      trend: h >= 19 && h <= 20 ? 'rising' : 'stable',
    });
  }
  return points;
}

function aminaPattern(dayIndex: number): MetabolicPattern {
  const walkedPrior = dayIndex >= 7;
  return {
    id: `amina-pattern-d${dayIndex}`,
    kind: 'evening_excursion',
    headline:
      'Your glucose response is most elevated between 7:00 and 9:00 PM, especially on low-activity days.',
    explanation: walkedPrior
      ? 'On evenings when the post-dinner walk was completed, the post-dinner response was generally lower. Continuing the experiment builds evidence — not proof of causation.'
      : 'Across the last several evenings, readings in the post-dinner window tended higher than mid-day. This is an observational pattern from the demo fixture.',
    evidence: [
      {
        label: 'Recurring window',
        detail: '7:00–9:00 PM elevated on 5 of last 7 evenings',
      },
      {
        label: 'Activity context',
        detail: walkedPrior
          ? 'Walk completed on 3 of last 4 dinner evenings'
          : 'Low evening activity on most elevated days',
      },
      {
        label: 'Data coverage',
        detail: 'Synthetic CGM series · ~64 points / day',
      },
    ],
    dataCoverage: 0.9,
    whySeeingThis:
      'Demo mode uses a fixed synthetic series so judging never depends on live OAuth or waiting days. Live Dexcom uses the same pattern detector.',
    safetyBoundary: SAFETY,
    suggestedBehaviour: 'post_meal_walk',
    suggestedExperiment:
      'Tonight’s mission: take a 10-minute walk within 30 minutes after dinner.',
    whyThisExperiment:
      'Selected because the largest recurring excursion sits in the post-dinner window and a short walk is practical, reversible, and measurable.',
    source: 'demo',
    detectedAt: dayStart(dayIndex) + 12 * 60 * 60 * 1000,
  };
}

function aminaMission(dayIndex: number): ProgrammeMission {
  const walked = dayIndex >= 4 && dayIndex !== 6 && dayIndex !== 9;
  const practiced = dayIndex >= 3;
  const date = new Date(dayStart(dayIndex));
  const dateKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  let status: ProgrammeMission['status'] = 'assigned';
  if (walked) status = 'completed';
  else if (practiced) status = 'practiced';

  return {
    id: `amina-mission-${dateKey}`,
    dateKey,
    behaviourTarget: 'post_meal_walk',
    templateId: 'post_meal_walk',
    realmCopy: 'A short patrol after dinner steadies the evening field.',
    realWorldAction: 'Take a 10-minute walk within 30 minutes after dinner.',
    transferHint: 'You rehearsed post-meal movement — now do it after dinner.',
    caregiverSupportAction: 'Invite them on a short walk after dinner.',
    status,
    source: 'rules',
    practicedAt: practiced ? dayStart(dayIndex) + 18 * 60 * 60 * 1000 : undefined,
    completedAt: walked ? dayStart(dayIndex) + 20 * 60 * 60 * 1000 : undefined,
  };
}

export interface AminaDayState {
  dayIndex: number;
  label: string;
  pattern: MetabolicPattern;
  mission: ProgrammeMission;
  readings: GlucoseReading[];
  walkedAfterDinner: boolean;
  outcome: ExperimentOutcome | null;
  reflection: string | null;
  loopPhase: 'detect' | 'mission' | 'rehearse' | 'act' | 'measure' | 'adapt';
}

export function getAminaDay(dayIndex: number): AminaDayState {
  const clamped = Math.max(0, Math.min(AMINA_DEMO.totalDays - 1, dayIndex));
  const walked = clamped >= 4 && clamped !== 6 && clamped !== 9;
  const readings = aminaReadingsForDay(clamped, walked);
  const mission = aminaMission(clamped);

  let loopPhase: AminaDayState['loopPhase'] = 'detect';
  if (clamped >= 1) loopPhase = 'mission';
  if (clamped >= 2) loopPhase = 'rehearse';
  if (clamped >= 4) loopPhase = 'act';
  if (clamped >= 7) loopPhase = 'measure';
  if (clamped >= 10) loopPhase = 'adapt';

  const outcome: ExperimentOutcome | null =
    clamped >= 7
      ? {
          missionTemplateId: 'post_meal_walk',
          behaviourTarget: 'post_meal_walk',
          completedDays: Math.min(4, clamped - 3),
          assignedDays: Math.min(7, clamped - 2),
          associatedNote:
            'Associated with a smaller post-dinner rise on completed evenings versus skipped ones (observational — not proven causation).',
          beforeLabel: 'Pre-experiment evenings · higher post-dinner rise',
          afterLabel: 'Completed-walk evenings · smaller post-dinner rise',
        }
      : null;

  return {
    dayIndex: clamped,
    label: `Day ${clamped + 1} of ${AMINA_DEMO.totalDays}`,
    pattern: aminaPattern(clamped),
    mission,
    readings,
    walkedAfterDinner: walked,
    outcome,
    reflection:
      clamped >= 8
        ? 'Felt doable after dinner. Harder on busy nights — “make it easier” (5 min) helped.'
        : null,
    loopPhase,
  };
}

export function buildAminaClinicianDigest(dayIndex: number = AMINA_DEMO.defaultDayIndex): WeeklyDigestPayload {
  const day = getAminaDay(dayIndex);
  const escalation = dayIndex >= AMINA_DEMO.scenes.outreach;
  const adherence: AdherenceWeek = {
    weekKey: day.mission.dateKey,
    assigned: 7,
    completed: escalation ? 2 : day.outcome?.completedDays ?? 3,
    practiced: escalation ? 3 : 5,
    relapses: escalation ? 3 : 1,
  };
  const completed = adherence.completed;
  const assigned = adherence.assigned;

  if (escalation) {
    return {
      weekKey: adherence.weekKey,
      adherence,
      missionsCompleted: completed,
      missionsAssigned: assigned,
      practiceSessions: 3,
      topBehaviours: ['post_meal_walk'],
      wins: ['Opened programme after a soft week', 'Asked coach about barriers once'],
      concerns: [
        'Mission completion dropped sharply mid-week',
        'Patient flagged evening walks as not practical three nights running',
      ],
      narrative:
        'Adherence dipped. Patient reported barriers and one urgent-sounding chat that was escalated out of the habit coach. No dosing advice was given. Human outreach recommended.',
      createdAt: Date.now(),
      patientLabel: AMINA_DEMO.patientLabel,
      dataCoverage: 'Synthetic CGM · evening window still covered · chat escalation logged',
      recurringPatterns: [
        'Evening excursions persist on skipped-walk nights',
        'Barrier language increasing (“not practical”, stress)',
      ],
      changesSinceLastWeek: [
        'Completion rate fell vs prior week',
        'Safety escalation triggered from coach chat',
      ],
      patientBarriers: ['Not practical after late work', 'Stress', 'Low energy'],
      safetyFlags: [
        'Coach chat contained urgent hypo-symptom language → user directed to care team / emergency services (habit coach stopped)',
      ],
      outreachRecommended: true,
      outreachReason:
        'Safety escalation plus collapsing adherence — brief human check-in can make a difference this week.',
      experimentsTried: [
        {
          action: '10-minute walk within 30 minutes after dinner',
          completed: completed,
          associatedNote: 'Mostly skipped this week after barriers; easier 5-minute variant offered.',
        },
      ],
      mode: 'clinician',
    };
  }

  return {
    weekKey: adherence.weekKey,
    adherence,
    missionsCompleted: completed,
    missionsAssigned: assigned,
    practiceSessions: 6,
    topBehaviours: ['post_meal_walk', 'protein_first'],
    wins: [
      'Completed post-dinner walk on 3 of 4 attempted evenings',
      'Practiced mission in-app before real-world action',
      'Patient used “make it easier” once instead of dropping off',
    ],
    concerns: [
      'One soft relapse on a high-stress evening — recovery mission recommended',
    ],
    narrative:
      'Amina rehearsed and completed a post-dinner walking experiment. Post-dinner glucose responses were generally lower on completed evenings. No dosing advice was given. Habits and lifestyle support only.',
    createdAt: Date.now(),
    patientLabel: AMINA_DEMO.patientLabel,
    dataCoverage: 'Synthetic CGM · 14-day fixture · ~90% evening-window coverage',
    recurringPatterns: [
      'Largest excursions clustered 7:00–9:00 PM',
      'Elevations more common on low-activity evenings',
    ],
    changesSinceLastWeek: [
      'Mission completion improved vs prior soft week',
      'Patient reported 5-minute walk variant when busy',
    ],
    patientBarriers: ['Busy evenings', 'Motivation dips when stressed'],
    safetyFlags: [],
    outreachRecommended: false,
    outreachReason: 'No safety exceptions. Optional encouragement on adherence streak.',
    experimentsTried: [
      {
        action: '10-minute walk within 30 minutes after dinner',
        completed: completed,
        associatedNote:
          'Associated with a smaller post-dinner rise on completed days (observational).',
      },
    ],
    mode: 'clinician',
  };
}

export function aminaLoopSteps(dayIndex: number): {
  key: AminaDayState['loopPhase'];
  title: string;
  done: boolean;
  active: boolean;
}[] {
  const day = getAminaDay(dayIndex);
  const order: AminaDayState['loopPhase'][] = [
    'detect',
    'mission',
    'rehearse',
    'act',
    'measure',
    'adapt',
  ];
  const titles: Record<AminaDayState['loopPhase'], string> = {
    detect: 'Detect pattern',
    mission: 'One mission',
    rehearse: 'Rehearse',
    act: 'Act at home',
    measure: 'Measure response',
    adapt: 'Adapt + inform care team',
  };
  const activeIdx = order.indexOf(day.loopPhase);
  return order.map((key, i) => ({
    key,
    title: titles[key],
    done: i < activeIdx,
    active: i === activeIdx,
  }));
}
