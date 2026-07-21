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
  | 're_engagement';

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
