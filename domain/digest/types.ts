import type { AdherenceWeek, ProgrammeMission } from '@/domain/programme/types';

export interface WeeklyDigestPayload {
  weekKey: string;
  adherence: AdherenceWeek;
  missionsCompleted: number;
  missionsAssigned: number;
  practiceSessions: number;
  topBehaviours: string[];
  wins: string[];
  concerns: string[];
  narrative?: string;
  createdAt: number;
}

export interface DigestCreateResponse {
  ok: boolean;
  token?: string;
  urlPath?: string;
  digest?: WeeklyDigestPayload;
  error?: string;
}

export interface DigestGetResponse {
  ok: boolean;
  digest?: WeeklyDigestPayload;
  error?: string;
}

export function buildLocalDigest(input: {
  adherence: AdherenceWeek;
  missionHistory: ProgrammeMission[];
  gamesPlayedThisWeekApprox: number;
}): WeeklyDigestPayload {
  const weekMissions = input.missionHistory.filter((m) =>
    m.dateKey >= input.adherence.weekKey,
  );
  const completed = weekMissions.filter((m) => m.status === 'completed');
  const topBehaviours = [...new Set(completed.map((m) => m.behaviourTarget))].slice(0, 3);
  const wins =
    completed.length > 0
      ? completed.slice(-3).map((m) => m.realWorldAction)
      : ['Opened the Realm and practiced at least once'];
  const concerns: string[] =
    input.adherence.relapses > 0
      ? [`${input.adherence.relapses} soft relapse(s) — recovery missions recommended`]
      : input.adherence.completed === 0
        ? ['No missions marked complete yet this week']
        : [];

  return {
    weekKey: input.adherence.weekKey,
    adherence: input.adherence,
    missionsCompleted: completed.length || input.adherence.completed,
    missionsAssigned: weekMissions.length || input.adherence.assigned,
    practiceSessions: input.gamesPlayedThisWeekApprox,
    topBehaviours,
    wins,
    concerns,
    narrative: `Week of ${input.adherence.weekKey}: ${input.adherence.completed}/${Math.max(input.adherence.assigned, 1)} missions completed. Programme focus stayed on everyday metabolic habits — no dosing guidance included.`,
    createdAt: Date.now(),
  };
}
