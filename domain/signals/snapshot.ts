import { GlucoseReading, HealthProfile } from '@/types/health';

export type SignalTrend = 'rising' | 'falling' | 'stable';

export interface SignalSnapshot {
  connected: boolean;
  provider?: string | null;
  latestMgDl?: number | null;
  trend?: SignalTrend | null;
  timeInRangeProxy?: number | null; // 0–100
  readingCount: number;
  capturedAt: number;
  source: 'cgm' | 'simulated' | 'none';
  /** Safe for analytics / coach API — no raw series when private */
  minimized: {
    connected: boolean;
    trend: SignalTrend | null;
    band: 'low' | 'in_range' | 'high' | 'unknown';
    source: 'cgm' | 'simulated' | 'none';
  };
}

function mapTrend(reading?: GlucoseReading | null): SignalTrend | null {
  if (!reading?.trend) return null;
  if (reading.trend === 'rising' || reading.trend === 'rapidly_rising') return 'rising';
  if (reading.trend === 'falling' || reading.trend === 'rapidly_falling') return 'falling';
  return 'stable';
}

function bandFromValue(v?: number | null): 'low' | 'in_range' | 'high' | 'unknown' {
  if (v == null || !Number.isFinite(v)) return 'unknown';
  if (v < 70) return 'low';
  if (v > 180) return 'high';
  return 'in_range';
}

function tirProxy(readings: GlucoseReading[]): number | null {
  if (!readings.length) return null;
  const inRange = readings.filter((r) => r.value >= 70 && r.value <= 180).length;
  return Math.round((inRange / readings.length) * 100);
}

export interface BuildSnapshotInput {
  connected: boolean;
  provider?: string | null;
  readings?: GlucoseReading[];
  latestReading?: GlucoseReading | null;
  /** Fallback when CGM disconnected */
  healthProfile?: HealthProfile | null;
  privacyMode?: string;
}

/**
 * Builds a SignalSnapshot from CGM or simulated health profile.
 * Never invents dosing advice — signals only.
 */
export function buildSignalSnapshot(input: BuildSnapshotInput): SignalSnapshot {
  const privacy = input.privacyMode === 'private' || input.privacyMode === 'stealth';
  const now = Date.now();

  if (input.connected && (input.latestReading || (input.readings && input.readings.length))) {
    const readings = input.readings || (input.latestReading ? [input.latestReading] : []);
    const latest = input.latestReading || readings[readings.length - 1];
    const trend = mapTrend(latest);
    const latestMgDl = privacy ? null : latest?.value ?? null;
    const snapshot: SignalSnapshot = {
      connected: true,
      provider: input.provider,
      latestMgDl,
      trend,
      timeInRangeProxy: privacy ? null : tirProxy(readings),
      readingCount: readings.length,
      capturedAt: now,
      source: 'cgm',
      minimized: {
        connected: true,
        trend,
        band: bandFromValue(latest?.value),
        source: 'cgm',
      },
    };
    return snapshot;
  }

  const profile = input.healthProfile;
  if (profile) {
    const latestMgDl = privacy ? null : profile.currentGlucose;
    const trend: SignalTrend =
      profile.recentReadings?.length >= 2
        ? profile.recentReadings[profile.recentReadings.length - 1].value >
          profile.recentReadings[profile.recentReadings.length - 2].value
          ? 'rising'
          : profile.recentReadings[profile.recentReadings.length - 1].value <
              profile.recentReadings[profile.recentReadings.length - 2].value
            ? 'falling'
            : 'stable'
        : 'stable';

    return {
      connected: false,
      provider: null,
      latestMgDl,
      trend,
      timeInRangeProxy: privacy
        ? null
        : null,
      readingCount: profile.recentReadings?.length || 0,
      capturedAt: now,
      source: 'simulated',
      minimized: {
        connected: false,
        trend,
        band: bandFromValue(profile.currentGlucose),
        source: 'simulated',
      },
    };
  }

  return {
    connected: false,
    provider: null,
    latestMgDl: null,
    trend: null,
    timeInRangeProxy: null,
    readingCount: 0,
    capturedAt: now,
    source: 'none',
    minimized: {
      connected: false,
      trend: null,
      band: 'unknown',
      source: 'none',
    },
  };
}
