import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';

type Properties = Record<string, any>;

const ANON_ID_KEY = 'glucoseWars.analytics.anonymousId';

let posthog: any | null = null;
let initialized = false;
let initPromise: Promise<void> | null = null;

function getAppContext() {
  const expoConfig = Constants.expoConfig;
  return {
    platform: Platform.OS,
    app_version: expoConfig?.version,
    app_slug: expoConfig?.slug,
  };
}

async function getOrCreateAnonymousId(): Promise<string> {
  const existing = await AsyncStorage.getItem(ANON_ID_KEY);
  if (existing) return existing;
  const id = Crypto.randomUUID();
  await AsyncStorage.setItem(ANON_ID_KEY, id);
  return id;
}

export async function getAnonymousId(): Promise<string> {
  return getOrCreateAnonymousId();
}

function redactForPrivacy(props: Properties, privacyMode?: string): Properties {
  if (!props) return {};

  // Default: allow everything if not private.
  if (!privacyMode || privacyMode === 'standard' || privacyMode === 'public') {
    return props;
  }

  // Private mode: drop anything that could be interpreted as sensitive health data.
  const SENSITIVE_KEYS = new Set([
    'healthProfile',
    'health_profile',
    'glucose',
    'glucoseLevel',
    'glucose_level',
    'insulin',
    'insulinDoses',
    'insulin_doses',
    'recentReadings',
    'recent_readings',
    'metrics_raw',
    'latestMgDl',
    'latest_mg_dl',
    'readings',
    'signal_raw',
    'timeInRangeProxy',
    'time_in_range',
  ]);

  const filtered: Properties = {};
  for (const [k, v] of Object.entries(props)) {
    if (SENSITIVE_KEYS.has(k)) continue;
    // Heuristic: don’t send nested objects that might contain health info.
    if (v && typeof v === 'object' && !Array.isArray(v)) continue;
    filtered[k] = v;
  }

  return filtered;
}

async function ensureInitialized() {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const key = process.env.EXPO_PUBLIC_POSTHOG_KEY;
    const host = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

    if (!key) {
      initialized = true;
      return;
    }

    // Use lightweight HTTP capture on all platforms (no posthog-js dependency)
    const anonId = await getOrCreateAnonymousId();
    posthog = {
      _key: key,
      _host: host,
      _distinctId: anonId,
      identify(id: string, props?: Properties) {
        this._distinctId = id;
        this.capture('$identify', { $set: props });
      },
      capture(event: string, props?: Properties) {
        fetch(`${this._host}/capture/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: this._key,
            event,
            distinct_id: this._distinctId,
            properties: { ...props, $lib: 'glucosewars' },
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => { /* fire-and-forget */ });
      },
    };

    initialized = true;
  })();

  return initPromise;
}

export async function initAnalytics() {
  await ensureInitialized();
}

export async function identifyUser(distinctId: string, properties?: Properties) {
  await ensureInitialized();
  if (!posthog) return;
  posthog.identify(distinctId, { ...getAppContext(), ...(properties || {}) });
}

export async function track(event: string, properties?: Properties & { privacy_mode?: string }) {
  await ensureInitialized();

  const privacyMode = properties?.privacy_mode;
  const safeProps = redactForPrivacy(
    { ...getAppContext(), ...(properties || {}) },
    privacyMode,
  );

  if (!posthog) {
    // Dev-friendly fallback.
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[analytics] ${event}`, safeProps);
    }
    return;
  }

  posthog.capture(event, safeProps);
}
