import { UserMode } from '@/types/game';
import type { SignalSnapshot } from '@/domain/signals/snapshot';
import { MISSION_TEMPLATES, getTemplateById } from './templates';
import {
  AdherenceWeek,
  MissionSource,
  MissionTemplate,
  ProgrammeMission,
} from './types';

export function dateKeyFrom(ts: number = Date.now()): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function weekKeyFrom(ts: number = Date.now()): string {
  const d = new Date(ts);
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday start
  d.setDate(d.getDate() - diff);
  return dateKeyFrom(d.getTime());
}

export function emptyAdherenceWeek(ts: number = Date.now()): AdherenceWeek {
  return { weekKey: weekKeyFrom(ts), assigned: 0, completed: 0, practiced: 0, relapses: 0 };
}

function signalTags(snapshot: SignalSnapshot | null | undefined): string[] {
  if (!snapshot || !snapshot.connected) return ['disconnected'];
  const tags: string[] = [];
  if (snapshot.trend) tags.push(snapshot.trend);
  if (snapshot.latestMgDl != null) {
    if (snapshot.latestMgDl > 180) tags.push('high');
    else if (snapshot.latestMgDl < 70) tags.push('low');
    else tags.push('stable');
  }
  return tags.length ? tags : ['disconnected'];
}

function scoreTemplate(
  template: MissionTemplate,
  userMode: UserMode | null,
  snapshot: SignalSnapshot | null | undefined,
  recentTemplateIds: string[],
): number {
  let score = 1;
  if (template.modes?.length) {
    if (!userMode || !template.modes.includes(userMode)) return -1;
    score += 2;
  }
  const tags = signalTags(snapshot);
  if (template.signalHints?.length) {
    const hits = template.signalHints.filter((h) => tags.includes(h)).length;
    score += hits * 2;
  }
  if (recentTemplateIds.includes(template.id)) score -= 3;
  return score;
}

export interface SelectMissionInput {
  userMode: UserMode | null;
  snapshot?: SignalSnapshot | null;
  activeMission?: ProgrammeMission | null;
  missionHistory?: ProgrammeMission[];
  source?: MissionSource;
  now?: number;
  /** Force a specific template (caregiver invite / coach) */
  forceTemplateId?: string;
}

/**
 * Picks one mission for the day. Deterministic given same inputs + date.
 * Never blocks on network — pure local rules.
 */
export function selectMission(input: SelectMissionInput): ProgrammeMission {
  const now = input.now ?? Date.now();
  const dateKey = dateKeyFrom(now);

  if (
    input.activeMission &&
    input.activeMission.dateKey === dateKey &&
    input.activeMission.status !== 'skipped'
  ) {
    return input.activeMission;
  }

  if (input.forceTemplateId) {
    const forced = getTemplateById(input.forceTemplateId);
    if (forced) return missionFromTemplate(forced, dateKey, input.source ?? 'rules', now);
  }

  const recent = (input.missionHistory || [])
    .slice(-5)
    .map((m) => m.templateId);

  let best: MissionTemplate | null = null;
  let bestScore = -Infinity;

  for (const template of MISSION_TEMPLATES) {
    const s = scoreTemplate(template, input.userMode, input.snapshot, recent);
    if (s > bestScore) {
      bestScore = s;
      best = template;
    }
  }

  // Caregiver default
  if (input.userMode === 'caregiver') {
    const cg = getTemplateById('caregiver_support');
    if (cg) best = cg;
  }

  if (!best) best = MISSION_TEMPLATES[0];

  return missionFromTemplate(best, dateKey, input.source ?? 'rules', now);
}

export function missionFromTemplate(
  template: MissionTemplate,
  dateKey: string,
  source: MissionSource,
  now: number = Date.now(),
): ProgrammeMission {
  return {
    id: `mission-${dateKey}-${template.id}`,
    dateKey,
    behaviourTarget: template.behaviourTarget,
    templateId: template.id,
    realmCopy: `${template.realmTitle}: ${template.realmCopy}`,
    realWorldAction: template.realWorldAction,
    transferHint: template.transferHint,
    caregiverSupportAction: template.caregiverSupportAction,
    status: 'assigned',
    source,
  };
}

export function rollAdherenceWeek(
  prev: AdherenceWeek | null | undefined,
  mission: ProgrammeMission,
  event: 'assigned' | 'practiced' | 'completed' | 'relapsed',
  now: number = Date.now(),
): AdherenceWeek {
  const key = weekKeyFrom(now);
  const base = prev && prev.weekKey === key ? { ...prev } : emptyAdherenceWeek(now);
  if (event === 'assigned') base.assigned += 1;
  if (event === 'practiced') base.practiced += 1;
  if (event === 'completed') base.completed += 1;
  if (event === 'relapsed') base.relapses += 1;
  return base;
}
