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
    topBehaviours,
    wins,
    concerns,
    narrative: `Week of ${input.adherence.weekKey}: ${done}/${Math.max(assigned, 1)} missions completed (${completionRate}%). Focus stayed on everyday metabolic habits — no dosing guidance included.`,
    createdAt: Date.now(),
    patientLabel: input.patientLabel,
    dataCoverage: input.dataCoverage ?? 'Programme adherence (no raw glucose series shared)',
    recurringPatterns: input.recurringPatterns ?? topBehaviours.map((b) => `Focus behaviour: ${b.replace(/_/g, ' ')}`),
    changesSinceLastWeek: [
      `${done} missions completed this week`,
    ],
    patientBarriers: input.adherence.relapses > 0 ? ['Missed evenings — recovery mission offered'] : [],
    safetyFlags: [],
    outreachRecommended,
    outreachReason: outreachRecommended
      ? 'Low mission completion with recovery moments — brief human check-in may help.'
      : 'No safety exceptions. Exception-oriented summary only.',
    experimentsTried: completed.slice(-3).map((m) => {
      const pro = m.reportedOutcome;
      let associatedNote: string;
      if (pro) {
        const difficulty =
          pro.feltDifficulty === 'easier'
            ? 'felt easier than expected'
            : pro.feltDifficulty === 'harder'
              ? 'felt harder than expected'
              : 'felt about right';
        const difference =
          pro.noticedDifference === 'yes'
            ? ' and noticed a difference'
            : pro.noticedDifference === 'no'
              ? ' but did not notice a difference yet'
              : ' (uncertain if they noticed a difference)';
        const reflectionPart = m.reflection ? ` — "${m.reflection}"` : '';
        associatedNote = `Patient reported: ${difficulty}${difference} (patient-reported, observational).${reflectionPart}`;
      } else {
        associatedNote = 'Patient marked complete — outcome not yet reported.';
      }
      return {
        action: m.realWorldAction,
        completed: 1,
        associatedNote,
      };
    }),
    mode: 'clinician',
  };
}

/**
 * Estimated staff minutes saved by exception-oriented review this week.
 *
 * The model is deliberately conservative and explainable, not a precise
 * accounting — it exists so an operator can see the budget-holder's language
 * ("minutes saved") next to the clinical language ("outreach recommended").
 *
 *   - When outreach is NOT recommended: the care team avoided one ~10-minute
 *     proactive check-in call for this patient this week.
 *   - Each mission the patient completed without coach involvement avoids a
 *     ~2-minute "did they do it?" follow-up. Capped at 5 so a high-volume
 *     week doesn't inflate the number.
 *   - When outreach IS recommended: 0 saved — the call is needed, and that
 *     time is well-spent, not saved.
 *
 * This is a per-patient estimate. Aggregate it across a cohort for the
 * operator-level business metric.
 */
export const STAFF_MINUTES_AVOIDED_CHECKIN = 10;
export const STAFF_MINUTES_AVOIDED_PER_COMPLETED_MISSION = 2;
export const STAFF_MINUTES_COMPLETED_MISSION_CAP = 5;

export function estimateStaffMinutesSaved(digest: WeeklyDigestPayload): {
  minutes: number;
  model: string;
} {
  if (digest.outreachRecommended === true) {
    return {
      minutes: 0,
      model: 'Outreach recommended — staff time is needed this week, not saved.',
    };
  }
  const completed = Math.max(0, Math.min(digest.missionsCompleted, STAFF_MINUTES_COMPLETED_MISSION_CAP));
  const minutes =
    STAFF_MINUTES_AVOIDED_CHECKIN +
    completed * STAFF_MINUTES_AVOIDED_PER_COMPLETED_MISSION;
  return {
    minutes,
    model: `${STAFF_MINUTES_AVOIDED_CHECKIN} min avoided check-in + ${completed} completed mission(s) × ${STAFF_MINUTES_AVOIDED_PER_COMPLETED_MISSION} min follow-up avoided.`,
  };
}
