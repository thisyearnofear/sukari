import type { MetabolicPattern } from '@/domain/patterns';
import type { ProgrammeMission } from '@/domain/programme';

/**
 * Patient-facing record of a bounded agent decision. The pattern detector and
 * approved mission templates decide the clinical boundary; an LLM may only
 * personalise approved wording inside that boundary.
 */
export interface AgentDecisionTrace {
  observed: string;
  proposed: string;
  next: string;
  confidenceLabel: string;
  inputSummary: string;
  safetyBoundary: string;
}

export type MissionMediaBrief = {
  templateId: string;
  visualIntent: 'meal' | 'movement' | 'drink' | 'evening' | 'support';
};

export function buildAgentDecisionTrace(
  pattern: MetabolicPattern,
  mission: ProgrammeMission | null,
  state: 'unselected' | 'accepted' | 'deferred' | 'completed',
): AgentDecisionTrace {
  const observed = pattern.evidence[0]?.detail || pattern.headline;
  const proposed = mission?.realWorldAction || pattern.suggestedExperiment;
  const confidenceLabel =
    pattern.dataCoverage >= 0.7
      ? 'Strong signal coverage'
      : pattern.dataCoverage >= 0.4
        ? 'Partial signal coverage'
        : 'Starting hypothesis';
  const next =
    state === 'completed'
      ? 'Look for an associated response tomorrow.'
      : state === 'deferred'
        ? 'Wait for your update later today.'
        : state === 'accepted'
          ? 'Act in real life, or optionally practise the choice first.'
          : 'Choose, adapt, or decline this mission.';

  return {
    observed,
    proposed,
    next,
    confidenceLabel,
    inputSummary:
      pattern.source === 'demo'
        ? 'Labelled demonstration pattern'
        : pattern.source === 'cgm'
          ? 'Time-window pattern from connected readings'
          : 'Programme default because no continuous signal is connected',
    safetyBoundary: pattern.safetyBoundary,
  };
}

/** Maps approved mission templates to a non-sensitive visual request. */
export function buildMissionMediaBrief(
  pattern: MetabolicPattern,
  mission: ProgrammeMission | null,
): MissionMediaBrief {
  const templateId = mission?.templateId || pattern.suggestedBehaviour;
  const visualIntentByTemplate: Record<string, MissionMediaBrief['visualIntent']> = {
    protein_first: 'meal',
    post_meal_walk: 'movement',
    reject_liquid_sugar: 'drink',
    pair_carbs: 'meal',
    steady_evening: 'evening',
    ally_rally: 'meal',
    caregiver_support: 'support',
  };
  return {
    templateId,
    visualIntent: visualIntentByTemplate[templateId] || 'meal',
  };
}
