import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWorkerBaseUrl } from '@/domain/config/workerUrl';
import type {
  DigestCreateResponse,
  DigestGetResponse,
  StoredWeeklyDigest,
  WeeklyDigestPayload,
} from './types';

const LOCAL_DIGEST_KEY = 'sukari.lastDigest';
const LOCAL_DIGEST_HISTORY_KEY = 'sukari.digestHistory';
const LOCAL_DIGEST_HISTORY_LIMIT = 12;

async function persistLocal(token: string, digest: WeeklyDigestPayload) {
  try {
    const stored: StoredWeeklyDigest = { ...digest, token };
    await AsyncStorage.setItem(LOCAL_DIGEST_KEY, JSON.stringify(stored));
    const history = await listLocalWeeklyDigests();
    const next = [stored, ...history.filter((item) => item.token !== token)]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, LOCAL_DIGEST_HISTORY_LIMIT);
    await AsyncStorage.setItem(LOCAL_DIGEST_HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export async function listLocalWeeklyDigests(): Promise<StoredWeeklyDigest[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_DIGEST_HISTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is StoredWeeklyDigest =>
            item && typeof item.token === 'string' && typeof item.weekKey === 'string' && typeof item.createdAt === 'number',
        );
      }
    }

    // Preserve access to summaries created before the history collection existed.
    const legacyRaw = await AsyncStorage.getItem(LOCAL_DIGEST_KEY);
    if (!legacyRaw) return [];
    const legacy = JSON.parse(legacyRaw);
    if (
      legacy &&
      typeof legacy.token === 'string' &&
      typeof legacy.weekKey === 'string' &&
      typeof legacy.createdAt === 'number'
    ) {
      return [legacy as StoredWeeklyDigest];
    }
    return [];
  } catch {
    return [];
  }
}

export async function publishWeeklyDigest(
  digest: WeeklyDigestPayload,
): Promise<DigestCreateResponse | null> {
  const base = getWorkerBaseUrl();
  if (!base) {
    const token = `local-${digest.weekKey}-${digest.createdAt}`;
    await persistLocal(token, digest);
    return {
      ok: true,
      token,
      urlPath: `/digest/${token}`,
      digest,
    };
  }
  try {
    const res = await fetch(`${base}/digest/weekly`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ digest }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as DigestCreateResponse;
    if (data.token) await persistLocal(data.token, digest);
    return data;
  } catch {
    const token = `local-${digest.weekKey}-${digest.createdAt}`;
    await persistLocal(token, digest);
    return { ok: true, token, urlPath: `/digest/${token}`, digest };
  }
}

export async function fetchWeeklyDigest(token: string): Promise<DigestGetResponse | null> {
  const base = getWorkerBaseUrl();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/digest/${encodeURIComponent(token)}`);
    if (!res.ok) return null;
    return (await res.json()) as DigestGetResponse;
  } catch {
    return null;
  }
}
