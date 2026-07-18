import type { AdherenceWeek, ProgrammeMission } from '@/domain/programme/types';

export interface DigestExperimentTried {
  action: string;
  completed: number;
  associatedNote: string;
}

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
  /** Clinician-oriented fields (optional for backward compatibility) */
  patientLabel?: string;
  dataCoverage?: string;
  recurringPatterns?: string[];
  changesSinceLastWeek?: string[];
  patientBarriers?: string[];
  safetyFlags?: string[];
  outreachRecommended?: boolean;
  outreachReason?: string;
  experimentsTried?: DigestExperimentTried[];
  mode?: 'patient' | 'clinician';
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

/** A locally retained summary that can be surfaced in the operator view. */
export interface StoredWeeklyDigest extends WeeklyDigestPayload {
  token: string;
}

export function buildLocalDigest(input: {
  adherence: AdherenceWeek;
  missionHistory: ProgrammeMission[];
  gamesPlayedThisWeekApprox: number;
  patientLabel?: string;
  recurringPatterns?: string[];
  dataCoverage?: string;
}): WeeklyDigestPayload {
  const weekMissions = input.missionHistory.filter((m) =>
    m.dateKey >= input.adherence.weekKey,
  );
  const completed = weekMissions.filter((m) => m.status === 'completed');
  const topBehaviours = [...new Set(completed.map((m) => m.behaviourTarget))].slice(0, 3);
  const wins =
    completed.length > 0
      ? completed.slice(-3).map((m) => m.realWorldAction)
      : ['Opened the programme and practiced at least once'];
  const concerns: string[] =
    input.adherence.relapses > 0
      ? [`${input.adherence.relapses} soft relapse(s) — recovery coaching recommended, not blame`]
      : input.adherence.completed === 0
        ? ['No missions marked complete yet this week']
        : [];

  const assigned = weekMissions.length || input.adherence.assigned;
  const done = completed.length || input.adherence.completed;
  const completionRate = Math.round((done / Math.max(assigned, 1)) * 100);
  const outreachRecommended = concerns.length > 0 && completionRate < 40;

  return {
    weekKey: input.adherence.weekKey,
    adherence: input.adherence,
    missionsCompleted: done,
    missionsAssigned: assigned,
    practiceSessions: input.gamesPlayedThisWeekApprox,
    topBehaviours,
    wins,
    concerns,
    narrative: `Week of ${input.adherence.weekKey}: ${done}/${Math.max(assigned, 1)} missions completed (${completionRate}%). Focus stayed on everyday metabolic habits — no dosing guidance included.`,
    createdAt: Date.now(),
    patientLabel: input.patientLabel,
    dataCoverage: input.dataCoverage ?? 'Programme adherence + practice sessions (no raw glucose series shared)',
    recurringPatterns: input.recurringPatterns ?? topBehaviours.map((b) => `Focus behaviour: ${b.replace(/_/g, ' ')}`),
    changesSinceLastWeek: [
      `${done} missions completed this week`,
      `${input.gamesPlayedThisWeekApprox} practice sessions`,
    ],
    patientBarriers: input.adherence.relapses > 0 ? ['Missed evenings — recovery mission offered'] : [],
    safetyFlags: [],
    outreachRecommended,
    outreachReason: outreachRecommended
      ? 'Low mission completion with recovery moments — brief human check-in may help.'
      : 'No safety exceptions. Exception-oriented summary only.',
    experimentsTried: completed.slice(-3).map((m) => ({
      action: m.realWorldAction,
      completed: 1,
      associatedNote: 'Patient marked complete after practice — outcome association pending more days.',
    })),
    mode: 'clinician',
  };
}
