/**
 * Care team members for the operator surface.
 *
 * Today this is a small static roster stored in AsyncStorage so an operator
 * can assign work items to specific people. A future authenticated backend
 * replaces this with provider identity + role-based access control; the view
 * layer does not change.
 *
 * Storage: AsyncStorage under `sukari.careTeam`.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'sukari.careTeam';

export interface TeamMember {
  /** Stable id, used as the `assignedTo` value on WorkItem. */
  id: string;
  /** Display name shown in the operator UI. */
  name: string;
  /** Optional role label (e.g. "Nurse", "Coach", "Coordinator"). */
  role?: string;
}

/**
 * Default demo team. Used when no team has been configured yet.
 * Explicitly small so the assignment UI is usable in demos without setup.
 */
export const DEFAULT_TEAM: TeamMember[] = [
  { id: 'coord-1', name: 'Coordinator A', role: 'Care coordinator' },
  { id: 'coord-2', name: 'Coordinator B', role: 'Care coordinator' },
  { id: 'coach-1', name: 'Coach A', role: 'Health coach' },
];

/**
 * Load the care team from AsyncStorage, falling back to the default roster.
 */
export async function loadTeamMembers(): Promise<TeamMember[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TEAM;
    const parsed = JSON.parse(raw) as TeamMember[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_TEAM;
    return parsed;
  } catch {
    return DEFAULT_TEAM;
  }
}

/**
 * Persist a care team roster to AsyncStorage.
 */
export async function saveTeamMembers(members: TeamMember[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  } catch {
    // Silent fail — team roster is a convenience, not critical.
  }
}

/**
 * Resolve an assignee id to a display name, falling back to the id itself.
 */
export function assigneeName(members: TeamMember[], id: string | undefined): string {
  if (!id) return 'Unassigned';
  const m = members.find((x) => x.id === id);
  return m ? m.name : id;
}
