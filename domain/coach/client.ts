import type { AdherenceWeek, ProgrammeMission } from '@/domain/programme/types';
import type { SignalSnapshot } from '@/domain/signals/snapshot';
import { getWorkerBaseUrl } from '@/domain/config/workerUrl';
import { UserMode } from '@/types/game';

export interface CoachMissionRequest {
  userMode: UserMode | null;
  signalMinimized: SignalSnapshot['minimized'];
  adherenceWeek?: AdherenceWeek | null;
  lastMissionTemplateId?: string | null;
}

export interface CoachMissionResponse {
  ok: boolean;
  templateId?: string;
  realmCopy?: string;
  realWorldAction?: string;
  transferHint?: string;
  caregiverSupportAction?: string;
  insights?: string[];
  error?: string;
  source?: 'llm' | 'rules';
}

export interface CoachChatRequest {
  message: string;
  mission?: ProgrammeMission | null;
  signalMinimized?: SignalSnapshot['minimized'];
  userMode?: UserMode | null;
}

export interface CoachChatResponse {
  ok: boolean;
  reply?: string;
  refused?: boolean;
  escalate?: boolean;
  error?: string;
}

async function postJson<T>(path: string, body: unknown, timeoutMs = 4000): Promise<T | null> {
  const base = getWorkerBaseUrl();
  if (!base) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchCoachMission(
  req: CoachMissionRequest,
): Promise<CoachMissionResponse | null> {
  return postJson<CoachMissionResponse>('/coach/mission', req);
}

export async function fetchCoachChat(
  req: CoachChatRequest,
): Promise<CoachChatResponse | null> {
  return postJson<CoachChatResponse>('/coach/chat', req, 6000);
}

export interface CoachChatStreamRequest extends CoachChatRequest {
  history?: { role: string; content: string }[];
}

/**
 * Stream a coach chat reply. Calls onChunk for each text fragment as it
 * arrives. Returns the full accumulated reply when the stream ends, or
 * null if the request fails.
 *
 * React Native's fetch does not support response.body.getReader() —
 * response.body is undefined in RN. When that happens, we fall back to
 * reading the full response as text. The reply arrives all at once
 * instead of token-by-token, but the content is the same.
 */
export async function fetchCoachChatStream(
  req: CoachChatStreamRequest,
  onChunk: (text: string) => void,
  timeoutMs = 12000,
): Promise<string | null> {
  const base = getWorkerBaseUrl();
  if (!base) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}/coach/chat/stream`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req),
      signal: controller.signal,
    });
    if (!res.ok) return null;

    // React Native: response.body is undefined, so getReader() is not
    // available. Fall back to reading the full response as text.
    if (!res.body) {
      const text = await res.text();
      if (text) onChunk(text);
      return text || null;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      full += chunk;
      onChunk(chunk);
    }
    return full || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
