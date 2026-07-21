/**
 * Mira flags — proactive observations Mira generates for the care team.
 *
 * This is what makes the operator surface feel like Mira is working
 * for the care team, not just reporting to them. Instead of a passive
 * list of patients with completion rates, Mira says:
 *
 *   "Patient 1003's completion dropped 40% this week. She mentioned
 *    evenings were hard. I suggested a smaller mission but she
 *    declined. A brief check-in might help."
 *
 * Flags are generated deterministically from the cohort data + the
 * patient's conversation memory. They are NOT medical advice — they
 * are operational observations that help the care team prioritize.
 */
import type { CohortPatientSummary } from './types';
import type { WorkItem } from './workQueue';
import { getWorkItem } from './workQueue';

export type FlagKind =
  | 'safety_escalation'
  | 'completion_drop'
  | 'barrier_pattern'
  | 'recovery_signal'
  | 'streak_building'
  | 're_engagement'
  | 'outcome_struggle'
  | 'outcome_positive'
  | 'outcome_barrier_link';

export type FlagSeverity = 'urgent' | 'worth_a_conversation' | 'positive';

export interface MiraFlag {
  patientLabel: string;
  kind: FlagKind;
  severity: FlagSeverity;
  /** Mira's natural-language observation for the care team. */
  message: string;
  /** What Mira suggests the operator do. */
  suggestion: string;
  /** Whether Mira has already reached out to the patient. */
  miraActed: boolean;
}

/**
 * Generate Mira flags for a patient based on their summary + work item.
 *
 * The flags are written in Mira's voice — operational, not clinical.
 * "Worth a conversation" not "recommend intervention." The care team
 * decides what to do; Mira narrows their attention.
 */
function flagsForPatient(
  patient: CohortPatientSummary,
  workItem: WorkItem,
): MiraFlag[] {
  const flags: MiraFlag[] = [];
  const rate = patient.completionRate;
  const digest = patient.digest;

  // Safety escalation — always urgent, always first
  if (patient.hasSafetyFlag && digest?.safetyFlags?.length) {
    flags.push({
      patientLabel: patient.patientLabel,
      kind: 'safety_escalation',
      severity: 'urgent',
      message: `Safety flag triggered: ${digest.safetyFlags[0].toLowerCase()}. Completion is ${rate}% this week.`,
      suggestion: 'Brief clinical review recommended. I have not contacted the patient about this flag.',
      miraActed: false,
    });
  }

  // Completion drop — worth a conversation
  if (!patient.hasSafetyFlag && patient.outreachRecommended && rate < 40) {
    const barrier = digest?.patientBarriers?.[0];
    flags.push({
      patientLabel: patient.patientLabel,
      kind: 'completion_drop',
      severity: 'worth_a_conversation',
      message: barrier
        ? `Completion dropped to ${rate}%. ${barrier}.`
        : `Completion is ${rate}% this week — below the recovery threshold.`,
      suggestion: barrier
        ? 'A brief check-in about the barrier might help. I have already suggested a smaller mission.'
        : 'A brief human check-in may help. I have already suggested a smaller mission.',
      miraActed: true,
    });
  }

  // Barrier pattern — patient has expressed a recurring barrier
  if (!patient.hasSafetyFlag && digest?.patientBarriers?.length && rate >= 40 && rate < 70) {
    const barrier = digest.patientBarriers[0];
    if (barrier && barrier.length > 0) {
      flags.push({
        patientLabel: patient.patientLabel,
        kind: 'barrier_pattern',
        severity: 'worth_a_conversation',
        message: `Patient mentioned: "${barrier.toLowerCase()}". Completion is holding at ${rate}% but not improving.`,
        suggestion: 'A conversation about the barrier could unblock the week. No urgent safety concern.',
        miraActed: false,
      });
    }
  }

  // Recovery signal — patient re-engaged after a tough week
  if (workItem.status === 'contacted' && rate > 50 && rate < 80) {
    flags.push({
      patientLabel: patient.patientLabel,
      kind: 'recovery_signal',
      severity: 'positive',
      message: `Re-engaging after your contact. Completion up to ${rate}%. The conversation seems to have helped.`,
      suggestion: 'No action needed. Consider a brief encouragement next week.',
      miraActed: true,
    });
  }

  // Streak building — patient completing consistently
  if (patient.priority === 3 && rate >= 85) {
    flags.push({
      patientLabel: patient.patientLabel,
      kind: 'streak_building',
      severity: 'positive',
      message: `Strong week — ${patient.missionsCompleted}/${patient.missionsAssigned} missions completed. Adherence is steady.`,
      suggestion: 'No action needed. This is a good time to acknowledge progress if you reach out.',
      miraActed: false,
    });
  }

  // Re-engagement — patient opened the app after a gap
  if (workItem.status === 'open' && patient.priority === 2 && rate > 0 && rate < 50) {
    flags.push({
      patientLabel: patient.patientLabel,
      kind: 're_engagement',
      severity: 'worth_a_conversation',
      message: `Patient re-opened the app and completed ${patient.missionsCompleted} mission(s) this week after a quiet period.`,
      suggestion: 'A welcome-back message could reinforce the re-engagement. No safety concern.',
      miraActed: false,
    });
  }

  // Outcome-aware flags — use structured PRO data from outcomeSummary,
  // not text parsing. References specific behaviours so the operator
  // knows exactly which missions the patient struggled with or benefited from.
  const outcome = patient.outcomeSummary;
  const barriers = digest?.patientBarriers ?? [];

  if (outcome) {
    // Outcome struggle — patient reported specific behaviours as harder 2+ times
    if (outcome.struggleBehaviours.length > 0 && !patient.hasSafetyFlag) {
      const behaviours = outcome.struggleBehaviours.map((b) => b.replace(/_/g, ' '));
      const behaviourList = behaviours.length === 1
        ? behaviours[0]
        : `${behaviours.slice(0, -1).join(', ')} and ${behaviours[behaviours.length - 1]}`;
      flags.push({
        patientLabel: patient.patientLabel,
        kind: 'outcome_struggle',
        severity: 'worth_a_conversation',
        message: `Patient reported ${behaviourList} felt harder than expected across ${outcome.totalReported} completed mission(s). They're completing but finding it difficult.`,
        suggestion: "A conversation about what's making it hard could help. I'll suggest easier variants going forward.",
        miraActed: true,
      });
    }

    // Outcome positive — patient consistently noticing a difference on specific behaviours
    if (outcome.positiveBehaviours.length > 0 && outcome.totalNoticed >= 2 && patient.priority >= 2) {
      const behaviours = outcome.positiveBehaviours.map((b) => b.replace(/_/g, ' '));
      const behaviourList = behaviours.length === 1
        ? behaviours[0]
        : `${behaviours.slice(0, -1).join(', ')} and ${behaviours[behaviours.length - 1]}`;
      flags.push({
        patientLabel: patient.patientLabel,
        kind: 'outcome_positive',
        severity: 'positive',
        message: `Patient noticed a difference on ${behaviourList} (${outcome.totalNoticed} of ${outcome.totalReported} reported mission(s)). Positive engagement signal.`,
        suggestion: 'No action needed. This is a good moment to acknowledge their progress if you reach out.',
        miraActed: false,
      });
    }

    // Outcome-barrier link — the patient has both a stated barrier AND outcome
    // struggle on the same behaviour. This is a stronger signal than either alone:
    // the barrier explains the struggle, and the struggle confirms the barrier matters.
    if (outcome.struggleBehaviours.length > 0 && barriers.length > 0 && !patient.hasSafetyFlag) {
      const barrierText = barriers[0].toLowerCase();
      // Link barrier keywords to behaviours when they plausibly align.
      // This is observational, not causal — "the barrier and the struggle align"
      // not "the barrier caused the struggle."
      const eveningBarrier = barrierText.includes('evening') || barrierText.includes('night');
      const workBarrier = barrierText.includes('work') || barrierText.includes('busy');
      const hasEveningStruggle = outcome.struggleBehaviours.some((b) =>
        b.includes('evening') || b.includes('post_meal'),
      );
      const hasWorkStruggle = outcome.struggleBehaviours.some((b) =>
        b.includes('work') || b.includes('protein_breakfast'),
      );
      if ((eveningBarrier && hasEveningStruggle) || (workBarrier && hasWorkStruggle)) {
        const behaviours = outcome.struggleBehaviours.map((b) => b.replace(/_/g, ' ')).join(', ');
        flags.push({
          patientLabel: patient.patientLabel,
          kind: 'outcome_barrier_link',
          severity: 'worth_a_conversation',
          message: `Patient mentioned "${barrierText}" and reported ${behaviours} as harder than expected. The barrier and the struggle align — a conversation about timing or approach could help.`,
          suggestion: 'The pattern is consistent. A brief check-in about what specifically makes it hard could unblock the week.',
          miraActed: true,
        });
      }
    }
  }

  return flags;
}

/**
 * Generate all Mira flags for a cohort.
 *
 * Only patients with flags appear in the result — stable patients
 * without observations don't clutter the operator's attention.
 */
export function generateMiraFlags(
  patients: CohortPatientSummary[],
  workQueue: Record<string, WorkItem>,
): MiraFlag[] {
  const allFlags: MiraFlag[] = [];

  for (const patient of patients) {
    const workItem = getWorkItem(workQueue, patient.patientLabel);
    const flags = flagsForPatient(patient, workItem);
    allFlags.push(...flags);
  }

  // Sort by severity: urgent first, then worth_a_conversation, then positive
  const severityOrder: Record<FlagSeverity, number> = {
    urgent: 0,
    worth_a_conversation: 1,
    positive: 2,
  };

  return allFlags.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

/**
 * Get the most important flag for a patient (if any).
 */
export function topFlagForPatient(
  patient: CohortPatientSummary,
  workQueue: Record<string, WorkItem>,
): MiraFlag | null {
  const workItem = getWorkItem(workQueue, patient.patientLabel);
  const flags = flagsForPatient(patient, workItem);
  return flags[0] ?? null;
}
