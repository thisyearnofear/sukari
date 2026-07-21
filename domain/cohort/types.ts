/**
 * Cohort-level types for the programme-operator surface.
 *
 * A cohort overview is the aggregate an operator sees before drilling
 * into any single patient. It is designed so a future authenticated
 * backend can replace the synthetic generator with a real cohort query
 * without changing the view layer.
 */
import type { WeeklyDigestPayload } from '@/domain/digest';

/**
 * A single patient's summary within the cohort, ranked by priority.
 *
 * `priority` drives sort order: 0 = highest (safety flags), 3 = lowest
 * (stable, no action needed). The operator sees the most urgent first.
 */
export interface CohortPatientSummary {
  /** Stable anonymised label, never the patient's real name. */
  patientLabel: string;
  /** 0 = safety flag, 1 = outreach recommended, 2 = holding, 3 = stable. */
  priority: 0 | 1 | 2 | 3;
  /** The underlying weekly digest; null when only summary fields are available. */
  digest: WeeklyDigestPayload | null;
  /** Missions completed this week. */
  missionsCompleted: number;
  /** Missions assigned this week. */
  missionsAssigned: number;
  /** Completion rate 0-100, rounded. */
  completionRate: number;
  /** True when the programme flagged a safety concern. */
  hasSafetyFlag: boolean;
  /** True when the deterministic engine recommends human outreach. */
  outreachRecommended: boolean;
  /** Short human-readable reason for the current priority. */
  priorityReason: string;
  /** Estimated staff minutes saved this week (0 when outreach is needed). */
  staffMinutesSaved: number;
  /** This patient's primary behaviourTarget this week, for archetype context. */
  primaryBehaviour?: string;
  /** Cohort median completion rate for this patient's primaryBehaviour this week. */
  cohortMedianForArchetype?: number;
}

/**
 * Aggregate metrics across the whole cohort — the budget-holder language.
 */
export interface CohortAggregate {
  /** Total enrolled patients in the cohort. */
  enrolled: number;
  /** Patients with safety flags or outreach recommended. */
  needsAttention: number;
  /** Patients holding without outreach. */
  holding: number;
  /** Patients stable this week. */
  stable: number;
  /** Cohort-level mission completion rate, 0-100. */
  cohortCompletionRate: number;
  /** Total estimated staff minutes saved across the cohort this week. */
  totalStaffMinutesSaved: number;
  /** Patients with at least one completed mission this week (WAP). */
  weeklyAdherentPatients: number;
  /** Completion rate broken down by behaviourTarget, e.g. { post_meal_walk: { rate: 73, count: 12 } }. */
  archetypeCompletion?: Record<string, { rate: number; count: number }>;
  /** Patient-reported response rate by behaviourTarget. Of patients who completed
   *  and reported, how many noticed a difference. e.g. { post_meal_walk: { responseRate: 64, reported: 9, noticed: 5 } }. */
  archetypeResponseRate?: Record<string, { responseRate: number; reported: number; noticed: number }>;
}

/**
 * The full cohort view payload.
 */
export interface CohortOverview {
  weekKey: string;
  aggregate: CohortAggregate;
  /** Patients sorted by priority ascending (most urgent first). */
  patients: CohortPatientSummary[];
  /** Whether this is synthetic demo data or real cohort data. */
  source: 'synthetic' | 'local' | 'remote';
}
