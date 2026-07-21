/**
 * Deterministic synthetic cohort for the operator surface.
 *
 * Produces 30 programme members with varied adherence states so an
 * operator can scan a realistic panel without hand-waving. Every run
 * returns the same data — no randomness, no drift between demos.
 *
 * This is explicitly labelled synthetic and never presented as real
 * patient data. A future authenticated backend replaces this generator
 * with a real cohort query; the view layer does not change.
 */
import type { AdherenceWeek } from '@/domain/programme/types';
import type { WeeklyDigestPayload } from '@/domain/digest/types';
import { estimateStaffMinutesSaved } from '@/domain/digest/types';
import { weekKeyFrom, emptyAdherenceWeek } from '@/domain/programme/selectMission';
import type {
  CohortOverview,
  CohortPatientSummary,
  CohortAggregate,
} from './types';

const COHORT_SIZE = 30;
const WEEK_KEY = weekKeyFrom(Date.now());

/**
 * A deterministic pseudo-random generator seeded by patient index.
 * Uses a simple LCG so the cohort is stable across runs and platforms.
 */
function seeded(n: number): number {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function adherenceFor(
  index: number,
  assigned: number,
  completed: number,
  relapses: number,
): AdherenceWeek {
  return {
    weekKey: WEEK_KEY,
    assigned,
    completed,
    practiced: 0,
    relapses,
  };
}

/**
 * Each patient archetype is defined by a profile that controls the
 * digest shape. The archetypes are spread across the 30 slots so the
 * cohort has a realistic mix: a few escalating, several holding, most
 * stable, a few new or recovering.
 */
interface PatientProfile {
  /** Anonymous label suffix. */
  id: number;
  assigned: number;
  completed: number;
  relapses: number;
  safetyFlags: string[];
  concerns: string[];
  barriers: string[];
  outreachRecommended: boolean;
  outreachReason: string;
  topBehaviours: string[];
  wins: string[];
  narrative: string;
}

const BEHAVIOURS = [
  'post_meal_walk',
  'protein_first',
  'reject_liquid_sugar',
  'pair_carbs',
  'steady_evening',
  'ally_rally',
];

const BARRIER_OPTIONS = [
  'Evening cravings — recovery mission offered',
  'Work travel disrupted routine mid-week',
  'Patient flagged mission as not practical twice',
  'New medication adjustment — monitoring',
  '',
  '',
  '',
];

const WIN_OPTIONS = [
  'Completed post-dinner walk on 3 of 4 attempted evenings',
  'Chose protein-first breakfast 4 days running',
  'Replaced sugary drink with water at lunch',
  'Used "make it easier" once instead of dropping off',
  'Opened programme after a soft week and re-engaged',
  'Paired carbs with protein at every dinner',
];

function profileFor(index: number): PatientProfile {
  const r = (offset: number) => seeded(index * 7 + offset);

  // ~10% safety flag, ~23% outreach, ~40% holding, ~27% stable
  const roll = r(1);
  let tier: 'safety' | 'outreach' | 'holding' | 'stable';
  if (roll < 0.1) tier = 'safety';
  else if (roll < 0.33) tier = 'outreach';
  else if (roll < 0.73) tier = 'holding';
  else tier = 'stable';

  const assigned = 5 + Math.floor(r(2) * 3); // 5-7
  let completed: number;
  let relapses: number;
  let safetyFlags: string[] = [];
  let concerns: string[] = [];
  let barriers: string[] = [];
  let outreachRecommended = false;
  let outreachReason = 'No safety exceptions. Exception-oriented summary only.';
  let narrative: string;

  const behaviour = BEHAVIOURS[Math.floor(r(3) * BEHAVIOURS.length)];
  const behaviour2 = BEHAVIOURS[Math.floor(r(4) * BEHAVIOURS.length)];
  const wins = [WIN_OPTIONS[Math.floor(r(5) * WIN_OPTIONS.length)]];
  const barrier = BARRIER_OPTIONS[Math.floor(r(6) * BARRIER_OPTIONS.length)];

  switch (tier) {
    case 'safety':
      completed = Math.floor(r(7) * 2); // 0-1
      relapses = 1 + Math.floor(r(8) * 2); // 1-2
      safetyFlags = ['Recurrent hypoglycemia pattern flagged — clinical review suggested'];
      concerns = [
        'Mission completion dropped sharply mid-week',
        'Safety flag from CGM pattern — escalation pathway triggered',
      ];
      barriers = barrier ? [barrier] : ['Safety flag — clinical review suggested'];
      outreachRecommended = true;
      outreachReason =
        'Safety flag and low completion — brief clinical check-in recommended this week.';
      narrative = `Week of ${WEEK_KEY}: ${completed}/${assigned} missions completed. Safety flag triggered — exception-oriented review needed.`;
      break;
    case 'outreach':
      completed = 1 + Math.floor(r(7) * 2); // 1-2
      relapses = 1;
      concerns = [
        'Mission completion below 40% with recovery moments',
        barrier || 'Patient engagement dropped mid-week',
      ].filter(Boolean);
      barriers = barrier ? [barrier] : ['Missed evenings — recovery mission offered'];
      outreachRecommended = true;
      outreachReason =
        'Low mission completion with recovery moments — brief human check-in may help.';
      narrative = `Week of ${WEEK_KEY}: ${completed}/${assigned} missions completed (${Math.round((completed / assigned) * 100)}%). Recovery coaching recommended.`;
      break;
    case 'holding':
      completed = 2 + Math.floor(r(7) * 2); // 2-3
      relapses = r(9) < 0.3 ? 1 : 0;
      concerns = relapses > 0 ? ['1 soft relapse — recovery mission offered'] : [];
      barriers = barrier && relapses > 0 ? [barrier] : [];
      narrative = `Week of ${WEEK_KEY}: ${completed}/${assigned} missions completed (${Math.round((completed / assigned) * 100)}%). Adherence holding with room to grow.`;
      break;
    case 'stable':
      completed = assigned - Math.floor(r(7) * 2); // assigned-1 to assigned
      relapses = 0;
      narrative = `Week of ${WEEK_KEY}: ${completed}/${assigned} missions completed (${Math.round((completed / assigned) * 100)}%). Adherence is steady.`;
      break;
  }

  const topBehaviours = [behaviour, behaviour2].filter((b, i, arr) => arr.indexOf(b) === i);

  return {
    id: index,
    assigned,
    completed,
    relapses,
    safetyFlags,
    concerns,
    barriers,
    outreachRecommended,
    outreachReason,
    topBehaviours,
    wins,
    narrative,
  };
}

function digestFor(profile: PatientProfile): WeeklyDigestPayload {
  const adherence = adherenceFor(
    profile.id,
    profile.assigned,
    profile.completed,
    profile.relapses,
  );
  return {
    weekKey: WEEK_KEY,
    adherence,
    missionsCompleted: profile.completed,
    missionsAssigned: profile.assigned,
    topBehaviours: profile.topBehaviours,
    wins: profile.wins,
    concerns: profile.concerns,
    narrative: profile.narrative,
    createdAt: Date.now(),
    patientLabel: `Programme member · ${String(profile.id + 1001).padStart(4, '0')}`,
    dataCoverage: 'Programme adherence (no raw glucose series shared)',
    recurringPatterns: profile.topBehaviours.map((b) => `Focus behaviour: ${b.replace(/_/g, ' ')}`),
    changesSinceLastWeek: [`${profile.completed} missions completed this week`],
    patientBarriers: profile.barriers,
    safetyFlags: profile.safetyFlags,
    outreachRecommended: profile.outreachRecommended,
    outreachReason: profile.outreachReason,
    experimentsTried: [],
    mode: 'clinician',
  };
}

function priorityFor(
  profile: PatientProfile,
): { priority: 0 | 1 | 2 | 3; reason: string } {
  if (profile.safetyFlags.length > 0) {
    return { priority: 0, reason: 'Safety flag — clinical review' };
  }
  if (profile.outreachRecommended) {
    return { priority: 1, reason: 'Outreach recommended — low completion' };
  }
  if (profile.relapses > 0 || profile.concerns.length > 0) {
    return { priority: 2, reason: 'Holding — recovery moments this week' };
  }
  return { priority: 3, reason: 'Stable — no action needed' };
}

function buildPatientSummary(index: number): CohortPatientSummary {
  const profile = profileFor(index);
  const digest = digestFor(profile);
  const { priority, reason } = priorityFor(profile);
  const completionRate = Math.round((profile.completed / profile.assigned) * 100);
  const staff = estimateStaffMinutesSaved(digest);

  return {
    patientLabel: digest.patientLabel!,
    priority,
    digest,
    missionsCompleted: profile.completed,
    missionsAssigned: profile.assigned,
    completionRate,
    hasSafetyFlag: profile.safetyFlags.length > 0,
    outreachRecommended: profile.outreachRecommended,
    priorityReason: reason,
    staffMinutesSaved: staff.minutes,
  };
}

function buildAggregate(patients: CohortPatientSummary[]): CohortAggregate {
  const enrolled = patients.length;
  const needsAttention = patients.filter(
    (p) => p.priority <= 1,
  ).length;
  const holding = patients.filter((p) => p.priority === 2).length;
  const stable = patients.filter((p) => p.priority === 3).length;
  const totalCompleted = patients.reduce((sum, p) => sum + p.missionsCompleted, 0);
  const totalAssigned = patients.reduce((sum, p) => sum + p.missionsAssigned, 0);
  const cohortCompletionRate = Math.round((totalCompleted / totalAssigned) * 100);
  const totalStaffMinutesSaved = patients.reduce((sum, p) => sum + p.staffMinutesSaved, 0);
  const weeklyAdherentPatients = patients.filter((p) => p.missionsCompleted > 0).length;
  const archetypeCompletion = computeArchetypeCompletion(patients);

  return {
    enrolled,
    needsAttention,
    holding,
    stable,
    cohortCompletionRate,
    totalStaffMinutesSaved,
    weeklyAdherentPatients,
    archetypeCompletion,
  };
}

/**
 * Group completion by each patient's primary behaviourTarget (digest.topBehaviours[0]).
 * Returns per-archetype completion rate and patient count. Used by the operator
 * aggregate header so a care team can see "post_meal_walk: 73% across 12 patients"
 * without any new data capture.
 */
export function computeArchetypeCompletion(
  patients: CohortPatientSummary[],
): Record<string, { rate: number; count: number }> {
  const map = new Map<string, { completed: number; assigned: number; count: number }>();
  for (const p of patients) {
    const behaviour = p.digest?.topBehaviours?.[0];
    if (!behaviour) continue;
    const entry = map.get(behaviour) ?? { completed: 0, assigned: 0, count: 0 };
    entry.completed += p.missionsCompleted;
    entry.assigned += p.missionsAssigned;
    entry.count += 1;
    map.set(behaviour, entry);
  }
  const out: Record<string, { rate: number; count: number }> = {};
  for (const [behaviour, entry] of map) {
    out[behaviour] = {
      rate: Math.round((entry.completed / Math.max(entry.assigned, 1)) * 100),
      count: entry.count,
    };
  }
  return out;
}

/**
 * Stamp each patient with their primary behaviour and the cohort median completion
 * for that archetype, so the work queue row can show "cohort median for
 * post_meal_walk this week is 5/7" without recomputing per row.
 */
export function stampArchetypeContext(
  patients: CohortPatientSummary[],
  archetypeCompletion: Record<string, { rate: number; count: number }>,
): void {
  for (const p of patients) {
    const behaviour = p.digest?.topBehaviours?.[0];
    if (behaviour && archetypeCompletion[behaviour]) {
      p.primaryBehaviour = behaviour;
      p.cohortMedianForArchetype = archetypeCompletion[behaviour].rate;
    }
  }
}

/**
 * Build the deterministic synthetic cohort overview.
 *
 * Returns 30 patients sorted by priority ascending (most urgent first).
 * Every call returns the same data — safe for demos and judging.
 */
export function buildSyntheticCohortOverview(): CohortOverview {
  const patients = Array.from({ length: COHORT_SIZE }, (_, i) => buildPatientSummary(i)).sort(
    (a, b) => a.priority - b.priority,
  );
  const aggregate = buildAggregate(patients);
  stampArchetypeContext(patients, aggregate.archetypeCompletion ?? {});

  return {
    weekKey: WEEK_KEY,
    aggregate,
    patients,
    source: 'synthetic',
  };
}
