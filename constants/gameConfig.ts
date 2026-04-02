import { FoodDefinition, ComboTier, StabilityZone, MorningConditionConfig, PlotTwist, TimePhase, FoodEffects, UserMode } from '@/types/game';

export const GAME_DURATION = 60; // seconds
export const INITIAL_STABILITY = 50; // balanced start
export const COMBO_WINDOW = 2000; // ms to maintain combo
export const SWIPE_THRESHOLD = 50; // minimum swipe distance

// Penalty structure for missed foods - scales with difficulty
export const MISS_PENALTIES = {
  tier1: {
    // Warm-up: gentle penalties to learn mechanics
    enemyGetThrough: 8, // stability penalty when enemy food reaches bottom
    allyMissed: 3, // nutrition penalty when ally food misses
    comboBreak: true, // breaks combo
  },
  tier2: {
    // Challenge 1: real consequences
    enemyGetThrough: 15, // stability hits harder
    allyMissed: 5, // more nutrition penalty
    comboBreak: true,
  },
  tier3: {
    // Challenge 2: punishing difficulty
    enemyGetThrough: 25, // severe stability penalty
    allyMissed: 8, // high nutrition penalty
    comboBreak: true,
    metricsAffected: ['energy', 'stability'], // multiple metrics affected
  },
};

// Stability zones
export const STABILITY_ZONES = {
  BALANCED: { min: 40, max: 60, color: '#10b981', name: 'balanced' as StabilityZone },
  WARNING_LOW: { min: 25, max: 39, color: '#f59e0b', name: 'warning-low' as StabilityZone },
  WARNING_HIGH: { min: 61, max: 75, color: '#f59e0b', name: 'warning-high' as StabilityZone },
  CRITICAL_LOW: { min: 0, max: 24, color: '#06b6d4', name: 'critical-low' as StabilityZone },
  CRITICAL_HIGH: { min: 76, max: 100, color: '#ef4444', name: 'critical-high' as StabilityZone },
};

// Fun-first display names for metrics
export const METRIC_LABELS = {
  energy: 'VIGOR',
  hydration: 'PURITY',
  nutrition: 'VITALITY',
  stability: 'HARMONY',
};

// Combo tiers with escalating rewards - rewards skill consistency
export const COMBO_TIERS: ComboTier[] = [
  { count: 3, title: '⚔️ DEFENDER!', multiplier: 1.5, color: '#60a5fa' },
  { count: 5, title: '🛡️ GUARDIAN!', multiplier: 2, color: '#a78bfa' },
  { count: 8, title: '🔥 EXECUTIONER!', multiplier: 2.5, color: '#f59e0b' },
  { count: 12, title: '👑 REALM PROTECTOR!', multiplier: 3.5, color: '#fbbf24' },
  { count: 18, title: '⚡ LEGENDARY!', multiplier: 5, color: '#f97316' },
  { count: 25, title: '🌟 GLUCOSE MASTER!', multiplier: 7, color: '#ec4899' },
];

// Kingdom Lore and Wisdom - Moving from ResultsScroll for DRY
export const KINGDOM_LORE = [
  { id: 'brain', emoji: '🧠', fact: 'The Brain\'s Tribute: It claims 20% of your daily Vigor!', tip: 'Slow-burning grains provide lasting tribute.' },
  { id: 'exercise', emoji: '🏃', fact: 'The Knight\'s March: Moving for 15 mins after a feast lowers the sugar tide for 24 hours!', tip: 'A brisk walk keeps the Harmony stable.' },
  { id: 'fiber', emoji: '🥦', fact: 'The Green Aegis: Fiber from veggies slows the sugar horde by 50%!', tip: 'Lead with the Aegis, then consume the feast.' },
  { id: 'sleep', emoji: '💤', fact: 'The Restorer\'s Dream: Poor sleep makes your body resist the Royal Key (Insulin)!', tip: 'Rest well for 7-9 hours to maintain Harmony.' },
  { id: 'hydration', emoji: '💧', fact: 'The Pure Stream: Dehydration causes the sugar tide to rise!', tip: 'Drink from the Pure Stream (Water) before each feast.' },
  { id: 'breakfast', emoji: '🍳', fact: 'The Morning Shield: A Vitality-rich breakfast guards against spikes all day!', tip: 'Start with Eggs, not sugary cereals.' },
];

// Food definitions - Allies (swipe UP to rally)
// Now with multi-dimensional effects: energy, hydration, nutrition, stability
export const ALLY_FOODS: FoodDefinition[] = [
  // Vegetables - High nutrition, moderate hydration
  { type: 'vegetable', faction: 'ally', name: 'Broccoli Knight', sprite: '🥦', color: '#22c55e', glowColor: '#4ade80', glucoseImpact: 3, basePoints: 10, spawnWeight: 20,
    effects: { energy: 3, hydration: 5, nutrition: 12, stability: 3 } },
  { type: 'vegetable', faction: 'ally', name: 'Carrot Scout', sprite: '🥕', color: '#f97316', glowColor: '#fb923c', glucoseImpact: 2, basePoints: 8, spawnWeight: 18,
    effects: { energy: 4, hydration: 4, nutrition: 10, stability: 2 } },
  { type: 'vegetable', faction: 'ally', name: 'Spinach Sage', sprite: '🥬', color: '#16a34a', glowColor: '#22c55e', glucoseImpact: 2, basePoints: 9, spawnWeight: 15,
    effects: { energy: 5, hydration: 6, nutrition: 15, stability: 2 } },
  { type: 'vegetable', faction: 'ally', name: 'Pepper Paladin', sprite: '🫑', color: '#dc2626', glowColor: '#ef4444', glucoseImpact: 2, basePoints: 8, spawnWeight: 12,
    effects: { energy: 3, hydration: 5, nutrition: 11, stability: 2 } },
  
  // Proteins - High energy sustain, good nutrition
  { type: 'protein', faction: 'ally', name: 'Egg Champion', sprite: '🥚', color: '#fef3c7', glowColor: '#fde68a', glucoseImpact: 4, basePoints: 12, spawnWeight: 15,
    effects: { energy: 10, hydration: 0, nutrition: 12, stability: 4 } },
  { type: 'protein', faction: 'ally', name: 'Fish Warrior', sprite: '🐟', color: '#38bdf8', glowColor: '#7dd3fc', glucoseImpact: 5, basePoints: 15, spawnWeight: 10,
    effects: { energy: 12, hydration: 2, nutrition: 15, stability: 5 } },
  { type: 'protein', faction: 'ally', name: 'Chicken Knight', sprite: '🍗', color: '#d97706', glowColor: '#f59e0b', glucoseImpact: 4, basePoints: 13, spawnWeight: 12,
    effects: { energy: 14, hydration: -2, nutrition: 13, stability: 4 } },
  { type: 'protein', faction: 'ally', name: 'Tofu Monk', sprite: '🧈', color: '#fef9c3', glowColor: '#fef08a', glucoseImpact: 3, basePoints: 10, spawnWeight: 8,
    effects: { energy: 8, hydration: 2, nutrition: 10, stability: 3 } },
  
  // Whole grains - Sustained energy
  { type: 'whole_grain', faction: 'ally', name: 'Bread Paladin', sprite: '🍞', color: '#d97706', glowColor: '#fbbf24', glucoseImpact: 3, basePoints: 10, spawnWeight: 15,
    effects: { energy: 12, hydration: -3, nutrition: 6, stability: 3 },
    timeModifiers: { morning: 1.5, midday: 1.2, afternoon: 0.8, evening: 0.5 } },
  { type: 'whole_grain', faction: 'ally', name: 'Rice Ranger', sprite: '🍚', color: '#f5f5f4', glowColor: '#e7e5e4', glucoseImpact: 3, basePoints: 9, spawnWeight: 12,
    effects: { energy: 10, hydration: -2, nutrition: 5, stability: 3 } },
  { type: 'whole_grain', faction: 'ally', name: 'Oat Oracle', sprite: '🥣', color: '#d4a574', glowColor: '#e7c9a9', glucoseImpact: 4, basePoints: 11, spawnWeight: 10,
    effects: { energy: 14, hydration: 3, nutrition: 8, stability: 5 },
    timeModifiers: { morning: 2.0, midday: 0.8, afternoon: 0.6, evening: 0.4 } },
  
  // Fruits - Quick energy, good hydration
  { type: 'fruit', faction: 'ally', name: 'Apple Archer', sprite: '🍎', color: '#dc2626', glowColor: '#f87171', glucoseImpact: 2, basePoints: 8, spawnWeight: 15,
    effects: { energy: 8, hydration: 8, nutrition: 8, stability: 2 } },
  { type: 'fruit', faction: 'ally', name: 'Banana Bard', sprite: '🍌', color: '#facc15', glowColor: '#fde047', glucoseImpact: 3, basePoints: 9, spawnWeight: 12,
    effects: { energy: 12, hydration: 4, nutrition: 7, stability: 3 } },
  { type: 'fruit', faction: 'ally', name: 'Orange Oracle', sprite: '🍊', color: '#f97316', glowColor: '#fb923c', glucoseImpact: 2, basePoints: 8, spawnWeight: 12,
    effects: { energy: 7, hydration: 10, nutrition: 10, stability: 2 } },
  { type: 'fruit', faction: 'ally', name: 'Berry Battalion', sprite: '🫐', color: '#6366f1', glowColor: '#818cf8', glucoseImpact: 1, basePoints: 10, spawnWeight: 8,
    effects: { energy: 5, hydration: 6, nutrition: 12, stability: 1 } },
  { type: 'fruit', faction: 'ally', name: 'Watermelon Warden', sprite: '🍉', color: '#22c55e', glowColor: '#4ade80', glucoseImpact: 2, basePoints: 8, spawnWeight: 8,
    effects: { energy: 6, hydration: 15, nutrition: 5, stability: 2 } },
  
  // Water & Hydration - Pure hydration
  { type: 'water', faction: 'ally', name: 'Water Spirit', sprite: '💧', color: '#0ea5e9', glowColor: '#38bdf8', glucoseImpact: 1, basePoints: 5, spawnWeight: 20,
    effects: { energy: 2, hydration: 20, nutrition: 0, stability: 2 } },
  { type: 'water', faction: 'ally', name: 'Coconut Cleric', sprite: '🥥', color: '#a3a3a3', glowColor: '#d4d4d4', glucoseImpact: 2, basePoints: 8, spawnWeight: 6,
    effects: { energy: 5, hydration: 18, nutrition: 4, stability: 2 } },
  
  // Dairy - Balanced
  { type: 'dairy', faction: 'ally', name: 'Milk Mage', sprite: '🥛', color: '#f5f5f4', glowColor: '#fafafa', glucoseImpact: 3, basePoints: 8, spawnWeight: 10,
    effects: { energy: 6, hydration: 8, nutrition: 8, stability: 3 } },
  { type: 'dairy', faction: 'ally', name: 'Yogurt Yogi', sprite: '🫙', color: '#fef3c7', glowColor: '#fef9c3', glucoseImpact: 2, basePoints: 9, spawnWeight: 8,
    effects: { energy: 5, hydration: 5, nutrition: 10, stability: 2 } },
  
  // Nuts - High energy, good nutrition
  { type: 'nuts', faction: 'ally', name: 'Almond Assassin', sprite: '🥜', color: '#d97706', glowColor: '#f59e0b', glucoseImpact: 2, basePoints: 10, spawnWeight: 8,
    effects: { energy: 10, hydration: -2, nutrition: 10, stability: 2 } },
  
  // Contextual - Coffee (good in morning, bad at night)
  { type: 'coffee', faction: 'contextual', name: 'Coffee Commander', sprite: '☕', color: '#78350f', glowColor: '#92400e', glucoseImpact: -2, basePoints: 8, spawnWeight: 10,
    effects: { energy: 18, hydration: -8, nutrition: 0, stability: -3 },
    timeModifiers: { morning: 1.5, midday: 1.0, afternoon: 0.5, evening: -1.0 } },
  
  // Tea - Milder than coffee
  { type: 'tea', faction: 'ally', name: 'Tea Templar', sprite: '🍵', color: '#84cc16', glowColor: '#a3e635', glucoseImpact: 1, basePoints: 6, spawnWeight: 8,
    effects: { energy: 8, hydration: 5, nutrition: 2, stability: 2 },
    timeModifiers: { morning: 1.2, midday: 1.0, afternoon: 1.2, evening: 0.8 } },
];

// Food definitions - Enemies (swipe DOWN to banish)
export const ENEMY_FOODS: FoodDefinition[] = [
  // Sugary foods - Energy spike then crash, bad for stability
  { type: 'sugar', faction: 'enemy', name: 'Donut Demon', sprite: '🍩', color: '#ec4899', glowColor: '#f472b6', glucoseImpact: -8, basePoints: 15, spawnWeight: 18,
    effects: { energy: 8, hydration: -5, nutrition: -8, stability: -12 } },
  { type: 'candy', faction: 'enemy', name: 'Candy Curse', sprite: '🍬', color: '#a855f7', glowColor: '#c084fc', glucoseImpact: -10, basePoints: 18, spawnWeight: 15,
    effects: { energy: 10, hydration: -3, nutrition: -10, stability: -15 } },
  { type: 'sugar', faction: 'enemy', name: 'Cake Calamity', sprite: '🍰', color: '#f9a8d4', glowColor: '#fbcfe8', glucoseImpact: -15, basePoints: 25, spawnWeight: 8,
    effects: { energy: 12, hydration: -6, nutrition: -12, stability: -18 } },
  { type: 'candy', faction: 'enemy', name: 'Ice Cream Imp', sprite: '🍦', color: '#fef3c7', glowColor: '#fef9c3', glucoseImpact: -9, basePoints: 16, spawnWeight: 10,
    effects: { energy: 8, hydration: -4, nutrition: -8, stability: -12 } },
  { type: 'sugar', faction: 'enemy', name: 'Cookie Chaos', sprite: '🍪', color: '#d97706', glowColor: '#f59e0b', glucoseImpact: -7, basePoints: 12, spawnWeight: 15,
    effects: { energy: 7, hydration: -4, nutrition: -6, stability: -10 } },
  { type: 'candy', faction: 'enemy', name: 'Chocolate Chimera', sprite: '🍫', color: '#78350f', glowColor: '#92400e', glucoseImpact: -8, basePoints: 14, spawnWeight: 12,
    effects: { energy: 9, hydration: -3, nutrition: -5, stability: -11 } },
  
  // Sodas & Drinks - Dehydrating, sugar bombs
  { type: 'soda', faction: 'enemy', name: 'Soda Specter', sprite: '🥤', color: '#ef4444', glowColor: '#f87171', glucoseImpact: -12, basePoints: 20, spawnWeight: 15,
    effects: { energy: 12, hydration: -12, nutrition: -5, stability: -15 } },
  { type: 'energy_drink', faction: 'enemy', name: 'Energy Elemental', sprite: '🧃', color: '#22d3ee', glowColor: '#67e8f9', glucoseImpact: -10, basePoints: 18, spawnWeight: 10,
    effects: { energy: 20, hydration: -10, nutrition: -8, stability: -12 },
    timeModifiers: { morning: 0.8, midday: 1.0, afternoon: 1.2, evening: 1.5 } },
  
  // Processed foods - Low nutrition, moderate energy
  { type: 'processed', faction: 'enemy', name: 'Chip Chaos', sprite: '🍟', color: '#eab308', glowColor: '#facc15', glucoseImpact: -6, basePoints: 12, spawnWeight: 18,
    effects: { energy: 6, hydration: -8, nutrition: -10, stability: -8 } },
  { type: 'fast_food', faction: 'enemy', name: 'Burger Beast', sprite: '🍔', color: '#b45309', glowColor: '#d97706', glucoseImpact: -7, basePoints: 14, spawnWeight: 15,
    effects: { energy: 10, hydration: -6, nutrition: -8, stability: -10 } },
  { type: 'fast_food', faction: 'enemy', name: 'Pizza Phantom', sprite: '🍕', color: '#dc2626', glowColor: '#ef4444', glucoseImpact: -6, basePoints: 13, spawnWeight: 15,
    effects: { energy: 9, hydration: -5, nutrition: -7, stability: -8 } },
  { type: 'fast_food', faction: 'enemy', name: 'Hotdog Horror', sprite: '🌭', color: '#f97316', glowColor: '#fb923c', glucoseImpact: -5, basePoints: 11, spawnWeight: 12,
    effects: { energy: 7, hydration: -6, nutrition: -9, stability: -7 } },
  { type: 'processed', faction: 'enemy', name: 'Pretzel Poltergeist', sprite: '🥨', color: '#d97706', glowColor: '#f59e0b', glucoseImpact: -4, basePoints: 10, spawnWeight: 10,
    effects: { energy: 5, hydration: -8, nutrition: -5, stability: -6 } },
  
  // Alcohol - Dehydrating, affects all metrics
  { type: 'alcohol', faction: 'enemy', name: 'Beer Banshee', sprite: '🍺', color: '#fbbf24', glowColor: '#fcd34d', glucoseImpact: -8, basePoints: 16, spawnWeight: 8,
    effects: { energy: -5, hydration: -15, nutrition: -5, stability: -10 },
    timeModifiers: { morning: 1.5, midday: 1.2, afternoon: 1.0, evening: 0.8 } },
  { type: 'alcohol', faction: 'enemy', name: 'Wine Wraith', sprite: '🍷', color: '#7c2d12', glowColor: '#9a3412', glucoseImpact: -6, basePoints: 14, spawnWeight: 6,
    effects: { energy: -3, hydration: -12, nutrition: -3, stability: -8 } },
];

export const ALL_FOODS = [...ALLY_FOODS, ...ENEMY_FOODS];

// ============================================
// LIFE MODE CONFIGURATIONS
// ============================================

// Time phases (60 seconds = 1 day)
export const TIME_PHASES: Record<TimePhase, { start: number; end: number; name: string; icon: string; description: string }> = {
  morning: { start: 60, end: 46, name: 'Morning', icon: '🌅', description: 'Breakfast time - fuel up!' },
  midday: { start: 45, end: 31, name: 'Midday', icon: '☀️', description: 'Lunch hour - stay balanced' },
  afternoon: { start: 30, end: 16, name: 'Afternoon', icon: '🌆', description: 'Energy dip - smart snacking' },
  evening: { start: 15, end: 0, name: 'Evening', icon: '🌙', description: 'Wind down - light foods' },
};

// Morning conditions that affect the whole day
export const MORNING_CONDITIONS: MorningConditionConfig[] = [
  {
    id: 'well_rested',
    name: 'Well Rested',
    icon: '😴',
    description: 'Great sleep! +10% energy capacity',
    metricModifiers: { energy: 60, hydration: 50, nutrition: 50, stability: 55 },
    needsMultipliers: { energy: 0.8, hydration: 1.0, nutrition: 1.0, stability: 1.0 },
    preferredFoods: [],
    avoidFoods: [],
  },
  {
    id: 'poor_sleep',
    name: 'Poor Sleep',
    icon: '😫',
    description: 'Tired... need caffeine & easy foods',
    metricModifiers: { energy: 30, hydration: 45, nutrition: 50, stability: 45 },
    needsMultipliers: { energy: 1.5, hydration: 1.2, nutrition: 1.0, stability: 1.2 },
    preferredFoods: ['coffee', 'tea', 'fruit'],
    avoidFoods: ['alcohol'],
  },
  {
    id: 'sick_day',
    name: 'Sick Day',
    icon: '🤒',
    description: 'Under the weather - hydration critical!',
    metricModifiers: { energy: 35, hydration: 35, nutrition: 45, stability: 45 },
    needsMultipliers: { energy: 1.2, hydration: 2.0, nutrition: 1.3, stability: 1.0 },
    preferredFoods: ['water', 'tea', 'fruit'],
    avoidFoods: ['processed', 'fast_food', 'alcohol', 'coffee'],
  },
  {
    id: 'marathon_day',
    name: 'Marathon Day',
    icon: '🏃',
    description: 'Big workout ahead - carbs & hydration!',
    metricModifiers: { energy: 45, hydration: 40, nutrition: 50, stability: 50 },
    needsMultipliers: { energy: 1.8, hydration: 1.8, nutrition: 1.2, stability: 1.0 },
    preferredFoods: ['whole_grain', 'fruit', 'water', 'protein'],
    avoidFoods: ['alcohol', 'fast_food'],
  },
  {
    id: 'stressed',
    name: 'Stressed Out',
    icon: '😰',
    description: 'High stress - avoid stimulants!',
    metricModifiers: { energy: 55, hydration: 45, nutrition: 45, stability: 40 },
    needsMultipliers: { energy: 1.0, hydration: 1.3, nutrition: 1.2, stability: 1.5 },
    preferredFoods: ['tea', 'vegetable', 'nuts'],
    avoidFoods: ['coffee', 'energy_drink', 'sugar', 'candy'],
  },
  {
    id: 'recovery_day',
    name: 'Recovery Day',
    icon: '💪',
    description: 'Post-workout - protein priority!',
    metricModifiers: { energy: 40, hydration: 40, nutrition: 45, stability: 50 },
    needsMultipliers: { energy: 1.3, hydration: 1.5, nutrition: 1.5, stability: 1.0 },
    preferredFoods: ['protein', 'water', 'fruit', 'dairy'],
    avoidFoods: ['alcohol', 'processed'],
  },
  {
    id: 'normal_day',
    name: 'Normal Day',
    icon: '😊',
    description: 'A regular day - stay balanced!',
    metricModifiers: { energy: 50, hydration: 50, nutrition: 50, stability: 50 },
    needsMultipliers: { energy: 1.0, hydration: 1.0, nutrition: 1.0, stability: 1.0 },
    preferredFoods: [],
    avoidFoods: [],
  },
];

// Mode-specific plot twist events (1-2 per game)
export const MODE_PLOT_TWISTS: Record<UserMode, PlotTwist[]> = {
  personal: [
    {
      id: 'surprise_meeting',
      name: 'Surprise Meeting!',
      icon: '📅',
      description: 'Quick energy needed NOW!',
      duration: 8,
      effect: { energy: -15 },
      bonusCondition: 'Rally high-energy foods for 2x points!',
      optimalActions: ['consume'],
    },
    {
      id: 'stomach_bug',
      name: 'Stomach Bug!',
      icon: '🤢',
      description: 'Avoid heavy foods, need hydration!',
      duration: 10,
      effect: { nutrition: -10, hydration: -10 },
      ongoingEffect: { hydration: -2 },
      bonusCondition: 'Water & light foods give 2x points!',
      optimalActions: ['consume', 'reject'],
    },
    {
      id: 'heat_wave',
      name: 'Heat Wave!',
      icon: '🥵',
      description: 'Double hydration drain!',
      duration: 10,
      effect: { hydration: -15 },
      ongoingEffect: { hydration: -3 },
      bonusCondition: 'Hydrating foods give 2x points!',
      optimalActions: ['consume'],
    },
    {
      id: 'sugar_crash',
      name: 'Sugar Crash!',
      icon: '📉',
      description: 'Stability dropping - need protein!',
      duration: 8,
      effect: { stability: -20, energy: -10 },
      bonusCondition: 'Protein foods give 2x points!',
      optimalActions: ['consume', 'save'],
    },
    {
      id: 'workout_opportunity',
      name: 'Workout Time!',
      icon: '🏋️',
      description: 'Bonus if energy is high!',
      duration: 6,
      effect: {},
      bonusCondition: 'If energy > 60, earn 3x points!',
      optimalActions: ['consume'],
    },
    {
      id: 'stressful_call',
      name: 'Stressful Call!',
      icon: '📞',
      description: 'Cortisol spiking = glucose rises without eating.',
      duration: 8,
      effect: { stability: -15 },
      ongoingEffect: { stability: -1 },
      bonusCondition: 'Cortisol raises glucose without food. You need more insulin or activity!',
      optimalActions: ['consume', 'reject'],
    },
    {
      id: 'afternoon_slump',
      name: 'Afternoon Slump!',
      icon: '😴',
      description: 'Energy crashing - time for a smart snack!',
      duration: 8,
      effect: { energy: -20 },
      ongoingEffect: { energy: -2 },
      bonusCondition: 'Pair carbs with protein for stable energy.',
      optimalActions: ['consume', 'save'],
    },
    {
      id: 'late_night_urge',
      name: 'Late Night Urge!',
      icon: '🌙',
      description: 'Craving sugar late - resist for better morning glucose!',
      duration: 6,
      effect: { stability: -10 },
      bonusCondition: 'Avoid sugary foods for stable overnight glucose!',
      optimalActions: ['reject'],
    },
    {
      id: 'sleep_debt',
      name: 'Sleep Debt!',
      icon: '😴',
      description: 'Poor sleep = more glucose swings. Manage carefully!',
      duration: 10,
      effect: { energy: -10, stability: -10 },
      ongoingEffect: { stability: -1 },
      bonusCondition: 'Focus on protein and fiber to manage sleep-deprived glucose!',
      optimalActions: ['consume'],
    },
    {
      id: 'work_stress',
      name: 'Work Stress!',
      icon: '💼',
      description: 'High stress raising your glucose - take care!',
      duration: 8,
      effect: { stability: -12 },
      ongoingEffect: { stability: -1 },
      bonusCondition: 'Stress raises glucose without eating. Focus on calming foods!',
      optimalActions: ['consume', 'reject'],
    },
    {
      id: 'royal_pantry_audit',
      name: 'Pantry Audit!',
      icon: '🏺',
      description: 'The King demands the Royal Pantry be filled!',
      duration: 12,
      effect: {},
      bonusCondition: 'Saving foods (Swipe LEFT) gives 3x points!',
      optimalActions: ['save'],
      shareBonus: true,
    },
    {
      id: 'community_feast',
      name: 'Community Feast!',
      icon: '🤝',
      description: 'Sharing is caring in our kingdom!',
      duration: 12,
      effect: {},
      bonusCondition: 'Sharing foods (Swipe RIGHT) gives 4x points!',
      optimalActions: ['share'],
      shareBonus: true,
    },
  ],
  caregiver: [
    {
      id: 'school_day_event',
      name: 'School Day!',
      icon: '📚',
      description: 'School stress + schedule = unpredictable glucose!',
      duration: 10,
      effect: { stability: -15 },
      ongoingEffect: { stability: -1 },
      bonusCondition: 'This is why they check blood sugar often.',
      optimalActions: ['consume', 'reject', 'save'],
    },
    {
      id: 'sick_day_event',
      name: 'Sick Day!',
      icon: '🤒',
      description: 'Illness makes glucose management harder!',
      duration: 12,
      effect: { nutrition: -10, hydration: -15 },
      ongoingEffect: { stability: -2, hydration: -2 },
      bonusCondition: 'Sickness raises glucose. They need more insulin/medication!',
      optimalActions: ['consume', 'reject'],
    },
    {
      id: 'sports_day_event',
      name: 'Sports Day!',
      icon: '⚽',
      description: 'Exercise + timing = complex glucose changes!',
      duration: 8,
      effect: { energy: -15, stability: -10 },
      bonusCondition: 'Exercise affects glucose differently. They need to plan!',
      optimalActions: ['consume', 'save'],
    },
    {
      id: 'travel_day_event',
      name: 'Travel Day!',
      icon: '✈️',
      description: 'Different time, food, stress = glucose complexity!',
      duration: 10,
      effect: { energy: -10, hydration: -15 },
      ongoingEffect: { stability: -1 },
      bonusCondition: 'This is why they need more flexibility during travel!',
      optimalActions: ['consume', 'save', 'share'],
    },
    {
      id: 'birthday_party_event',
      name: 'Birthday Party!',
      icon: '🎂',
      description: 'Many treats and excitement - support their choices!',
      duration: 8,
      effect: { stability: -20 },
      bonusCondition: 'They may need extra insulin for the celebration!',
      optimalActions: ['consume', 'reject', 'share'],
    },
    {
      id: 'medication_event',
      name: 'Medication Time!',
      icon: '💊',
      description: 'Time for their routine - keep them consistent!',
      duration: 6,
      effect: { stability: -5 },
      bonusCondition: 'This is their daily management routine!',
      optimalActions: ['consume', 'reject'],
    },
    {
      id: 'bedtime_event',
      name: 'Bedtime!',
      icon: '🌙',
      description: 'Prep for overnight glucose - important time!',
      duration: 6,
      effect: { energy: -5 },
      bonusCondition: 'They need to plan for stable overnight glucose!',
      optimalActions: ['consume', 'save'],
    },
    {
      id: 'hypo_event',
      name: 'Low Glucose!',
      icon: '📉',
      description: 'They need quick carbs - help them respond!',
      duration: 6,
      effect: { stability: -25 },
      bonusCondition: 'Quick carbs needed! This is when they need glucose tablets!',
      optimalActions: ['consume'],
    },
    {
      id: 'hyper_event',
      name: 'High Glucose!',
      icon: '📈',
      description: 'Their glucose is elevated - insulin needed!',
      duration: 10,
      effect: { stability: 20 },
      ongoingEffect: { stability: 1 },
      bonusCondition: 'They may need insulin to bring glucose down!',
      optimalActions: ['reject'],
    },
    {
      id: 'insulin_event',
      name: 'Insulin Timing!',
      icon: '💉',
      description: 'Their insulin is working - timing matters!',
      duration: 8,
      effect: { stability: -10 },
      ongoingEffect: { stability: -1 },
      bonusCondition: 'Their insulin works 15 mins later - that\'s why timing matters!',
      optimalActions: ['consume', 'save'],
    },
  ],
  curious: [
    {
      id: 'learning_opportunity1',
      name: 'Insulin Lesson!',
      icon: '🎓',
      description: 'Insulin helps cells use glucose for energy.',
      duration: 8,
      effect: { stability: -5 },
      bonusCondition: 'Without insulin, glucose stays in bloodstream!',
      optimalActions: ['consume', 'reject'],
    },
    {
      id: 'learning_opportunity2',
      name: 'Glucose Lesson!',
      icon: '🎓',
      description: 'Glucose = fuel for your body\'s cells.',
      duration: 8,
      effect: { energy: -5 },
      bonusCondition: 'Cells need glucose + insulin to make energy!',
      optimalActions: ['consume'],
    },
    {
      id: 'learning_opportunity3',
      name: 'Carb Timing!',
      icon: '🎓',
      description: 'Eating carbs with protein/fat slows glucose rise.',
      duration: 8,
      effect: { stability: -5 },
      bonusCondition: 'This is glycemic load in action!',
      optimalActions: ['consume', 'save'],
    },
    {
      id: 'learning_opportunity4',
      name: 'Stress Response!',
      icon: '🎓',
      description: 'Stress hormones raise glucose without eating.',
      duration: 8,
      effect: { stability: -10 },
      ongoingEffect: { stability: -1 },
      bonusCondition: 'Cortisol and adrenaline raise blood sugar!',
      optimalActions: ['consume', 'reject'],
    },
    {
      id: 'learning_opportunity5',
      name: 'Exercise Impact!',
      icon: '🎓',
      description: 'Exercise helps cells use glucose without insulin.',
      duration: 8,
      effect: { energy: -10 },
      bonusCondition: 'Muscles can take up glucose during exercise!',
      optimalActions: ['consume'],
    },
    {
      id: 'learning_opportunity6',
      name: 'Sleep Connection!',
      icon: '🎓',
      description: 'Sleep affects insulin sensitivity.',
      duration: 8,
      effect: { energy: -5, stability: -5 },
      bonusCondition: 'Poor sleep = higher glucose! Sleep is metabolic health!',
      optimalActions: ['consume', 'reject'],
    },
    {
      id: 'learning_opportunity7',
      name: 'Fiber Benefits!',
      icon: '🎓',
      description: 'Fiber slows glucose absorption by 50%.',
      duration: 8,
      effect: { stability: -5 },
      bonusCondition: 'This is why whole foods beat juices!',
      optimalActions: ['consume'],
    },
    {
      id: 'learning_opportunity8',
      name: 'Hydration Impact!',
      icon: '🎓',
      description: 'Dehydration can raise glucose concentration.',
      duration: 8,
      effect: { hydration: -10 },
      bonusCondition: 'Water helps maintain glucose balance!',
      optimalActions: ['consume'],
    },
    {
      id: 'learning_opportunity9',
      name: 'Hormone Changes!',
      icon: '🎓',
      description: 'Hormones affect glucose throughout the day.',
      duration: 8,
      effect: { stability: -10 },
      ongoingEffect: { stability: -1 },
      bonusCondition: 'Cortisol, adrenaline, growth hormone all impact glucose!',
      optimalActions: ['consume', 'reject'],
    },
    {
      id: 'learning_opportunity10',
      name: 'Individual Response!',
      icon: '🎓',
      description: 'Everyone responds differently to foods!',
      duration: 8,
      effect: {},
      bonusCondition: 'Personal glucose responses vary widely!',
      optimalActions: ['consume', 'reject', 'save'],
    },
  ],
};

// Backward compatibility - use personal mode plot twists as default
export const PLOT_TWISTS: PlotTwist[] = MODE_PLOT_TWISTS.personal;

// Initial metrics for Life Mode
export const INITIAL_METRICS = {
  energy: 50,
  hydration: 50,
  nutrition: 50,
  stability: 50,
};

// Metric drain rates per second (Life Mode)
export const METRIC_DRAIN_RATES = {
  energy: 0.8,
  hydration: 0.6,
  nutrition: 0.4,
  stability: 0.3,
};

// Narrator announcements - expanded with variety, jokes, and educational content
export const ANNOUNCEMENTS = {
  GAME_START: ['⚔️ DEFEND THE REALM!', '🏰 THE BATTLE BEGINS!', '🛡️ PROTECT YOUR KINGDOM!'],
  LIFE_MODE_START: ['🌅 A NEW DAY BEGINS!', '☀️ SURVIVE THE DAY!', '🏰 24 HOURS OF BATTLE!'],
  FINAL_WAVE: ['⚠️ FINAL WAVE INCOMING!', '🔥 LAST STAND!', '💀 SURVIVE THE ONSLAUGHT!', '⏰ THE CLOCK STRIKES!'],
  COMBO_3: ['⚔️ NICE COMBO!', '🎯 WELL DONE!', '💪 TRIPLE THREAT!'],
  COMBO_5: ['🛡️ IMPRESSIVE!', '💪 KEEP IT UP!', '🔥 ON FIRE!'],
  COMBO_10: ['👑 INCREDIBLE!', '🔥 UNSTOPPABLE!', '⚡ METABOLIC MASTER!'],
  COMBO_15: ['⭐ LEGENDARY!', '🌟 AMAZING!', '👑 ROYAL PERFORMANCE!'],
  COMBO_20: ['🏆 GLUCOSE MASTER!', '👑 SUPREME DEFENDER!', '🌟 INSULIN WHISPERER!'],
  WRONG_SWIPE: ['❌ WRONG DIRECTION!', '⚠️ WATCH YOUR SWIPE!', '💥 THAT WAS AN ALLY!', '🤦 Oops! Wrong food!'],
  COMBO_BREAK: ['💔 COMBO BROKEN!', '⚠️ MISSED ONE!', '🔄 START OVER!', '⏸️ Streak lost!'],
  CRITICAL_HIGH: ['🔥 GLUCOSE SPIKE!', '⚠️ TOO HIGH!', '🌋 DANGER ZONE!', '📈 Sugar overload!'],
  CRITICAL_LOW: ['❄️ GLUCOSE CRASH!', '⚠️ TOO LOW!', '🥶 DANGER ZONE!', '📉 Need fuel!'],
  ENEMY_WAVE: ['👹 SUGAR HORDE APPROACHES!', '🍩 DONUT DYNASTY SPOTTED!', '🍬 CANDY INVASION!', '🧁 Cupcake cavalry incoming!'],
  ALLY_WAVE: ['🥦 REINFORCEMENTS ARRIVE!', '🛡️ ALLIES INCOMING!', '💪 HEALTHY BATTALION!', '🥗 Salad squad deployed!'],
  EXERCISE_USED: ['🏃 EXERCISE ACTIVATED!', '💪 BURNING GLUCOSE!', '🏋️ Knights are training!'],
  RATIONS_USED: ['🍽️ EMERGENCY RATIONS!', '🥗 QUICK SNACK!', '🍖 Royal feast served!'],
  // Life Mode specific
  PHASE_MORNING: ['🌅 MORNING BEGINS!', '☀️ RISE AND SHINE!', '🐓 The rooster crows!'],
  PHASE_MIDDAY: ['☀️ MIDDAY ARRIVES!', '🍽️ LUNCH TIME!', '🌞 Peak sun, peak hunger!'],
  PHASE_AFTERNOON: ['🌆 AFTERNOON SLUMP!', '⚡ ENERGY DIP INCOMING!', '😴 The 3pm wall approaches!'],
  PHASE_EVENING: ['🌙 EVENING APPROACHES!', '🌃 WIND DOWN TIME!', '🦉 Night owls beware!'],
  ENERGY_LOW: ['⚡ ENERGY CRITICAL!', '😴 RUNNING ON EMPTY!', '🔋 Recharge needed!'],
  HYDRATION_LOW: ['💧 DEHYDRATION WARNING!', '🏜️ NEED WATER!', '🐪 Even camels drink!'],
  NUTRITION_LOW: ['🥗 NUTRITION DEPLETED!', '🍎 EAT YOUR VEGGIES!', '🥦 Broccoli misses you!'],
  PLOT_TWIST: ['⚡ PLOT TWIST!', '🎭 UNEXPECTED EVENT!', '🎲 Fate intervenes!'],
  // Food jokes and puns
  FOOD_JOKES: [
    '🥦 Broccoli: "I\'m kind of a big dill!"',
    '🍩 Donut worry, be happy!',
    '🥕 Carrot: "Orange you glad to see me?"',
    '🍕 Pizza my heart!',
    '🥚 Egg-cellent choice!',
    '🍌 This game is bananas!',
    '🧀 That was grate!',
    '🍇 You\'re grape at this!',
    '🥜 You\'re nuts! (in a good way)',
    '🍎 An apple a day keeps the doctor away!',
    '🥑 Holy guacamole!',
    '🍋 When life gives you lemons...',
  ],
  // Educational glucose facts
  GLUCOSE_FACTS: [
    '💡 Fiber slows glucose absorption!',
    '💡 Protein helps stabilize blood sugar!',
    '💡 Walking after meals helps glucose!',
    '💡 Sleep affects insulin sensitivity!',
    '💡 Stress raises blood sugar levels!',
    '💡 Hydration helps glucose regulation!',
    '💡 Eating veggies first helps!',
    '💡 Complex carbs = steady energy!',
    '💡 Your brain uses 20% of glucose!',
    '💡 Muscles store glucose as glycogen!',
  ],
  // Encouragement messages
  ENCOURAGEMENT: [
    '🌟 You\'re doing amazing!',
    '💪 Keep up the great work!',
    '🎯 Perfect timing!',
    '👑 Royal performance!',
    '⚡ Lightning reflexes!',
    '🏆 Champion material!',
    '🔥 You\'re on fire!',
    '✨ Spectacular!',
  ],
};

// Special game modes triggered by player behavior
export const SPECIAL_MODES = {
  SUGAR_RUSH: {
    id: 'sugar_rush',
    name: '🍬 SUGAR RUSH!',
    trigger: 'too_many_sugars', // 5+ sugars consumed
    duration: 8,
    description: 'Everything speeds up! Stability dropping fast!',
    effects: {
      speedMultiplier: 1.8,
      stabilityDecay: 3,
      spawnRate: 0.6,
    },
    backdropEffect: 'psychedelic',
    announcements: ['🍬 SUGAR RUSH ACTIVATED!', '🌀 Everything\'s spinning!', '⚡ TOO MUCH SUGAR!'],
  },
  JUICE_CLEANSE: {
    id: 'juice_cleanse',
    name: '🥤 JUICE CLEANSE!',
    trigger: 'too_many_fruits', // 5+ fruits in a row
    duration: 6,
    description: 'Only fruits and veggies spawn! Hydration boost!',
    effects: {
      speedMultiplier: 0.8,
      hydrationBoost: 2,
      onlyHealthySpawns: true,
    },
    backdropEffect: 'green_glow',
    announcements: ['🥤 JUICE CLEANSE MODE!', '🥬 Detox activated!', '💚 Green power!'],
  },
  PROTEIN_POWER: {
    id: 'protein_power',
    name: '💪 PROTEIN POWER!',
    trigger: 'protein_streak', // 4+ proteins in a row
    duration: 8,
    description: 'Proteins give 2x points! Energy surge!',
    effects: {
      proteinMultiplier: 2,
      energyBoost: 1.5,
    },
    backdropEffect: 'muscle_glow',
    announcements: ['💪 PROTEIN POWER!', '🏋️ Gains incoming!', '🥩 Meat the challenge!'],
  },
  CARB_CRASH: {
    id: 'carb_crash',
    name: '🍞 CARB CRASH!',
    trigger: 'too_many_carbs', // 5+ carbs consumed
    duration: 6,
    description: 'Slow down! Energy dropping!',
    effects: {
      speedMultiplier: 0.6,
      energyDecay: 2,
    },
    backdropEffect: 'sleepy',
    announcements: ['🍞 CARB CRASH!', '😴 Food coma incoming!', '💤 So... sleepy...'],
  },
  HYDRATION_HERO: {
    id: 'hydration_hero',
    name: '💧 HYDRATION HERO!',
    trigger: 'water_streak', // 3+ waters in a row
    duration: 8,
    description: 'All effects boosted! Crystal clear!',
    effects: {
      allEffectsMultiplier: 1.3,
      clarityBonus: true,
    },
    backdropEffect: 'water_shimmer',
    announcements: ['💧 HYDRATION HERO!', '🌊 Crystal clear!', '💦 Splash zone!'],
  },
  FASTING_MODE: {
    id: 'fasting_mode',
    name: '⏰ FASTING MODE!',
    trigger: 'no_food_eaten', // 10 seconds without eating
    duration: 5,
    description: 'Bonus points for rejecting food!',
    effects: {
      rejectBonus: 2,
      stabilityNormalize: true,
    },
    backdropEffect: 'zen',
    announcements: ['⏰ FASTING MODE!', '🧘 Inner peace...', '✨ Autophagy activated!'],
  },
};

// Time-based speed modifiers
export const TIME_SPEED_MODIFIERS = {
  morning: { speedMultiplier: 0.9, spawnRate: 1.0, description: 'Slow start to the day' },
  midday: { speedMultiplier: 1.2, spawnRate: 1.3, description: 'Peak activity!' },
  afternoon: { speedMultiplier: 1.0, spawnRate: 1.1, description: 'Steady pace' },
  evening: { speedMultiplier: 0.8, spawnRate: 0.9, description: 'Winding down' },
};

// Floating message positions (for variety)
export const MESSAGE_POSITIONS = [
  { x: 'center', y: 'top' },
  { x: 'left', y: 'middle' },
  { x: 'right', y: 'middle' },
  { x: 'center', y: 'bottom' },
  { x: 'left', y: 'top' },
  { x: 'right', y: 'top' },
];

// Tutorial steps - Classic Mode
export const TUTORIAL_STEPS = [
  { text: '👆 SWIPE UP on healthy foods to RALLY allies!', highlight: 'ally' },
  { text: '👇 SWIPE DOWN on junk food to BANISH enemies!', highlight: 'enemy' },
  { text: '⚖️ Keep your REALM STABILITY balanced!', highlight: 'meter' },
  { text: '⚡ Chain correct swipes for COMBO bonuses!', highlight: 'combo' },
];

// Tutorial steps - Life Mode (4-Direction)
export const LIFE_MODE_TUTORIAL_STEPS = [
  { text: '🌅 60 seconds = 1 full day! Morning → Evening', highlight: 'time' },
  { text: '⚡💧🥗💓 Balance 4 metrics: Energy, Hydration, Nutrition, Stability', highlight: 'metrics' },
  { text: '👆 UP = Consume Now | 👇 DOWN = Reject', highlight: 'swipe_vertical' },
  { text: '👈 LEFT = Save for Later | 👉 RIGHT = Share', highlight: 'swipe_horizontal' },
  { text: '🎭 Watch for PLOT TWISTS that change optimal swipes!', highlight: 'twist' },
  { text: '🤝 Sharing builds your Social meter for bonuses!', highlight: 'social' },
];

// 4-Direction Swipe Configuration
export const SWIPE_DIRECTIONS = {
  UP: { action: 'consume' as const, label: 'Consume Now', icon: '👆', color: '#22c55e' },
  DOWN: { action: 'reject' as const, label: 'Reject', icon: '👇', color: '#ef4444' },
  LEFT: { action: 'save' as const, label: 'Save for Later', icon: '👈', color: '#3b82f6' },
  RIGHT: { action: 'share' as const, label: 'Share', icon: '👉', color: '#f59e0b' },
};

// Saved food slots configuration
export const SAVED_FOOD_CONFIG = {
  MAX_SLOTS: 3,
  DECAY_TIME: 20000, // Saved foods decay after 20 seconds
};

// Social meter configuration
export const SOCIAL_CONFIG = {
  SHARE_POINTS: 15, // Base points for sharing
  STREAK_BONUS: 5, // Additional points per streak
  METER_GAIN: 10, // Social meter gain per share
  METER_DECAY: 2, // Social meter decay per second
  HIGH_SOCIAL_THRESHOLD: 70, // Above this, get bonus multiplier
  HIGH_SOCIAL_MULTIPLIER: 1.5,
};

// Shareable moment templates
export const SHAREABLE_MOMENT_TEMPLATES = {
  combo_milestone: {
    titles: ['🔥 COMBO MASTER!', '⚡ UNSTOPPABLE!', '👑 LEGENDARY STREAK!'],
    descriptions: ['Hit a {count}x combo in Glucose Wars!', 'Achieved {count} consecutive perfect swipes!'],
  },
  perfect_day: {
    titles: ['✨ PERFECT DAY!', '🏆 FLAWLESS VICTORY!', '⭐ METABOLIC MASTER!'],
    descriptions: ['Survived a full day with perfect balance!', 'All metrics stayed optimal!'],
  },
  survived_event: {
    titles: ['💪 SURVIVED {event}!', '🛡️ WEATHERED THE STORM!'],
    descriptions: ['Made it through {event} without crashing!', 'Conquered the {event} challenge!'],
  },
  epic_save: {
    titles: ['🎯 CLUTCH SAVE!', '⚡ LAST SECOND HERO!'],
    descriptions: ['Saved the day with a perfectly timed {food}!', 'Used saved {food} at the perfect moment!'],
  },
  social_streak: {
    titles: ['🤝 SOCIAL BUTTERFLY!', '🎉 SHARING IS CARING!'],
    descriptions: ['Shared {count} foods in a row!', 'Built a {count}x social streak!'],
  },
};

// Power-up configuration
export const POWER_UPS = {
  EXERCISE: {
    name: 'Call to Exercise',
    icon: '⚔️',
    maxCharges: 3,
    stabilityChange: -25, // Lowers stability (good when too high)
    cooldown: 5000,
  },
  RATIONS: {
    name: 'Emergency Rations',
    icon: '🍽️',
    maxCharges: 3,
    stabilityChange: 15, // Raises stability (good when too low)
    cooldown: 5000,
  },
};

// Spawn configuration
export const SPAWN_CONFIG = {
  INITIAL_INTERVAL: 1500, // ms between spawns
  MIN_INTERVAL: 600, // fastest spawn rate
  INTERVAL_DECREASE: 50, // decrease per 10 seconds
  FOODS_PER_SPAWN: 1,
  MAX_FOODS_ON_SCREEN: 8,
  ALLY_SPAWN_CHANCE: 0.55, // 55% allies, 45% enemies
};

// Legacy exports for compatibility
export const GLUCOSE_TYPES = [
  { type: 'healthy' as const, color: '#10b981', glowColor: '#34d399', glucoseImpact: 3, basePoints: 10, spawnChance: 0.5 },
  { type: 'spike' as const, color: '#ef4444', glowColor: '#f87171', glucoseImpact: -8, basePoints: 5, spawnChance: 0.35 },
  { type: 'bonus' as const, color: '#fbbf24', glowColor: '#fcd34d', glucoseImpact: 5, basePoints: 25, spawnChance: 0.15 },
];

export const GLUCOSE_ZONES = STABILITY_ZONES;
export const INITIAL_GLUCOSE = INITIAL_STABILITY;
export const PATH_EXTEND_INTERVAL = 1000;
export const MAX_PATH_LENGTH = 8;

export interface GlucoseDefinition {
  type: 'healthy' | 'spike' | 'bonus';
  color: string;
  glowColor: string;
  glucoseImpact: number;
  basePoints: number;
  spawnChance: number;
}

export const FOOD_DEFINITIONS = ALL_FOODS;
