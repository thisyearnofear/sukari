import { getWorkerBaseUrl } from '@/domain/config/workerUrl';
import type { MissionMediaBrief } from '@/domain/agent';

export interface MissionMediaResponse {
  ok: boolean;
  imageUrl?: string;
  provider?: 'runware';
}

/** Requests an optional, vetted mission illustration. Never sends raw health data. */
export async function fetchMissionMedia(
  brief: MissionMediaBrief,
): Promise<MissionMediaResponse | null> {
  const base = getWorkerBaseUrl();
  if (!base) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7_000);
  try {
    const response = await fetch(`${base}/media/mission-image`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(brief),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as MissionMediaResponse;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
