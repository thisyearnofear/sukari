/**
 * Programme domain — single source of truth for daily adherence missions.
 * Pure TypeScript; no React.
 */

export type BehaviourTarget =
  | 'protein_first'
  | 'post_meal_walk'
  | 'reject_liquid_sugar'
  | 'pair_carbs'
  | 'steady_evening'
  | 'ally_rally'
  | 'caregiver_support';

export type MissionStatus = 'assigned' | 'practiced' | 'completed' | 'skipped' | 'relapsed';

export type MissionSource = 'rules' | 'coach' | 'caregiver_invite';

/**
 * Patient-reported outcome captured after mission completion.
 *
 * This is the "measure" phase of the closed loop. It is deliberately
 * patient-reported, not CGM-derived — no causal claims, no clinical
 * measurement. The patient tells Mira how it felt and whether they
 * noticed a difference. This feeds the cohort evidence on the operator
 * surface ("of 12 patients who completed post_meal_walk, 8 reported
 * noticing a difference") without crossing the "no causal overclaiming"
 * boundary.
 *
 * A future CGM-derived response classifier is a separate, gated step
 * that requires clinical validation.
 */
export interface PatientReportedOutcome {
  /** How the mission felt relative to expectation. */
  feltDifficulty: 'easier' | 'about_right' | 'harder';
  /** Whether the patient noticed a difference after completing. */
  noticedDifference: 'yes' | 'no' | 'not_sure';
  /** When the outcome was reported (epoch ms). */
  reportedAt: number;
}

export interface ProgrammeMission {
  id: string;
  dateKey: string; // YYYY-MM-DD
  behaviourTarget: BehaviourTarget;
  templateId: string;
  realmCopy: string;
  realWorldAction: string;
  transferHint: string;
  caregiverSupportAction: string;
  status: MissionStatus;
  source: MissionSource;
  practicedAt?: number;
  completedAt?: number;
  /** Patient-reported outcome captured after completion (the "measure" phase). */
  reportedOutcome?: PatientReportedOutcome | null;
  /** Free-form reflection text captured with the outcome. */
  reflection?: string | null;
}

export interface AdherenceWeek {
  weekKey: string; // ISO week start YYYY-MM-DD
  assigned: number;
  completed: number;
  practiced: number;
  relapses: number;
}

export interface MissionTemplate {
  id: string;
  behaviourTarget: BehaviourTarget;
  realmTitle: string;
  realmCopy: string;
  realWorldAction: string;
  transferHint: string;
  caregiverSupportAction: string;
  /** Preferred user modes (empty = all) */
  modes?: ('personal' | 'caregiver' | 'curious')[];
  /** Prefer when CGM connected and trend matches */
  signalHints?: ('rising' | 'falling' | 'stable' | 'high' | 'low' | 'disconnected')[];
  /** Practice personalization bias keys */
  practiceBias?: {
    allyWeightBonus?: number;
    enemyWeightBonus?: number;
    preferProteinAllies?: boolean;
    preferRejectSugaryDrinks?: boolean;
    spawnRateMultiplier?: number;
  };
}
