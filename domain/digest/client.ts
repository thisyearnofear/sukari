import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWorkerBaseUrl } from '@/domain/config/workerUrl';
import type { DigestCreateResponse, DigestGetResponse, WeeklyDigestPayload } from './types';

const LOCAL_DIGEST_KEY = 'glucoseWars.lastDigest';

async function persistLocal(token: string, digest: WeeklyDigestPayload) {
  try {
    await AsyncStorage.setItem(LOCAL_DIGEST_KEY, JSON.stringify({ ...digest, token }));
  } catch {
    /* ignore */
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
