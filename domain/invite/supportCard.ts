import { getAppBaseUrl } from '@/domain/config/workerUrl';
import type { ProgrammeMission } from '@/domain/programme/types';

export interface SupportInvitePayload {
  behaviourTarget: string;
  templateId: string;
  supportAction: string;
  realmCopy: string;
  inviteCode: string;
}

export function buildSupportInvite(mission: ProgrammeMission): SupportInvitePayload {
  const inviteCode = `${mission.templateId}-${mission.dateKey}`.replace(/[^a-z0-9-]/gi, '');
  return {
    behaviourTarget: mission.behaviourTarget,
    templateId: mission.templateId,
    supportAction: mission.caregiverSupportAction,
    realmCopy: mission.realmCopy,
    inviteCode,
  };
}

/** Path params for caregiver landing — no raw glucose */
export function supportInviteParams(payload: SupportInvitePayload): Record<string, string> {
  return {
    role: 'caregiver',
    templateId: payload.templateId,
    behaviour: payload.behaviourTarget,
    invite: payload.inviteCode,
  };
}

export function supportShareMessage(payload: SupportInvitePayload, baseUrl?: string): string {
  const origin = (baseUrl || getAppBaseUrl()).replace(/\/$/, '');
  const link = `${origin}/invite/support?templateId=${encodeURIComponent(payload.templateId)}&invite=${encodeURIComponent(payload.inviteCode)}`;
  return `Could you help with today’s metabolic programme mission?\n${payload.supportAction}\n\nOpen support invite: ${link}`;
}
