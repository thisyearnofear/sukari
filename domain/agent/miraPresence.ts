import type { MetabolicPattern } from '@/domain/patterns';

/**
 * Mira is Famile's shared agent identity. A posture is derived from an
 * operational state, never guessed emotion or clinical judgement.
 */
export type MiraPosture = 'offering' | 'adapting' | 'holding' | 'waiting' | 'completed';

export interface MiraPresence {
  posture: MiraPosture;
  label: string;
  message: string;
}

export function buildMiraPresence(
  pattern: MetabolicPattern,
  state: 'unselected' | 'accepted' | 'deferred' | 'completed',
  adapted: boolean,
): MiraPresence {
  if (state === 'completed') {
    return {
      posture: 'completed',
      label: 'Mira logged this',
      message: 'Tomorrow’s suggestion can use the next approved signal or check-in.',
    };
  }

  if (state === 'deferred') {
    return {
      posture: 'holding',
      label: 'Mira is holding this',
      message: 'Your choice is saved for later today. There is no penalty for waiting.',
    };
  }

  if (adapted) {
    return {
      posture: 'adapting',
      label: 'Mira adjusted this',
      message: 'The goal stays in scope; the next version is smaller for your day.',
    };
  }

  if (state === 'accepted') {
    return {
      posture: 'waiting',
      label: 'Mira is waiting for your update',
      message: 'Act in real life when it works for you, or rehearse the same choice first.',
    };
  }

  return {
    posture: 'offering',
    label: 'Mira noticed a pattern',
    message:
      pattern.source === 'demo'
        ? 'This is a labelled example. Mira prepared one bounded option to explore it.'
        : 'Mira prepared one bounded option from this signal or check-in. You stay in control.',
  };
}
