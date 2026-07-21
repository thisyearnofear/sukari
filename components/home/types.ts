/**
 * Shared types and constants for the home surface sub-components.
 *
 * Extracted from MainMenu.tsx so each screen-sized chunk (RoleSelector,
 * SignalSourcePicker, ManualCheckIn, HomeMission, HomeSettings) can hold a
 * clean prop contract without reaching back into the orchestrator's state.
 */
import type { CGMProvider } from '@/types/health';
import type { MetabolicPattern, SelfReportedMoment, ExperimentOutcome } from '@/domain/patterns';
import type { ProgrammeMission } from '@/domain/programme';
import type { MissionAdaptation, PersonalisedWorldState, SukariMiraPresence } from '@/domain/agent';
import type { SignalSnapshot } from '@/domain/signals';

export type SignalPath = 'demo' | 'connect' | 'manual' | 'without_signal';

export type MissionChoice = 'accept' | 'easier' | 'not_practical' | null;

export interface HomePatternState {
  pattern: MetabolicPattern;
  displayMission: ProgrammeMission | null;
  displayWorldState: PersonalisedWorldState | null;
  adaptation: MissionAdaptation | null;
  missionChoice: MissionChoice;
  missionDeferred: boolean;
  proactivePresence: SukariMiraPresence | null;
  /** Demo-day outcome/reflection, only set in demo mode. */
  demoOutcome?: ExperimentOutcome | null;
  demoReflection?: string | null;
}

export interface HomeSignalState {
  snapshot: SignalSnapshot;
  connected: boolean;
  provider?: CGMProvider;
  manualMoment: SelfReportedMoment | null;
  demoMode: boolean;
  demoDay: number;
}

export const HOME_STORAGE_KEYS = {
  demo: 'sukari.demoMaya',
  demoDay: 'sukari.demoMayaDay',
  deferred: 'sukari.missionDeferred',
  signalPath: 'sukari.signalPathChosen',
} as const;
