/**
 * Conversation memory — persists conversation turns across sessions
 * so Mira can reference what happened before.
 *
 * This is what makes Mira feel like an agent that remembers you,
 * not a chatbot that resets every session. When the patient opens
 * the app, Mira can say "Last time you said evenings were hard.
 * How's this week going?" instead of starting from scratch.
 *
 * Storage: AsyncStorage under `sukari.conversationMemory`.
 * Retention: last 50 turns + derived context summaries.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProgrammeMission } from '@/domain/programme/types';
import type { MetabolicPattern } from '@/domain/patterns/types';

const STORAGE_KEY = 'sukari.conversationMemory';
const MAX_TURNS = 50;

export interface ConversationTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  /** The mission state when this turn happened. */
  missionState?: ConversationMissionState;
  /** The intent detected from user input, if any. */
  intent?: string;
}

export interface ConversationMissionState {
  missionId?: string;
  missionStatus?: string;
  behaviourTarget?: string;
  realWorldAction?: string;
}

export interface ConversationMemory {
  turns: ConversationTurn[];
  /** Derived facts Mira can reference. */
  facts: ConversationFact[];
  /** The last time the patient opened the app. */
  lastOpenedAt: number | null;
  /** The last mission the patient completed. */
  lastCompletedAction?: string;
  /** The last reason the patient gave for declining or struggling. */
  lastBarrier?: string;
  /** How many sessions the patient has had. */
  sessionCount: number;
  /** Last patient-reported outcome summary, so Mira can reference it
   *  in her opening line: "Last time you said post_meal_walk felt easier
   *  and you noticed a difference." */
  lastOutcome?: {
    behaviourTarget: string;
    feltDifficulty: 'easier' | 'about_right' | 'harder';
    noticedDifference: 'yes' | 'no' | 'not_sure';
  };
}

export interface ConversationFact {
  key: string;
  value: string;
  timestamp: number;
}

export function emptyConversationMemory(): ConversationMemory {
  return {
    turns: [],
    facts: [],
    lastOpenedAt: null,
    sessionCount: 0,
  };
}

/**
 * Parse a stored last_outcome fact back into its structured form.
 * Returns undefined if the fact is missing or malformed.
 */
function parseOutcomeFact(
  raw: string | undefined,
): ConversationMemory['lastOutcome'] {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as {
      behaviourTarget: string;
      feltDifficulty: 'easier' | 'about_right' | 'harder';
      noticedDifference: 'yes' | 'no' | 'not_sure';
    };
    return parsed;
  } catch {
    return undefined;
  }
}

/**
 * Load conversation memory from AsyncStorage.
 * Returns empty memory if nothing is stored or storage fails.
 */
export async function loadConversationMemory(): Promise<ConversationMemory> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyConversationMemory();
    const parsed = JSON.parse(raw) as ConversationMemory;
    return {
      ...emptyConversationMemory(),
      ...parsed,
      turns: (parsed.turns ?? []).slice(-MAX_TURNS),
    };
  } catch {
    return emptyConversationMemory();
  }
}

/**
 * Persist conversation memory to AsyncStorage.
 */
export async function saveConversationMemory(memory: ConversationMemory): Promise<void> {
  try {
    const trimmed: ConversationMemory = {
      ...memory,
      turns: memory.turns.slice(-MAX_TURNS),
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Silent fail — conversation memory is a nice-to-have, not critical.
  }
}

/**
 * Append a turn to memory and derive facts from it.
 *
 * Facts are extracted from user messages so Mira can reference them
 * naturally: "you said evenings were hard", "you've done this three
 * times", "you mentioned work travel last week".
 */
export function appendTurn(
  memory: ConversationMemory,
  turn: ConversationTurn,
  mission?: ProgrammeMission | null,
  pattern?: MetabolicPattern | null,
): ConversationMemory {
  const turns = [...memory.turns, turn].slice(-MAX_TURNS);
  const facts = [...memory.facts];

  // Derive facts from user turns
  if (turn.role === 'user') {
    const lower = turn.content.toLowerCase();

    // Capture barrier reasons
    if (
      turn.intent === 'decline' ||
      turn.intent === 'not_done' ||
      lower.includes('hard') ||
      lower.includes('difficult') ||
      lower.includes('busy') ||
      lower.includes('tired') ||
      lower.includes('travel') ||
      lower.includes('work')
    ) {
      const barrierFact = facts.find((f) => f.key === 'last_barrier');
      const newFact: ConversationFact = {
        key: 'last_barrier',
        value: turn.content,
        timestamp: turn.timestamp,
      };
      if (barrierFact) {
        const idx = facts.indexOf(barrierFact);
        facts[idx] = newFact;
      } else {
        facts.push(newFact);
      }
    }

    // Track completions
    if (turn.intent === 'done') {
      const completionCount = facts.find((f) => f.key === 'completion_count');
      const count = completionCount ? parseInt(completionCount.value, 10) + 1 : 1;
      const newFact: ConversationFact = {
        key: 'completion_count',
        value: String(count),
        timestamp: turn.timestamp,
      };
      if (completionCount) {
        const idx = facts.indexOf(completionCount);
        facts[idx] = newFact;
      } else {
        facts.push(newFact);
      }

      const lastActionFact: ConversationFact = {
        key: 'last_completed_action',
        value: mission?.realWorldAction ?? 'your last mission',
        timestamp: turn.timestamp,
      };
      const existingAction = facts.find((f) => f.key === 'last_completed_action');
      if (existingAction) {
        const idx = facts.indexOf(existingAction);
        facts[idx] = lastActionFact;
      } else {
        facts.push(lastActionFact);
      }
    }

    // Track noticed-difference count — used to mark the first time
    // a patient notices a difference from a mission. That moment is
    // the emotional core of the product and worth naming.
    if (turn.intent === 'report_outcome' && mission?.reportedOutcome?.noticedDifference === 'yes') {
      const existing = facts.find((f) => f.key === 'noticed_difference_count');
      const count = existing ? parseInt(existing.value, 10) + 1 : 1;
      const newFact: ConversationFact = {
        key: 'noticed_difference_count',
        value: String(count),
        timestamp: turn.timestamp,
      };
      if (existing) {
        const idx = facts.indexOf(existing);
        facts[idx] = newFact;
      } else {
        facts.push(newFact);
      }
    }

    // Track patient-reported outcomes — store as a fact so Mira can
    // reference it in her opening line: "Last time you said post_meal_walk
    // felt easier and you noticed a difference."
    if (turn.intent === 'report_outcome' && mission?.behaviourTarget) {
      const outcomeFact: ConversationFact = {
        key: 'last_outcome',
        value: JSON.stringify({
          behaviourTarget: mission.behaviourTarget,
          feltDifficulty: mission.reportedOutcome?.feltDifficulty ?? 'about_right',
          noticedDifference: mission.reportedOutcome?.noticedDifference ?? 'not_sure',
        }),
        timestamp: turn.timestamp,
      };
      const existing = facts.find((f) => f.key === 'last_outcome');
      if (existing) {
        const idx = facts.indexOf(existing);
        facts[idx] = outcomeFact;
      } else {
        facts.push(outcomeFact);
      }

      // Store the free-form reflection separately — this is the most
      // human, specific thing the patient offered. Referencing it later
      // makes Mira feel like she listened, not just parsed.
      if (mission.reflection && mission.reflection.trim().length > 0) {
        const reflectionFact: ConversationFact = {
          key: 'last_reflection',
          value: mission.reflection.trim(),
          timestamp: turn.timestamp,
        };
        const existingReflection = facts.find((f) => f.key === 'last_reflection');
        if (existingReflection) {
          const idx = facts.indexOf(existingReflection);
          facts[idx] = reflectionFact;
        } else {
          facts.push(reflectionFact);
        }
      }
    }
  }

  // Derive mission state snapshot
  const missionState: ConversationMissionState | undefined = mission
    ? {
        missionId: mission.id,
        missionStatus: mission.status,
        behaviourTarget: mission.behaviourTarget,
        realWorldAction: mission.realWorldAction,
      }
    : undefined;

  const lastTurn = turns[turns.length - 1];
  if (lastTurn && missionState) {
    turns[turns.length - 1] = { ...lastTurn, missionState };
  }

  return {
    ...memory,
    turns,
    facts,
    lastCompletedAction: facts.find((f) => f.key === 'last_completed_action')?.value,
    lastBarrier: facts.find((f) => f.key === 'last_barrier')?.value,
    lastOutcome: parseOutcomeFact(facts.find((f) => f.key === 'last_outcome')?.value),
  };
}

/**
 * Mark a session opening — increments session count and updates lastOpenedAt.
 */
export function markSessionOpened(memory: ConversationMemory): ConversationMemory {
  return {
    ...memory,
    lastOpenedAt: Date.now(),
    sessionCount: memory.sessionCount + 1,
  };
}

/**
 * Generate a context summary that Mira can use in her opening line.
 *
 * This is what makes Mira feel like she remembers the patient:
 * "Last time you said evenings were hard. How's this week going?"
 */
export function contextSummary(memory: ConversationMemory): {
  hasPriorContext: boolean;
  lastBarrier?: string;
  completionCount: number;
  noticedDifferenceCount: number;
  lastCompletedAction?: string;
  lastReflection?: string;
  lastOutcome?: {
    behaviourTarget: string;
    feltDifficulty: 'easier' | 'about_right' | 'harder';
    noticedDifference: 'yes' | 'no' | 'not_sure';
  };
  sessionsAgo: number;
  lastVisitDescription: string;
} {
  const lastBarrier = memory.facts.find((f) => f.key === 'last_barrier')?.value;
  const completionCountStr = memory.facts.find((f) => f.key === 'completion_count')?.value;
  const completionCount = completionCountStr ? parseInt(completionCountStr, 10) : 0;
  const noticedDiffStr = memory.facts.find((f) => f.key === 'noticed_difference_count')?.value;
  const noticedDifferenceCount = noticedDiffStr ? parseInt(noticedDiffStr, 10) : 0;
  const lastCompletedAction = memory.facts.find((f) => f.key === 'last_completed_action')?.value;
  const lastReflection = memory.facts.find((f) => f.key === 'last_reflection')?.value;
  const lastOutcome = parseOutcomeFact(memory.facts.find((f) => f.key === 'last_outcome')?.value);

  let lastVisitDescription = '';
  if (memory.lastOpenedAt) {
    const daysAgo = Math.floor((Date.now() - memory.lastOpenedAt) / (1000 * 60 * 60 * 24));
    if (daysAgo === 0) lastVisitDescription = 'earlier today';
    else if (daysAgo === 1) lastVisitDescription = 'yesterday';
    else if (daysAgo < 7) lastVisitDescription = `${daysAgo} days ago`;
    else lastVisitDescription = 'last week';
  }

  return {
    hasPriorContext: memory.turns.length > 0,
    lastBarrier,
    completionCount,
    noticedDifferenceCount,
    lastCompletedAction,
    lastReflection,
    lastOutcome,
    sessionsAgo: memory.sessionCount,
    lastVisitDescription,
  };
}

/**
 * Clear conversation memory (for testing or user reset).
 */
export async function clearConversationMemory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silent fail
  }
}
