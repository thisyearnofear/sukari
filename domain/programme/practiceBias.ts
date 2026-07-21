import { getTemplateById } from './templates';
import { ProgrammeMission } from './types';
import type { PersonalisedWorldState } from '@/domain/agent';

export interface PracticeBias {
  allyWeightBonus: number;
  enemyWeightBonus: number;
  preferProteinAllies: boolean;
  preferRejectSugaryDrinks: boolean;
  spawnRateMultiplier: number;
}

/**
 * Plain-language explanation of how the optional rehearsal is tuned. This is
 * derived from an approved mission template, never raw readings.
 */
export interface PracticeCue {
  label: string;
  detail: string;
}

const PRACTICE_CUES: Record<string, PracticeCue> = {
  protein_first: {
    label: 'Protein-first choices',
    detail: 'You will see more protein and filling-food choices to rehearse.',
  },
  post_meal_walk: {
    label: 'A calmer after-meal pace',
    detail: 'The field gives you a little more space to practise the movement choice.',
  },
  reject_liquid_sugar: {
    label: 'Drink decisions',
    detail: 'Sugary-drink decisions appear more often so the practice matches today\'s ask.',
  },
  pair_carbs: {
    label: 'Pairing choices',
    detail: 'You will see more chances to pair a carb choice with something sustaining.',
  },
  steady_evening: {
    label: 'A steadier evening',
    detail: 'The rehearsal keeps a calm rhythm around lighter evening choices.',
  },
  ally_rally: {
    label: 'Fibre and vegetable choices',
    detail: 'Supportive food choices appear more often in this rehearsal.',
  },
  caregiver_support: {
    label: 'Support without judgement',
    detail: 'The rehearsal focuses on noticing supportive, practical responses.',
  },
};

export function getPracticeCueForTemplate(templateId: string | null | undefined): PracticeCue | null {
  return templateId ? PRACTICE_CUES[templateId] || null : null;
}

/** Applies a patient-approved presentation preference without changing mission safety. */
export function applyWorldStateToPracticeBias(
  bias: PracticeBias,
  worldState: PersonalisedWorldState | null | undefined,
): PracticeBias {
  if (!worldState) return bias;
  if (worldState.practiceIntensity === 'unhurried') {
    return { ...bias, spawnRateMultiplier: Math.min(bias.spawnRateMultiplier, 0.78) };
  }
  if (worldState.practiceIntensity === 'focused') {
    return { ...bias, spawnRateMultiplier: Math.min(1.08, bias.spawnRateMultiplier * 1.04) };
  }
  return bias;
}

const DEFAULT_BIAS: PracticeBias = {
  allyWeightBonus: 0,
  enemyWeightBonus: 0,
  preferProteinAllies: false,
  preferRejectSugaryDrinks: false,
  spawnRateMultiplier: 1,
};

export function getPracticeBiasForMission(
  mission: ProgrammeMission | null | undefined,
): PracticeBias {
  if (!mission) return DEFAULT_BIAS;
  const template = getTemplateById(mission.templateId);
  if (!template?.practiceBias) return DEFAULT_BIAS;
  return {
    ...DEFAULT_BIAS,
    ...template.practiceBias,
  };
}
