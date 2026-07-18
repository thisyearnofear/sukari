export type FoodFaction = 'ally' | 'enemy' | 'contextual'; // contextual = depends on time/needs
export type FoodType = 
  | 'vegetable' | 'protein' | 'whole_grain' | 'fruit' | 'water' | 'dairy' | 'nuts' | 'coffee' | 'tea'  // Generally Allies
  | 'sugar' | 'processed' | 'soda' | 'candy' | 'fast_food' | 'alcohol' | 'energy_drink' | 'snack';       // Generally Enemies

// 4-direction swipe system
export type SwipeDirection = 'up' | 'down' | 'left' | 'right';
export type SwipeAction = 'consume' | 'reject' | 'save' | 'share';

// Food category for sharing/social mechanics
export type FoodCategory = 'shareable' | 'personal' | 'hydration' | 'energy' | 'comfort';

// Multi-dimensional food effects
export interface FoodEffects {
  energy: number;      // -20 to +20
  hydration: number;   // -20 to +20
  nutrition: number;   // -20 to +20
  stability: number;   // -20 to +20 (blood sugar)
}

// Optimal swipe direction based on context
export interface OptimalSwipe {
  direction: SwipeDirection;
  reason: string;
  multiplier: number; // Bonus for choosing optimal direction
}

export interface FoodUnit {
  id: string;
  type: FoodType;
  faction: FoodFaction;
  name: string;
  sprite: string;
  x: number;
  y: number;
  targetY: number;
  speed: number;
  points: number;
  glucoseImpact: number;
  effects: FoodEffects;
  isBeingDragged: boolean;
  swipeDirection: SwipeDirection | null;
  opacity: number;
  scale: number;
  isContextuallyGood?: boolean; // Determined at spawn based on current needs
  category?: FoodCategory; // For sharing mechanics
  optimalSwipe?: OptimalSwipe; // Calculated based on current game state
}

// Body metrics system
export interface BodyMetrics {
  energy: number;      // 0-100, 50 is balanced
  hydration: number;   // 0-100, 50 is balanced
  nutrition: number;   // 0-100, 50 is balanced
  stability: number;   // 0-100, 50 is balanced (blood sugar)
}

// Time of day phases
export type TimePhase = 'morning' | 'midday' | 'afternoon' | 'evening';

// Morning conditions that affect the whole day
export type MorningCondition = 
  | 'well_rested' 
  | 'poor_sleep' 
  | 'sick_day' 
  | 'marathon_day' 
  | 'stressed' 
  | 'recovery_day'
  | 'normal_day';

export interface MorningConditionConfig {
  id: MorningCondition;
  name: string;
  icon: string;
  description: string;
  metricModifiers: Partial<BodyMetrics>; // Starting metric adjustments
  needsMultipliers: Partial<BodyMetrics>; // How fast metrics drain
  preferredFoods: FoodType[];
  avoidFoods: FoodType[];
}

// Plot twist events
export type PlotTwistType =
  | 'surprise_meeting'
  | 'stomach_bug'
  | 'heat_wave'
  | 'sugar_crash'
  | 'workout_opportunity'
  | 'dehydration_warning'
  | 'dehydration_alert'
  | 'fiber_first'
  | 'stressful_call'
  | 'social_lunch'
  | 'afternoon_slump'
  | 'temptation_wave'
  | 'health_check'
  | 'late_night_urge'
  | 'sleep_debt'
  | 'work_stress'
  | 'school_day_event'
  | 'sick_day_event'
  | 'sports_day_event'
  | 'travel_day_event'
  | 'birthday_party_event'
  | 'medication_event'
  | 'bedtime_event'
  | 'hypo_event'
  | 'hyper_event'
  | 'insulin_event'
  | 'learning_opportunity1'
  | 'learning_opportunity2'
  | 'learning_opportunity3'
  | 'learning_opportunity4'
  | 'learning_opportunity5'
  | 'learning_opportunity6'
  | 'learning_opportunity7'
  | 'learning_opportunity8'
  | 'learning_opportunity9'
  | 'learning_opportunity10'
  | 'royal_pantry_audit'
  | 'community_feast';

export interface PlotTwist {
  id: PlotTwistType;
  name: string;
  icon: string;
  description: string;
  duration: number; // seconds
  effect: Partial<BodyMetrics>; // Immediate effect
  ongoingEffect?: Partial<BodyMetrics>; // Per-second effect during duration
  bonusCondition?: string; // What gives bonus points during this event
  optimalActions?: SwipeAction[]; // Which swipe actions are best during this event
  shareBonus?: boolean; // Does sharing give extra bonus during this event
}

// Saved food slot for "Save for Later" mechanic
export interface SavedFoodSlot {
  food: FoodUnit | null;
  savedAt: number; // timestamp
}

// Social/Share tracking
export interface SocialStats {
  totalShares: number;
  shareStreak: number;
  socialMeter: number; // 0-100
}

// Game modes
export type GameMode = 'classic' | 'life' | 'slowmo';

export interface GameState {
  // Core
  score: number;
  timer: number;
  foods: FoodUnit[];
  isGameActive: boolean;
  gameResult: 'victory' | 'defeat' | null;
  gameMode: GameMode;
  
  // Multi-metric system (Life Mode)
  metrics: BodyMetrics;
  stability: number; // Legacy - kept for classic mode compatibility
  
  // Time of day (Life Mode)
  timePhase: TimePhase;
  morningCondition: MorningCondition;
  
  // Plot twists (Life Mode)
  activePlotTwist: PlotTwist | null;
  plotTwistTimer: number;
  plotTwistsTriggered: number;
  
  // Special modes (triggered by player behavior)
  activeSpecialMode: SpecialMode | null;
  specialModeTimer: number;
  foodTypeStreak: { type: string; count: number };
  
  // Combo system
  comboCount: number;
  comboTimer: number;
  lastSwipeTime: number;
  
  // Power-ups
  exerciseCharges: number;
  rationCharges: number;
  
  // 4-Direction Swipe System
  savedFoods: SavedFoodSlot[]; // Max 3 slots for "Save for Later"
  socialStats: SocialStats; // Track sharing/social actions
  lastSwipeAction: SwipeAction | null;
  
  // UI state
  announcement: string | null;
  announcementType: 'info' | 'success' | 'warning' | 'error' | 'plot_twist' | 'joke' | 'fact' | 'special_mode' | 'reflection';
  announcementPosition: { x: 'left' | 'center' | 'right'; y: 'top' | 'middle' | 'bottom' };
  announcementScience?: string | null; // Optional educational fact
  showTutorial: boolean;
  tutorialStep: number;
  screenShake: number;
  isPaused: boolean;
  
  // Dynamic speed modifiers
  speedMultiplier: number;
  spawnRateMultiplier: number;
  
  // Stats tracking
  correctSwipes: number;
  incorrectSwipes: number;
  optimalSwipes: number; // New: track when player chose the optimal direction
  timeInBalanced: number;
  timeInWarning: number;
  timeInCritical: number;
  metricsHistory: BodyMetrics[]; // For end-game graph
  
  // Shareable moments tracking
  shareableMoments: ShareableMoment[];
}

// Special mode definition
export interface SpecialMode {
  id: string;
  name: string;
  duration: number;
  effects: {
    speedMultiplier?: number;
    stabilityDecay?: number;
    spawnRate?: number;
    hydrationBoost?: number;
    onlyHealthySpawns?: boolean;
    proteinMultiplier?: number;
    energyBoost?: number;
    energyDecay?: number;
    allEffectsMultiplier?: number;
    clarityBonus?: boolean;
    rejectBonus?: number;
    stabilityNormalize?: boolean;
  };
  backdropEffect: string;
}

// Shareable moment for social sharing
export interface ShareableMoment {
  id: string;
  type: 'combo_milestone' | 'perfect_day' | 'survived_event' | 'epic_save' | 'social_streak';
  title: string;
  description: string;
  timestamp: number;
  score: number;
  emoji: string;
}

export type StabilityZone = 'balanced' | 'warning-low' | 'warning-high' | 'critical-low' | 'critical-high';
export type MetricZone = 'optimal' | 'good' | 'warning' | 'critical';

export type ControlMode = 'swipe' | 'tap';

// Kingdom Lore & Educational Secrets
export interface KingdomSecret {
  id: string;
  emoji: string;
  fact: string;
  tip: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface LoreDiscovery {
  id: string;
  timestamp: number;
  renownReward: number;
}

// User mode - personalization for different player types
export type UserMode = 'personal' | 'caregiver' | 'curious';

export interface UserModeConfig {
  id: UserMode;
  name: string;
  icon: string;
  description: string;
  subtitle: string;
  narrative: {
    onboarding: string;
    tier2ResultsHero: string;
    tier3ResultsHero: string;
  };
}

export interface ComboTier {
  count: number;
  title: string;
  multiplier: number;
  color: string;
}

export interface FoodDefinition {
  type: FoodType;
  faction: FoodFaction;
  name: string;
  sprite: string;
  color: string;
  glowColor: string;
  glucoseImpact: number;
  basePoints: number;
  spawnWeight: number;
  effects: FoodEffects;
  timeModifiers?: Partial<Record<TimePhase, number>>; // Multiplier for effects based on time
  category?: FoodCategory; // For sharing mechanics
  isShareable?: boolean; // Can be shared for social bonus
}

// Legacy types for compatibility
export type GlucoseType = 'healthy' | 'spike' | 'bonus';
export type GlucoseZone = 'balanced' | 'warning' | 'critical-high' | 'critical-low';

export interface PathNode {
  direction: number;
  x: number;
  y: number;
  isActive: boolean;
}

export interface GlucoseParticle {
  id: string;
  type: GlucoseType;
  position: number;
  speed: number;
  points: number;
  color: string;
}
