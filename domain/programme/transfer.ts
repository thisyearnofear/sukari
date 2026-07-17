import { ProgrammeMission } from './types';

export interface PracticeOutcome {
  result: 'victory' | 'defeat';
  correctSwipes: number;
  incorrectSwipes: number;
  score: number;
}

export interface TransferResult {
  mission: ProgrammeMission;
  headline: string;
  body: string;
  realWorldAction: string;
  caregiverSupportAction: string;
  practiced: boolean;
}

/**
 * Maps a practice session outcome onto mission progress + transfer copy.
 */
export function buildTransfer(
  mission: ProgrammeMission | null | undefined,
  outcome: PracticeOutcome,
): TransferResult | null {
  if (!mission) return null;

  const practiced = outcome.correctSwipes > 0 || outcome.result === 'victory';
  const next: ProgrammeMission = {
    ...mission,
    status: practiced
      ? mission.status === 'completed'
        ? 'completed'
        : 'practiced'
      : mission.status,
    practicedAt: practiced ? Date.now() : mission.practicedAt,
  };

  const headline =
    outcome.result === 'victory'
      ? 'What this means for today’s mission'
      : 'Practice counted — finish the real-world ask';

  const body =
    outcome.result === 'victory'
      ? mission.transferHint
      : `${mission.transferHint} Even a tough battle still trains the decision.`;

  return {
    mission: next,
    headline,
    body,
    realWorldAction: mission.realWorldAction,
    caregiverSupportAction: mission.caregiverSupportAction,
    practiced,
  };
}

export function markMissionCompleted(mission: ProgrammeMission): ProgrammeMission {
  return {
    ...mission,
    status: 'completed',
    completedAt: Date.now(),
  };
}

export function markMissionRelapsed(mission: ProgrammeMission): ProgrammeMission {
  return {
    ...mission,
    status: 'relapsed',
  };
}
