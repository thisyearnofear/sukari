/**
 * Dexcom CGM Service — OAuth2 + read-only glucose data.
 *
 * Uses Dexcom Share API for real-time CGM readings.
 * All data is read-only. Never controls any medical device.
 *
 * Requires:
 *   EXPO_PUBLIC_DEXCOM_CLIENT_ID
 *   EXPO_PUBLIC_DEXCOM_REDIRECT_URI
 *
 * Sandbox: https://sandbox-api.dexcom.com
 * Production: https://api.dexcom.com
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlucoseReading } from '@/types/health';

const STORAGE_KEY = 'glucoseWars.dexcom';
const IS_SANDBOX = process.env.EXPO_PUBLIC_DEXCOM_SANDBOX !== 'false';
const BASE_URL = IS_SANDBOX ? 'https://sandbox-api.dexcom.com' : 'https://api.dexcom.com';
const AUTH_URL = IS_SANDBOX ? 'https://sandbox-login.dexcom.com' : 'https://login.dexcom.com';
const CLIENT_ID = process.env.EXPO_PUBLIC_DEXCOM_CLIENT_ID || '';
const REDIRECT_URI = process.env.EXPO_PUBLIC_DEXCOM_REDIRECT_URI || '';

interface DexcomTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface DexcomEGV {
  value: number;
  systemTime: string;
  displayTime: string;
  trend: string;
  trendRate: number;
}

// ─── Auth ────────────────────────────────────────────────────

export function getDexcomAuthUrl(): string {
  return `${AUTH_URL}/v2/oauth2/login?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=egvs`;
}

export async function exchangeCode(code: string): Promise<DexcomTokens> {
  const res = await fetch(`${BASE_URL}/v2/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
    }).toString(),
  });
  if (!res.ok) throw new Error(`Dexcom auth failed: ${res.status}`);
  const data = await res.json();
  const tokens: DexcomTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  return tokens;
}

async function getTokens(): Promise<DexcomTokens | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const tokens: DexcomTokens = JSON.parse(raw);

  // Refresh if expired (with 5min buffer)
  if (Date.now() > tokens.expires_at - 300_000) {
    try {
      const res = await fetch(`${BASE_URL}/v2/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          refresh_token: tokens.refresh_token,
          grant_type: 'refresh_token',
          redirect_uri: REDIRECT_URI,
        }).toString(),
      });
      if (!res.ok) { await disconnect(); return null; }
      const data = await res.json();
      const refreshed: DexcomTokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(refreshed));
      return refreshed;
    } catch {
      return null;
    }
  }
  return tokens;
}

export async function isConnected(): Promise<boolean> {
  return (await getTokens()) !== null;
}

export async function disconnect(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// ─── Data ────────────────────────────────────────────────────

const TREND_MAP: Record<string, GlucoseReading['trend']> = {
  doubleUp: 'rapidly_rising',
  singleUp: 'rising',
  fortyFiveUp: 'rising',
  flat: 'stable',
  fortyFiveDown: 'falling',
  singleDown: 'falling',
  doubleDown: 'rapidly_falling',
};

const ARROW_MAP: Record<string, GlucoseReading['trendArrow']> = {
  doubleUp: '↑↑', singleUp: '↑', fortyFiveUp: '↑',
  flat: '→',
  fortyFiveDown: '↓', singleDown: '↓', doubleDown: '↓↓',
};

function toGlucoseReading(egv: DexcomEGV): GlucoseReading {
  return {
    value: egv.value,
    timestamp: new Date(egv.systemTime).getTime(),
    source: 'cgm',
    trend: TREND_MAP[egv.trend] || 'stable',
    trendArrow: ARROW_MAP[egv.trend] || '→',
  };
}

/**
 * Fetch recent EGV (estimated glucose values) from Dexcom.
 * Returns readings from the last `minutes` (default 180 = 3 hours).
 */
export async function fetchRecentReadings(minutes: number = 180): Promise<GlucoseReading[]> {
  const tokens = await getTokens();
  if (!tokens) return [];

  const end = new Date().toISOString();
  const start = new Date(Date.now() - minutes * 60_000).toISOString();

  try {
    const res = await fetch(
      `${BASE_URL}/v3/users/self/egvs?startDate=${start}&endDate=${end}`,
      { headers: { Authorization: `Bearer ${tokens.access_token}` } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.records || []).map(toGlucoseReading);
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
