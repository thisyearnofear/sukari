import { getTemplateById } from './templates';
import { ProgrammeMission } from './types';

export interface PracticeBias {
  allyWeightBonus: number;
  enemyWeightBonus: number;
  preferProteinAllies: boolean;
  preferRejectSugaryDrinks: boolean;
  spawnRateMultiplier: number;
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

/** Protein-leaning ally food types from gameConfig */
export const PROTEIN_ALLY_TYPES = new Set(['protein', 'dairy', 'nuts']);

export const SUGARY_DRINK_TYPES = new Set(['soda', 'energy_drink']);
