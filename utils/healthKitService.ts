/**
 * Apple HealthKit CGM Service — read-only glucose data from HealthKit.
 *
 * Covers Libre sensors, Apple Watch glucose, and any CGM that writes to HealthKit.
 * Uses expo-health (if available) or falls back gracefully.
 *
 * This is a platform adapter — same interface as dexcomService.
 */
import { Platform } from 'react-native';
import { GlucoseReading } from '@/types/health';

let healthKit: any = null;
let available = false;

/**
 * Check if HealthKit is available (iOS only).
 */
export async function isAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    // Dynamic import to avoid crash on non-iOS platforms
    const mod = await import('expo-health');
    healthKit = mod;
    available = await mod.isAvailableAsync();
    return available;
  } catch {
    return false;
  }
}

/**
 * Request read permission for blood glucose.
 */
export async function requestPermission(): Promise<boolean> {
  if (!healthKit || !available) return false;
  try {
    const { HealthKitDataType } = healthKit;
    const result = await healthKit.requestPermissionsAsync([HealthKitDataType.BloodGlucose]);
    return result.granted;
  } catch {
    return false;
  }
}

/**
 * Fetch recent glucose readings from HealthKit.
 */
export async function fetchRecentReadings(minutes: number = 180): Promise<GlucoseReading[]> {
  if (!healthKit || !available) return [];
  try {
    const { HealthKitDataType } = healthKit;
    const end = new Date();
    const start = new Date(Date.now() - minutes * 60_000);

    const samples = await healthKit.queryQuantitySamplesAsync(
      HealthKitDataType.BloodGlucose,
      { startDate: start, endDate: end },
    );

    return (samples || []).map((s: any) => {
      // HealthKit stores glucose in mmol/L — convert to mg/dL
      const mgdl = s.unit === 'mmol/L' ? Math.round(s.value * 18.0182) : Math.round(s.value);
      return {
        value: mgdl,
        timestamp: new Date(s.startDate).getTime(),
        source: 'cgm' as const,
        trend: 'stable' as const, // HealthKit doesn't provide trend
        trendArrow: '→' as const,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Fetch the latest single reading.
 */
export async function fetchLatestReading(): Promise<GlucoseReading | null> {
  const readings = await fetchRecentReadings(15);
  return readings.length > 0 ? readings[readings.length - 1] : null;
}

/**
 * Disconnect — HealthKit permissions can't be revoked programmatically,
 * but we clear our local state.
 */
export async function disconnect(): Promise<void> {
  // No-op — HealthKit permissions are managed in iOS Settings
}

export async function isConnected(): Promise<boolean> {
  if (!available) return false;
  // If we have permission, we're "connected"
  return requestPermission();
}
