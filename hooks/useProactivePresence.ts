/**
 * useProactivePresence — derives Mira's posture from time of day and
 * mission state, so the orb shifts proactively without the user tapping it.
 *
 * Posture transitions driven by operational signals, not guessed emotion:
 *
 * - App opens + mission ready, not yet seen → `arriving` → `offering`
 * - Mission accepted, no signal logged by evening → `watching` (gentle nudge)
 * - Mission deferred → `holding` (stays until user returns)
 * - Mission completed → `completed` for a beat, then `steady`
 * - No mission, idle → `steady`
 *
 * The hook returns a SukariMiraPresence and a boolean `justArrived` flag
 * that fires once on app open when a mission is waiting — used to play
 * the arrival animation.
 */
import { useEffect, useRef, useState } from 'react';
import type { ProgrammeMission } from '@/domain/programme';
import {
  buildMiraPresence,
  steadyPresence,
  postureMorph,
  type SukariMiraPresence,
} from '@/domain/agent';
import type { MetabolicPattern } from '@/domain/patterns';

interface ProactivePresenceInput {
  pattern: MetabolicPattern | null;
  mission: ProgrammeMission | null;
  missionChoice: string | null;
  deferred: boolean;
  /** Has the user seen the mission card this session? */
  hasSeenMission: boolean;
}

interface ProactivePresenceResult {
  presence: SukariMiraPresence;
  /** True for ~1.2s on app open when a mission is waiting and unseen. */
  justArrived: boolean;
}

/** Evening threshold — after 18:00, an accepted mission with no signal shifts to watching. */
const EVENING_HOUR = 18;
/** How long the arrival animation plays before settling to offering. */
const ARRIVAL_MS = 1200;

/** Arrival presence — warm expansion, Mira acknowledges you're here. */
function arrivingPresence(): SukariMiraPresence {
  return {
    posture: 'arriving',
    valence: 0.1,
    reaction: null,
    label: 'You’re back',
    message: 'Something is ready for you.',
    morph: postureMorph('arriving', 0.1),
  };
}

export function useProactivePresence(input: ProactivePresenceInput): ProactivePresenceResult {
  const { pattern, mission, missionChoice, deferred, hasSeenMission } = input;
  const [justArrived, setJustArrived] = useState(false);
  const arrivalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenRef = useRef(hasSeenMission);

  const hour = new Date().getHours();
  const isEvening = hour >= EVENING_HOUR;

  const done = mission?.status === 'completed';
  const accepted = !!missionChoice && missionChoice !== 'not_practical';
  const hasMission = !!mission && !!pattern;

  // Arrival: fires once when app opens with a mission ready and unseen.
  useEffect(() => {
    const shouldArrive = hasMission && !done && !accepted && !deferred && !seenRef.current;
    if (shouldArrive) {
      setJustArrived(true);
      seenRef.current = true;
      arrivalTimer.current = setTimeout(() => setJustArrived(false), ARRIVAL_MS);
    } else {
      seenRef.current = hasSeenMission;
    }
    return () => {
      if (arrivalTimer.current) clearTimeout(arrivalTimer.current);
    };
  }, [hasMission, done, accepted, deferred, hasSeenMission]);

  // Build the presence from the current state.
  let presence: SukariMiraPresence;

  if (!hasMission) {
    presence = steadyPresence();
  } else if (justArrived && !done) {
    presence = arrivingPresence();
  } else if (done) {
    presence = buildMiraPresence(pattern!, 'completed', false);
  } else if (deferred) {
    presence = buildMiraPresence(pattern!, 'deferred', false);
  } else if (accepted) {
    presence = buildMiraPresence(pattern!, 'accepted', false);
    // Evening nudge — slightly higher valence to make the watching posture
    // feel a touch more present without changing the posture itself.
    if (isEvening) {
      presence = { ...presence, valence: 0.1, morph: postureMorph('watching', 0.1) };
    }
  } else {
    presence = buildMiraPresence(pattern!, 'unselected', false);
  }

  return { presence, justArrived };
}
