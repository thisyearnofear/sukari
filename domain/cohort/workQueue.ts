/**
 * Work queue — turns the passive cohort report into an active
 * operator work surface.
 *
 * Each patient becomes a work item with a status the operator can
 * move through: open → contacted → resolved (or snoozed). This is
 * the difference between a report you scroll and a queue you work.
 *
 * The work queue is persisted locally so an operator's actions
 * survive app reloads. A future authenticated backend will sync
 * this state across the care team.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CohortPatientSummary } from './types';

const STORAGE_KEY = 'sukari.workQueue';

export type WorkItemStatus = 'open' | 'contacted' | 'resolved' | 'snoozed';

export type WorkItemFilter = 'all' | 'open' | 'contacted' | 'snoozed' | 'resolved';

export type WorkItemSort = 'priority' | 'completion' | 'recent';

export interface WorkItem {
  patientLabel: string;
  status: WorkItemStatus;
  /** When the status was last updated. */
  statusUpdatedAt: number;
  /** Optional operator note. */
  note?: string;
  /** When the item was snoozed until (for snoozed items). */
  snoozedUntil?: number;
  /** Who on the care team is handling this, if assigned. */
  assignedTo?: string;
}

export type WorkQueueState = Record<string, WorkItem>;

export function emptyWorkQueue(): WorkQueueState {
  return {};
}

/**
 * Load work queue state from AsyncStorage.
 */
export async function loadWorkQueue(): Promise<WorkQueueState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyWorkQueue();
    return JSON.parse(raw) as WorkQueueState;
  } catch {
    return emptyWorkQueue();
  }
}

/**
 * Persist work queue state to AsyncStorage.
 */
export async function saveWorkQueue(state: WorkQueueState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Silent fail — work queue is a tool, not critical data.
  }
}

/**
 * Get or create a work item for a patient.
 */
export function getWorkItem(state: WorkQueueState, patientLabel: string): WorkItem {
  return (
    state[patientLabel] ?? {
      patientLabel,
      status: 'open' as const,
      statusUpdatedAt: Date.now(),
    }
  );
}

/**
 * Update a work item's status.
 */
export function updateWorkItemStatus(
  state: WorkQueueState,
  patientLabel: string,
  status: WorkItemStatus,
  extra?: { note?: string; assignedTo?: string; snoozedUntil?: number },
): WorkQueueState {
  const existing = getWorkItem(state, patientLabel);
  return {
    ...state,
    [patientLabel]: {
      ...existing,
      status,
      statusUpdatedAt: Date.now(),
      ...(extra?.note !== undefined ? { note: extra.note } : {}),
      ...(extra?.assignedTo !== undefined ? { assignedTo: extra.assignedTo } : {}),
      ...(extra?.snoozedUntil !== undefined ? { snoozedUntil: extra.snoozedUntil } : {}),
    },
  };
}

/**
 * Snooze a work item for a number of hours.
 */
export function snoozeWorkItem(
  state: WorkQueueState,
  patientLabel: string,
  hours: number,
): WorkQueueState {
  return updateWorkItemStatus(state, patientLabel, 'snoozed', {
    snoozedUntil: Date.now() + hours * 60 * 60 * 1000,
  });
}

/**
 * Check if a snoozed item should be reopened (snooze period expired).
 */
export function isSnoozeExpired(item: WorkItem): boolean {
  if (item.status !== 'snoozed' || !item.snoozedUntil) return false;
  return Date.now() >= item.snoozedUntil;
}

/**
 * Reopen any expired snoozed items.
 */
export function reopenExpiredSnoozes(state: WorkQueueState): WorkQueueState {
  let updated = state;
  for (const [label, item] of Object.entries(state)) {
    if (isSnoozeExpired(item)) {
      updated = updateWorkItemStatus(updated, label, 'open');
    }
  }
  return updated;
}

/**
 * Filter patients by work queue status.
 */
export function filterByStatus(
  patients: CohortPatientSummary[],
  state: WorkQueueState,
  filter: WorkItemFilter,
): CohortPatientSummary[] {
  if (filter === 'all') return patients;
  return patients.filter((p) => {
    const item = getWorkItem(state, p.patientLabel);
    return item.status === filter;
  });
}

/**
 * Sort patients by the selected sort key, with work queue status
 * as a secondary sort (open items before contacted/resolved).
 */
export function sortPatients(
  patients: CohortPatientSummary[],
  state: WorkQueueState,
  sort: WorkItemSort,
): CohortPatientSummary[] {
  const statusOrder: Record<WorkItemStatus, number> = {
    open: 0,
    snoozed: 1,
    contacted: 2,
    resolved: 3,
  };

  return [...patients].sort((a, b) => {
    const itemA = getWorkItem(state, a.patientLabel);
    const itemB = getWorkItem(state, b.patientLabel);

    // Primary: status order (open items first)
    const statusDiff = statusOrder[itemA.status] - statusOrder[itemB.status];
    if (statusDiff !== 0) return statusDiff;

    // Secondary: sort key
    switch (sort) {
      case 'priority':
        return a.priority - b.priority;
      case 'completion':
        return a.completionRate - b.completionRate;
      case 'recent':
        return itemB.statusUpdatedAt - itemA.statusUpdatedAt;
      default:
        return a.priority - b.priority;
    }
  });
}

/**
 * Compute aggregate counts by status.
 */
export function statusCounts(
  patients: CohortPatientSummary[],
  state: WorkQueueState,
): Record<WorkItemStatus, number> {
  const counts: Record<WorkItemStatus, number> = {
    open: 0,
    contacted: 0,
    resolved: 0,
    snoozed: 0,
  };
  for (const p of patients) {
    const item = getWorkItem(state, p.patientLabel);
    counts[item.status]++;
  }
  return counts;
}
