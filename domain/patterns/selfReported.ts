import type { BehaviourTarget } from '@/domain/programme/types';
import type { MetabolicPattern } from './types';

export interface SelfReportedMoment {
  id: 'meal_ahead' | 'dinner_hard' | 'evening_support' | 'caregiver_checkin';
  title: string;
  body: string;
  templateId: string;
  suggestedBehaviour: BehaviourTarget;
}

/**
 * Bounded, local-only check-ins. They make the selection rationale visible
 * without treating a patient's words as a biomarker signal or diagnosis.
 */
export const SELF_REPORTED_MOMENTS: SelfReportedMoment[] = [
  {
    id: 'meal_ahead',
    title: 'A meal is coming up',
    body: 'Choose one small thing to make the next meal easier.',
    templateId: 'protein_first',
    suggestedBehaviour: 'protein_first',
  },
  {
    id: 'dinner_hard',
    title: 'Dinner felt hard',
    body: 'Try a short after-meal reset rather than replaying the whole day.',
    templateId: 'post_meal_walk',
    suggestedBehaviour: 'post_meal_walk',
  },
  {
    id: 'evening_support',
    title: 'I want a steadier evening',
    body: 'Protect the end of the day with one realistic boundary.',
    templateId: 'steady_evening',
    suggestedBehaviour: 'steady_evening',
  },
  {
    id: 'caregiver_checkin',
    title: 'I want to support someone well',
    body: 'Start with a small, non-judgmental check-in.',
    templateId: 'caregiver_support',
    suggestedBehaviour: 'caregiver_support',
  },
];

export function buildSelfReportedPattern(moment: SelfReportedMoment): MetabolicPattern {
  return {
    id: `self-report-${moment.id}-${new Date().toISOString().slice(0, 10)}`,
    kind: 'stable_baseline',
    headline: `You chose: ${moment.title.toLowerCase()}.`,
    explanation: 'This mission follows the moment you selected. It is not an inference about your glucose or a diagnosis.',
    evidence: [{ label: 'Your check-in', detail: moment.title }],
    dataCoverage: 0.2,
    whySeeingThis: 'Sukari used the moment you selected to choose one approved, changeable habit mission.',
    safetyBoundary: 'Habits and lifestyle experiments only — never insulin, medication dosing, or diagnosis.',
    suggestedBehaviour: moment.suggestedBehaviour,
    suggestedExperiment: moment.body,
    whyThisExperiment: 'This is a small, reversible action matched to what you said would be useful right now.',
    source: 'self_report',
    detectedAt: Date.now(),
  };
}
