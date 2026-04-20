/**
 * Health Profile System
 * Self-contained mock data that mirrors real CGM + health tracking
 * Ready to swap with real APIs (Dexcom, Apple HealthKit, etc.)
 */

export type DiabetesType = 'type1' | 'type2' | 'prediabetic' | 'non_diabetic';

export type InsulinType = 'rapid' | 'intermediate' | 'long_acting' | 'pump' | 'none';

export interface InsulinDose {
  type: InsulinType;
  units: number;
  administeredAt: number; // timestamp
  peakTime: number; // When insulin peaks (affects glucose curve)
  duration: number; // How long it lasts
}

export interface GlucoseReading {
  value: number; // mg/dL (70-180 is typical range)
  timestamp: number;
  source: 'simulated' | 'cgm' | 'manual'; // Extensible for real data
  trend?: 'stable' | 'rising' | 'falling' | 'rapidly_rising' | 'rapidly_falling';
  trendArrow?: '↑↑' | '↑' | '→' | '↓' | '↓↓';
}

export interface DailyHealthMetrics {
  date: string;
  avgGlucose: number;
  minGlucose: number;
  maxGlucose: number;
  timeInRange: number; // % time 70-180
  hyperglycemicTime: number; // % time > 180
  hypoglycemicTime: number; // % time < 70
  totalInsulinUnits: number;
  carbohydratesConsumed: number;
  sleepQuality: number; // 0-100
  stressLevel: number; // 0-100
}

export interface HealthProfile {
  // Demographics
  name: string;
  diabetesType: DiabetesType;
  diagnosedYear?: number;

  // Current state
  currentGlucose: number; // Latest reading
  recentReadings: GlucoseReading[]; // Last 24 hours (6 readings/day)
  activeInsulin: InsulinDose[];

  // Settings
  targetRange: { min: number; max: number }; // 70-180 typical
  insulinSensitivityFactor: number; // 1 unit insulin = X mg/dL drop
  carbsToInsulinRatio: number; // 1 unit per X grams carbs

  // Insulin regimen
  insulinType: InsulinType;
  basalRate?: number; // Units per hour (pump only)

  // Lifestyle
  sleepHours: number; // Last night
  stressLevel: number; // 0-100
  exerciseMinutes: number; // Last 24h

  // History (for trends)
  dailyHistory: DailyHealthMetrics[];

  // Privacy settings
  privacySettings?: PrivacySettings;
}

export interface HealthSimulationState {
  // Current simulation time (game might run 5 mins but simulate 2 hours)
  simStartTime: number;
  simCurrentTime: number;
  timeAccelerationFactor: number; // 1 = real-time, 24 = 1min game = 24 mins sim
  
  // Running totals for current day
  currentDayMetrics: Partial<DailyHealthMetrics>;
  
  // Glucose curve calculation
  lastMealTime?: number;
  lastMealCarbs?: number;
  mealAbsorptionCurve: 'fast' | 'normal' | 'slow'; // Based on meal composition
}

export interface FoodNutrients {
  name: string;
  type: string; // FoodType from game system
  carbs: number; // Grams
  protein: number;
  fat: number;
  glycemicIndex: number; // 0-100, higher = faster glucose spike
  estimatedGlucoseImpact: number; // Expected mg/dL rise in 30 mins
}

/**
 * Extend existing GameState with health awareness
 */
export interface HealthAwareGameState {
  healthProfile: HealthProfile;
  healthSimulation: HealthSimulationState;
  
  // Track actions that affect glucose
  insulinAdministered: number; // Units taken during game
  mealLogged?: FoodNutrients; // What player consumed
  exerciseMinutes?: number; // During game
  
  // Real-time glucose impact
  projectedGlucose: number; // Where glucose will be at end of game
  glucoseTrend: GlucoseReading['trend'];
}

/**
 * Scenarios for onboarding
 */
export type HealthScenario = 'recently_diagnosed' | 'well_controlled' | 'struggling' | 'newly_aware';

// Privacy settings system
export type PrivacyMode = 'standard' | 'private';
export type Visibility = 'private' | 'public' | 'healthcare_only';

export interface PrivacySettings {
  mode: PrivacyMode;
  encryptHealthData: boolean;
  glucoseLevels: Visibility;
  insulinDoses: Visibility;
  achievements: Visibility;
  gameStats: Visibility;
  healthProfile: Visibility;
}

export interface HealthScenarioConfig {
  id: HealthScenario;
  label: string;
  description: string;
  diabetesType: DiabetesType;
  startingGlucose: number;
  insulinRegimen: InsulinType;
  dailyInsulinUnits: number;
  targetRange: { min: number; max: number };
  emotionalContext: string;
}

/**
 * CGM Connection — tracks real device integration state.
 */
export type CGMProvider = 'dexcom' | 'libre' | 'manual';

export interface CGMConnection {
  provider: CGMProvider;
  isConnected: boolean;
  lastSyncAt: number | null;
  consentGivenAt: number | null;
}
