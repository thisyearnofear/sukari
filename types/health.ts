/**
 * Health Profile System
 * Self-contained mock data that mirrors real CGM + health tracking
 * Ready to swap with real APIs (Dexcom, Apple HealthKit, etc.)
 */

export type DiabetesType = 'type1' | 'type2' | 'prediabetic' | 'non_diabetic';

export interface GlucoseReading {
  value: number; // mg/dL (70-180 is typical range)
  timestamp: number;
  source: 'simulated' | 'cgm' | 'manual'; // Extensible for real data
  trend?: 'stable' | 'rising' | 'falling' | 'rapidly_rising' | 'rapidly_falling';
  trendArrow?: '↑↑' | '↑' | '→' | '↓' | '↓↓';
}

export interface HealthProfile {
  // Demographics
  name: string;
  diabetesType: DiabetesType;
  diagnosedYear?: number;

  // Current state
  currentGlucose: number; // Latest reading
  recentReadings: GlucoseReading[]; // Last 24 hours (6 readings/day)

  // Settings
  targetRange: { min: number; max: number }; // 70-180 typical

  // Lifestyle
  sleepHours: number; // Last night
  stressLevel: number; // 0-100
  exerciseMinutes: number; // Last 24h

  // Privacy settings
  privacySettings?: PrivacySettings;
}

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
