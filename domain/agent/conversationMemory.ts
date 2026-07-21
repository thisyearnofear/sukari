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
  lastCompletedAction?: string;
  sessionsAgo: number;
  lastVisitDescription: string;
} {
  const lastBarrier = memory.facts.find((f) => f.key === 'last_barrier')?.value;
  const completionCountStr = memory.facts.find((f) => f.key === 'completion_count')?.value;
  const completionCount = completionCountStr ? parseInt(completionCountStr, 10) : 0;
  const lastCompletedAction = memory.facts.find((f) => f.key === 'last_completed_action')?.value;

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
    lastCompletedAction,
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
