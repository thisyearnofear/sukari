/**
 * Weekly team report — aggregates the cohort overview, work queue state,
 * and Mira flags into a single shareable summary for care-team leads.
 *
 * The report is generated on-device from the same data the operator surface
 * already shows. It is observational, not clinical: it summarizes status
 * counts, completion rates, and Mira's proactive flags. A future
 * authenticated backend can publish the same shape to a secure endpoint.
 */
import type { CohortOverview } from './types';
import type { MiraFlag } from './miraFlags';
import type { WorkQueueState } from './workQueue';
import { getWorkItem } from './workQueue';
import type { TeamMember } from './team';
import { assigneeName } from './team';

export interface AssigneeBreakdown {
  total: number;
  open: number;
  contacted: number;
  resolved: number;
  snoozed: number;
}

export interface TeamReport {
  weekKey: string;
  generatedAt: number;
  source: CohortOverview['source'];
  /** Cohort-level aggregate metrics. */
  aggregate: CohortOverview['aggregate'];
  /** Work item counts broken down by assignee id (or 'unassigned'). */
  byAssignee: Record<string, AssigneeBreakdown>;
  /** Display names for each assignee id, for rendering. */
  assigneeNames: Record<string, string>;
  /** Top Mira flags for the week (max 10). */
  topFlags: MiraFlag[];
  /** Patients who still need attention this week (priority 0 or 1, not resolved). */
  needsAttention: { label: string; priorityReason: string; assignee: string }[];
}

/**
 * Generate a weekly team report from the current cohort + work queue.
 *
 * Pure function — no side effects, no storage. The caller decides whether
 * to render, export, or share the result.
 */
export function generateTeamReport(
  cohort: CohortOverview,
  workQueue: WorkQueueState,
  miraFlags: MiraFlag[],
  team: TeamMember[],
): TeamReport {
  const byAssignee: Record<string, AssigneeBreakdown> = {};
  const assigneeNames: Record<string, string> = { unassigned: 'Unassigned' };

  // Seed entries for all known team members + unassigned bucket.
  for (const m of team) {
    byAssignee[m.id] = { total: 0, open: 0, contacted: 0, resolved: 0, snoozed: 0 };
    assigneeNames[m.id] = m.name;
  }
  byAssignee.unassigned = { total: 0, open: 0, contacted: 0, resolved: 0, snoozed: 0 };

  for (const p of cohort.patients) {
    const item = getWorkItem(workQueue, p.patientLabel);
    const assigneeId = item.assignedTo ?? 'unassigned';
    if (!byAssignee[assigneeId]) {
      byAssignee[assigneeId] = { total: 0, open: 0, contacted: 0, resolved: 0, snoozed: 0 };
      assigneeNames[assigneeId] = assigneeName(team, item.assignedTo);
    }
    const bucket = byAssignee[assigneeId];
    bucket.total += 1;
    bucket[item.status] += 1;
  }

  const needsAttention = cohort.patients
    .filter((p) => p.priority <= 1 && getWorkItem(workQueue, p.patientLabel).status !== 'resolved')
    .map((p) => ({
      label: p.patientLabel,
      priorityReason: p.priorityReason,
      assignee: assigneeName(team, getWorkItem(workQueue, p.patientLabel).assignedTo),
    }));

  return {
    weekKey: cohort.weekKey,
    generatedAt: Date.now(),
    source: cohort.source,
    aggregate: cohort.aggregate,
    byAssignee,
    assigneeNames,
    topFlags: miraFlags.slice(0, 10),
    needsAttention,
  };
}

/**
 * Render a team report as a plain-text summary suitable for sharing
 * (email body, slack message, clipboard).
 *
 * No patient-identifying free-form health text is included — only
 * anonymised labels, status counts, and Mira flag messages.
 */
export function generateShareableSummary(report: TeamReport): string {
  const lines: string[] = [];
  lines.push(`Sukari weekly team report — week of ${report.weekKey}`);
  lines.push('');
  lines.push('Cohort overview:');
  lines.push(`  ${report.aggregate.enrolled} enrolled patients`);
  lines.push(`  ${report.aggregate.needsAttention} need attention`);
  lines.push(`  ${report.aggregate.weeklyAdherentPatients} weekly adherent`);
  lines.push(`  ${report.aggregate.cohortCompletionRate}% cohort completion`);
  lines.push(`  ${report.aggregate.totalStaffMinutesSaved} staff minutes saved`);
  lines.push('');
  lines.push('By team member:');
  for (const [id, counts] of Object.entries(report.byAssignee)) {
    if (counts.total === 0) continue;
    const name = report.assigneeNames[id] ?? id;
    lines.push(
      `  ${name}: ${counts.open} open · ${counts.contacted} contacted · ${counts.resolved} resolved · ${counts.snoozed} snoozed`,
    );
  }
  if (report.needsAttention.length > 0) {
    lines.push('');
    lines.push(`Still needing attention (${report.needsAttention.length}):`);
    for (const p of report.needsAttention.slice(0, 10)) {
      lines.push(`  ${p.label} — ${p.priorityReason} (assigned: ${p.assignee})`);
    }
    if (report.needsAttention.length > 10) {
      lines.push(`  ...and ${report.needsAttention.length - 10} more`);
    }
  }
  if (report.topFlags.length > 0) {
    lines.push('');
    lines.push("Mira's top observations:");
    for (const f of report.topFlags.slice(0, 5)) {
      lines.push(`  [${f.severity}] ${f.patientLabel}: ${f.message}`);
    }
  }
  lines.push('');
  lines.push('Patient-reported outcomes are observational, not clinical.');
  return lines.join('\n');
}

/**
 * Render a team report as CSV. One row per patient with their status,
 * assignee, priority, and completion rate.
 */
export function exportTeamReportCSV(
  cohort: CohortOverview,
  workQueue: WorkQueueState,
  team: TeamMember[],
): string {
  const headers = [
    'patient_label',
    'priority',
    'status',
    'assigned_to',
    'missions_completed',
    'missions_assigned',
    'completion_rate',
    'primary_behaviour',
    'has_safety_flag',
  ];
  const rows: string[] = [headers.join(',')];
  for (const p of cohort.patients) {
    const item = getWorkItem(workQueue, p.patientLabel);
    const assignee = item.assignedTo ? assigneeName(team, item.assignedTo) : 'Unassigned';
    rows.push(
      [
        csvEscape(p.patientLabel),
        String(p.priority),
        item.status,
        csvEscape(assignee),
        String(p.missionsCompleted),
        String(p.missionsAssigned),
        String(p.completionRate),
        csvEscape(p.primaryBehaviour ?? ''),
        String(p.hasSafetyFlag),
      ].join(','),
    );
  }
  return rows.join('\n');
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
