import { MissionTemplate } from './types';

export const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    id: 'protein_first',
    behaviourTarget: 'protein_first',
    realmTitle: 'Protein first',
    realmCopy: 'Lead with protein before carbs rush the field.',
    realWorldAction: 'Eat protein before carbs at your next meal.',
    transferHint: 'You practiced leading with protein in rehearsal — do the same at your next meal.',
    caregiverSupportAction: 'Offer a protein-rich option before dessert or snacks.',
    modes: ['personal', 'curious'],
    signalHints: ['rising', 'high', 'disconnected'],
    practiceBias: { allyWeightBonus: 0.15, preferProteinAllies: true },
  },
  {
    id: 'post_meal_walk',
    behaviourTarget: 'post_meal_walk',
    realmTitle: 'After-meal walk',
    realmCopy: 'A short walk after eating steadies the evening field.',
    realWorldAction: 'Walk 10–15 minutes after your largest meal today.',
    transferHint: 'You rehearsed post-meal movement — take the 10-minute walk after dinner.',
    caregiverSupportAction: 'Invite them on a short walk after dinner.',
    signalHints: ['rising', 'high', 'stable'],
    practiceBias: { spawnRateMultiplier: 0.9 },
  },
  {
    id: 'reject_liquid_sugar',
    behaviourTarget: 'reject_liquid_sugar',
    realmTitle: 'Skip liquid sugar',
    realmCopy: 'Liquid sugar spikes the field fast — send it away.',
    realWorldAction: 'Skip sugary drinks today — water, sparkling, or unsweetened only.',
    transferHint: 'You practiced rejecting liquid sugar in rehearsal — keep sugary drinks out today.',
    caregiverSupportAction: 'Stock a non-sugary drink option and leave it visible.',
    signalHints: ['rising', 'high', 'disconnected'],
    practiceBias: { enemyWeightBonus: 0.1, preferRejectSugaryDrinks: true },
  },
  {
    id: 'pair_carbs',
    behaviourTarget: 'pair_carbs',
    realmTitle: 'Pair the carbs',
    realmCopy: 'Carbs alone hit hard. Pair them with protein, fat, or fiber.',
    realWorldAction: 'Pair any carb snack with protein, fat, or fiber.',
    transferHint: 'Pairing worked in rehearsal — use it on your next carb snack.',
    caregiverSupportAction: 'Prep a simple pair (nuts + fruit, cheese + crackers).',
    modes: ['personal', 'curious'],
    signalHints: ['rising', 'stable', 'disconnected'],
    practiceBias: { allyWeightBonus: 0.1, preferProteinAllies: true },
  },
  {
    id: 'steady_evening',
    behaviourTarget: 'steady_evening',
    realmTitle: 'Steady evening',
    realmCopy: 'Protect the evening calm — keep late snacks light.',
    realWorldAction: 'Keep evening snacks light and finish eating 2+ hours before bed.',
    transferHint: 'A steady finish in practice means a calmer evening — keep late snacks light.',
    caregiverSupportAction: 'Help wind down without late sweet snacks.',
    signalHints: ['falling', 'stable', 'low'],
    practiceBias: { spawnRateMultiplier: 1.05 },
  },
  {
    id: 'ally_rally',
    behaviourTarget: 'ally_rally',
    realmTitle: 'Add fiber',
    realmCopy: 'Pull in fiber and vegetables to steady the field.',
    realWorldAction: 'Add one high-fiber or vegetable side to a meal today.',
    transferHint: 'You practiced choosing fiber allies — add one vegetable or high-fiber side today.',
    caregiverSupportAction: 'Serve or suggest a vegetable/fiber side with dinner.',
    signalHints: ['disconnected', 'stable'],
    practiceBias: { allyWeightBonus: 0.2 },
  },
  {
    id: 'caregiver_support',
    behaviourTarget: 'caregiver_support',
    realmTitle: 'Support vigil',
    realmCopy: 'Your presence steadies them more than advice alone.',
    realWorldAction: 'Ask one open question about how their day felt — then listen.',
    transferHint: 'Practice built empathy — ask one open question tonight, then listen.',
    caregiverSupportAction: 'Check in without judging food choices.',
    modes: ['caregiver'],
    signalHints: ['disconnected', 'stable', 'rising', 'falling', 'high', 'low'],
    practiceBias: { allyWeightBonus: 0.1 },
  },
];

export function getTemplateById(id: string): MissionTemplate | undefined {
  return MISSION_TEMPLATES.find((t) => t.id === id);
}

export function getTemplateByBehaviour(target: string): MissionTemplate | undefined {
  return MISSION_TEMPLATES.find((t) => t.behaviourTarget === target);
}
