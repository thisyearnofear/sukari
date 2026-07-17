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
