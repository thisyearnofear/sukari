import type { MetabolicPattern } from '@/domain/patterns';
import type { MiraPresence, Valence, MorphParams } from './miraContract';
import { postureMorph } from './miraContract';

/**
 * Mira is Famile's shared agent identity. A posture is derived from an
 * operational state, never guessed emotion or clinical judgement.
 *
 * This module is Sukari's projection from programme state to MiraPresence.
 * The posture vocabulary, morph params, and voice rules live in
 * miraContract.ts — the network-wide contract. See famile/web/docs/MIRA.md.
 * Types are re-exported from miraContract via domain/agent/index.ts.
 */

/**
 * Sukari's posture subset. Steady is the idle/landing state; the other five
 * are the active programme states. Renamed `waiting` → `watching` and added
 * `steady` to align with the network vocabulary.
 */
export type SukariPosture = 'steady' | 'offering' | 'adapting' | 'holding' | 'watching' | 'completed';

export interface SukariMiraPresence extends MiraPresence {
  morph: MorphParams;
}

/**
 * Derive valence from programme state. Sukari keeps this gentle — most
 * states are settled (0) or slightly positive. Only a deferred-then-eased
 * pattern introduces mild tension.
 */
function deriveValence(
  state: 'unselected' | 'accepted' | 'deferred' | 'completed',
  adapted: boolean,
): Valence {
  if (adapted) return 0.15; // slight disruption absorbed
  if (state === 'deferred') return -0.1; // settled, holding
  return 0;
}

export function buildMiraPresence(
  pattern: MetabolicPattern,
  state: 'unselected' | 'accepted' | 'deferred' | 'completed',
  adapted: boolean,
): SukariMiraPresence {
  const valence = deriveValence(state, adapted);

  if (state === 'completed') {
    return withMorph({
      posture: 'completed',
      valence,
      reaction: null,
      label: 'Logged',
      message: 'Tomorrow’s suggestion can use the next approved signal or check-in.',
    });
  }

  if (state === 'deferred') {
    return withMorph({
      posture: 'holding',
      valence,
      reaction: null,
      label: 'Holding this for you',
      message: 'Your choice is saved for later today. There is no penalty for waiting.',
    });
  }

  if (adapted) {
    return withMorph({
      posture: 'adapting',
      valence,
      reaction: { kind: 'settle', eventId: `adapt-${Date.now()}` },
      label: 'Adjusted for you',
      message: 'The goal stays in scope; the next version is smaller for your day.',
    });
  }

  if (state === 'accepted') {
    return withMorph({
      posture: 'watching',
      valence,
      reaction: null,
      label: 'Waiting on your update',
      message: 'Act in real life when it works for you, or rehearse the same choice first.',
    });
  }

  return withMorph({
    posture: 'offering',
    valence,
    reaction: null,
    label: 'Mira noticed a pattern',
    message:
      pattern.source === 'demo'
        ? 'This is a labelled example. One bounded option to explore it.'
        : 'One bounded option from this signal or check-in. You stay in control.',
  });
}

/**
 * The steady/landing presence. Used before a mission is built or when the
 * programme is idle. Previously Sukari had no idle posture — the orb was
 * forced into an active state. Steady lets Mira be quiet when nothing is
 * happening.
 */
export function steadyPresence(): SukariMiraPresence {
  return withMorph({
    posture: 'steady',
    valence: 0,
    reaction: null,
    label: 'Mira',
    message: 'Here when you’re ready.',
  });
}

function withMorph(p: MiraPresence): SukariMiraPresence {
  return { ...p, morph: postureMorph(p.posture, p.valence) };
}
