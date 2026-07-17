import { MissionTemplate } from './types';

export const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    id: 'protein_first',
    behaviourTarget: 'protein_first',
    realmTitle: 'Protein Vanguard',
    realmCopy: 'Lead with protein before the Sugar Horde storms the gates.',
    realWorldAction: 'Eat protein before carbs at your next meal.',
    transferHint: 'In battle you rallied allies first — do the same tonight at the table.',
    caregiverSupportAction: 'Offer a protein-rich option before dessert or snacks.',
    modes: ['personal', 'curious'],
    signalHints: ['rising', 'high', 'disconnected'],
    practiceBias: { allyWeightBonus: 0.15, preferProteinAllies: true },
  },
  {
    id: 'post_meal_walk',
    behaviourTarget: 'post_meal_walk',
    realmTitle: 'Twilight Patrol',
    realmCopy: 'A short patrol after the feast steadies the Realm.',
    realWorldAction: 'Walk 10–15 minutes after your largest meal today.',
    transferHint: 'You defended under pressure — now move your body after eating.',
    caregiverSupportAction: 'Invite them on a short walk after dinner.',
    signalHints: ['rising', 'high', 'stable'],
    practiceBias: { spawnRateMultiplier: 0.9 },
  },
  {
    id: 'reject_liquid_sugar',
    behaviourTarget: 'reject_liquid_sugar',
    realmTitle: 'Ban the Potion',
    realmCopy: 'Liquid sugar slips past the walls unseen. Banish it.',
    realWorldAction: 'Skip sugary drinks today — water, sparkling, or unsweetened only.',
    transferHint: 'You rejected the Sugar Horde — keep liquid sugar out tonight.',
    caregiverSupportAction: 'Stock a non-sugary drink option and leave it visible.',
    signalHints: ['rising', 'high', 'disconnected'],
    practiceBias: { enemyWeightBonus: 0.1, preferRejectSugaryDrinks: true },
  },
  {
    id: 'pair_carbs',
    behaviourTarget: 'pair_carbs',
    realmTitle: 'Alliance Feast',
    realmCopy: 'Carbs alone are reckless. Pair them with allies.',
    realWorldAction: 'Pair any carb snack with protein, fat, or fiber.',
    transferHint: 'Pairing worked in the Realm — use it on your next snack.',
    caregiverSupportAction: 'Prep a simple pair (nuts + fruit, cheese + crackers).',
    modes: ['personal', 'curious'],
    signalHints: ['rising', 'stable', 'disconnected'],
    practiceBias: { allyWeightBonus: 0.1, preferProteinAllies: true },
  },
  {
    id: 'steady_evening',
    behaviourTarget: 'steady_evening',
    realmTitle: 'Night Watch',
    realmCopy: 'Hold the evening calm — no late sugar raids.',
    realWorldAction: 'Keep evening snacks light and finish eating 2+ hours before bed.',
    transferHint: 'A steady finish in battle means a steadier night for your Realm.',
    caregiverSupportAction: 'Help wind down without late sweet snacks.',
    signalHints: ['falling', 'stable', 'low'],
    practiceBias: { spawnRateMultiplier: 1.05 },
  },
  {
    id: 'ally_rally',
    behaviourTarget: 'ally_rally',
    realmTitle: 'Rally the Allies',
    realmCopy: 'Fill the halls with whole foods and fiber champions.',
    realWorldAction: 'Add one high-fiber or vegetable side to a meal today.',
    transferHint: 'You rallied allies in play — put one on your plate.',
    caregiverSupportAction: 'Serve or suggest a vegetable/fiber side with dinner.',
    signalHints: ['disconnected', 'stable'],
    practiceBias: { allyWeightBonus: 0.2 },
  },
  {
    id: 'caregiver_support',
    behaviourTarget: 'caregiver_support',
    realmTitle: 'Guardian Vigil',
    realmCopy: 'Your presence steadies their Realm more than advice alone.',
    realWorldAction: 'Ask one open question about how their day felt — then listen.',
    transferHint: 'Practice built empathy — use it in a real conversation tonight.',
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
