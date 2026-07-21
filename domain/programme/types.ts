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
