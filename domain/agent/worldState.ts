import type { MetabolicPattern } from '@/domain/patterns';
import type { ProgrammeMission } from '@/domain/programme';

/**
 * Privacy-safe presentation state for one mission. It carries no readings,
 * identifiers, free text, or clinical conclusion; it is derived from an
 * approved pattern and mission on the device.
 */
export type WorldScene =
  | 'table_choice'
  | 'after_meal_path'
  | 'drink_pause'
  | 'evening_reset'
  | 'support_space';

export type WorldTone = 'steady' | 'gentle' | 'encouraging';
export type PracticeIntensity = 'unhurried' | 'standard' | 'focused';
export type WorldResponse = 'ready' | 'easier' | 'later' | 'completed';

export interface PersonalisedWorldState {
  version: 1;
  missionId: string;
  missionTemplateId: string;
  scene: WorldScene;
  tone: WorldTone;
  practiceIntensity: PracticeIntensity;
  response: WorldResponse;
  updatedAt: number;
}

const SCENE_BY_TEMPLATE: Record<string, WorldScene> = {
  protein_first: 'table_choice',
  post_meal_walk: 'after_meal_path',
  reject_liquid_sugar: 'drink_pause',
  pair_carbs: 'table_choice',
  steady_evening: 'evening_reset',
  ally_rally: 'table_choice',
  caregiver_support: 'support_space',
};

export function buildPersonalisedWorldState(
  pattern: MetabolicPattern,
  mission: ProgrammeMission,
  response: WorldResponse = 'ready',
): PersonalisedWorldState {
  const gentle = response === 'easier' || response === 'later';
  return {
    version: 1,
    missionId: mission.id,
    missionTemplateId: mission.templateId,
    scene: SCENE_BY_TEMPLATE[mission.templateId] || 'table_choice',
    tone: gentle ? 'gentle' : pattern.kind === 'stable_baseline' ? 'steady' : 'encouraging',
    practiceIntensity: response === 'easier' ? 'unhurried' : response === 'completed' ? 'focused' : 'standard',
    response,
    updatedAt: Date.now(),
  };
}

export function worldSceneLabel(scene: WorldScene): string {
  const labels: Record<WorldScene, string> = {
    table_choice: 'Table-side choices',
    after_meal_path: 'After-meal path',
    drink_pause: 'Drink pause',
    evening_reset: 'Evening reset',
    support_space: 'Support space',
  };
  return labels[scene];
}

export function worldToneCopy(state: PersonalisedWorldState): string {
  if (state.response === 'easier') return 'Made smaller for your day.';
  if (state.response === 'later') return 'Held gently until later today.';
  if (state.response === 'completed') return 'Settled after your real-world action.';
  if (state.tone === 'steady') return 'Protect the steadiness you already have.';
  return 'Built around today\'s practical choice.';
}
