/**
 * Metabolic pattern → behavioural experiment types.
 * Patterns are observational hypotheses — never causal diagnoses.
 */

import type { BehaviourTarget } from '@/domain/programme/types';

export type PatternKind =
  | 'evening_excursion'
  | 'post_meal_rise'
  | 'low_activity_days'
  | 'liquid_sugar_suspect'
  | 'stable_baseline'
  | 'insufficient_data';

export interface PatternEvidencePoint {
  label: string;
  detail: string;
}

export interface MetabolicPattern {
  id: string;
  kind: PatternKind;
  /** Plain-language observation */
  headline: string;
  explanation: string;
  evidence: PatternEvidencePoint[];
  /** 0–1 coverage confidence for UI honesty */
  dataCoverage: number;
  whySeeingThis: string;
  safetyBoundary: string;
  suggestedBehaviour: BehaviourTarget;
  suggestedExperiment: string;
  whyThisExperiment: string;
  source: 'cgm' | 'demo' | 'rules' | 'self_report';
  detectedAt: number;
}

export interface ExperimentOutcome {
  missionTemplateId: string;
  behaviourTarget: BehaviourTarget;
  completedDays: number;
  assignedDays: number;
  /** Carefully worded association — never "caused" */
  associatedNote: string;
  beforeLabel: string;
  afterLabel: string;
}
