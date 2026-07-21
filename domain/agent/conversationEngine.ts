/**
 * Conversation engine — the state machine that drives Mira's
 * proactive, contextual responses.
 *
 * This is the brain of the agentic experience. It:
 * 1. Generates Mira's opening line based on current state + memory
 * 2. Maps parsed intents to state transitions
 * 3. Produces deterministic responses for mission actions
 * 4. Defers to the LLM for free-form chat
 *
 * The engine is synchronous and deterministic for mission actions
 * (accept, decline, easier, later, done, not_done). For free-form
 * chat, it returns a signal that the caller should invoke the LLM
 * via useCoach.ask().
 *
 * The key differentiation: Mira initiates. The opening line is not
 * "Welcome to Sukari" — it's a contextual observation that references
 * what happened before.
 */
import type { ProgrammeMission, PatientReportedOutcome } from '@/domain/programme/types';
import type { MetabolicPattern } from '@/domain/patterns/types';
import type { SukariMiraPresence } from '@/domain/agent/miraPresence';
import { buildMiraPresence, steadyPresence } from '@/domain/agent/miraPresence';
import { buildMissionAdaptation } from '@/domain/agent/decisionTrace';
import type { ConversationIntent } from '@/domain/agent/intentParser';
import type { ConversationMemory } from '@/domain/agent/conversationMemory';
import { contextSummary } from '@/domain/agent/conversationMemory';

export type ConversationPhase =
  | 'greeting'      // Mira's opening line, before any mission
  | 'offering'      // Mira has proposed a mission, waiting for response
  | 'accepted'      // Patient accepted, Mira is watching
  | 'adapted'       // Mission was made easier or deferred
  | 'completed'     // Patient reported done, Mira logged it
  | 'checking_in';  // Follow-up: how did it go?

export interface ConversationState {
  phase: ConversationPhase;
  mission: ProgrammeMission | null;
  pattern: MetabolicPattern | null;
  adapted: boolean;
  deferred: boolean;
}

export interface ConversationResponse {
  /** Mira's text response. */
  text: string;
  /** Updated conversation state. */
  state: ConversationState;
  /** Updated Mira presence (posture, label, message). */
  presence: SukariMiraPresence;
  /** Whether the caller should also invoke the LLM for this response. */
  shouldEscalateToLLM: boolean;
  /** Whether a mission state change occurred that the caller should persist. */
  missionAction?: MissionAction;
}

export type MissionAction =
  | { kind: 'accept' }
  | { kind: 'make_easier' }
  | { kind: 'later' }
  | { kind: 'complete' }
  | { kind: 'relapse' }
  | { kind: 'capture_outcome'; outcome: PatientReportedOutcome; reflection: string };

/**
 * Build the initial conversation state from the current mission/pattern.
 */
export function initialConversationState(
  mission: ProgrammeMission | null,
  pattern: MetabolicPattern | null,
): ConversationState {
  if (!mission || mission.status === 'assigned') {
    return {
      phase: mission ? 'offering' : 'greeting',
      mission,
      pattern,
      adapted: false,
      deferred: false,
    };
  }
  if (mission.status === 'completed') {
    return { phase: 'completed', mission, pattern, adapted: false, deferred: false };
  }
  if (mission.status === 'practiced') {
    return { phase: 'accepted', mission, pattern, adapted: false, deferred: false };
  }
  return { phase: 'offering', mission, pattern, adapted: false, deferred: false };
}

/**
 * Generate Mira's opening line for a new session.
 *
 * This is the most important differentiator: Mira doesn't say
 * "Welcome." She references what happened before and what she
 * noticed.
 */
export function generateOpeningLine(
  state: ConversationState,
  memory: ConversationMemory,
): string {
  const ctx = contextSummary(memory);

  // First-ever session — warm, simple, leads with observation
  if (!ctx.hasPriorContext) {
    if (state.mission && state.phase === 'offering') {
      return `I noticed a pattern in your evenings. Want to try one small thing today?`;
    }
    return `I'm here. Tell me about your day — or I can suggest one small thing to try.`;
  }

  // Returning patient — reference past context
  const parts: string[] = [];

  if (ctx.lastBarrier && ctx.lastVisitDescription) {
    parts.push(`Last time you mentioned ${summarizeBarrier(ctx.lastBarrier)}.`);
  } else if (ctx.lastVisitDescription) {
    parts.push(`Good to see you — it's been since ${ctx.lastVisitDescription}.`);
  }

  if (ctx.completionCount > 0 && ctx.lastCompletedAction) {
    if (ctx.completionCount === 1) {
      parts.push(`You completed ${ctx.lastCompletedAction.toLowerCase()} last time. That's a real step.`);
    } else {
      parts.push(`You've completed ${ctx.completionCount} missions so far. The last one was ${ctx.lastCompletedAction.toLowerCase()}.`);
    }
  }

  // Reference the last patient-reported outcome — this is what makes
  // the closed loop visible to the patient. Mira remembers what they
  // told her about how it went, not just that they completed it.
  if (ctx.lastOutcome) {
    const behaviour = ctx.lastOutcome.behaviourTarget.replace(/_/g, ' ');
    const difficultyPart =
      ctx.lastOutcome.feltDifficulty === 'easier'
        ? `felt easier than expected`
        : ctx.lastOutcome.feltDifficulty === 'harder'
          ? `felt harder than expected`
          : `felt about right`;
    const differencePart =
      ctx.lastOutcome.noticedDifference === 'yes'
        ? ` and you noticed a difference`
        : ctx.lastOutcome.noticedDifference === 'no'
          ? ` though you hadn't noticed a difference yet`
          : '';
    parts.push(`You said ${behaviour} ${difficultyPart}${differencePart}.`);
  }

  // Current state
  if (state.phase === 'offering' && state.mission) {
    if (parts.length > 0) {
      // If the patient has a past outcome, signal that this suggestion
      // is informed by it. This makes the closed loop visible: the
      // patient knows their outcome reports are shaping what Mira suggests.
      if (ctx.lastOutcome) {
        if (ctx.lastOutcome.feltDifficulty === 'harder') {
          parts.push(`Based on that, I'm suggesting something different today. Want to hear it?`);
        } else if (ctx.lastOutcome.feltDifficulty === 'easier' && ctx.lastOutcome.noticedDifference === 'yes') {
          parts.push(`Building on what worked — I have something for today. Want to try it?`);
        } else {
          parts.push(`Today I'm seeing another opportunity. Want to hear it?`);
        }
      } else {
        parts.push(`Today I'm seeing another opportunity. Want to hear it?`);
      }
    } else {
      parts.push(`I noticed something in your pattern today. Want to try one small thing?`);
    }
  } else if (state.phase === 'accepted') {
    parts.push(`How did the mission go? You can tell me about it whenever you're ready.`);
  } else if (state.phase === 'completed') {
    parts.push(`You logged a completion recently. How are you feeling about it?`);
  } else if (state.phase === 'adapted') {
    parts.push(`We adjusted your last mission. How's the smaller version working?`);
  }

  return parts.join(' ');
}

function summarizeBarrier(barrier: string): string {
  const lower = barrier.toLowerCase();
  if (lower.includes('evening') || lower.includes('night')) return 'evenings were hard';
  if (lower.includes('work') || lower.includes('busy')) return 'work was busy';
  if (lower.includes('travel')) return 'you were traveling';
  if (lower.includes('tired') || lower.includes('energy')) return 'you were tired';
  if (lower.includes('too hard') || lower.includes('too much')) return 'it felt like too much';
  return lower.replace(/^(i |i'm |it's )/, '');
}

/**
 * Process a user intent and produce Mira's response + state transition.
 *
 * For mission intents (accept, decline, easier, later, done, not_done),
 * the response is deterministic and instant — no LLM call needed.
 * For chat intents, the caller should invoke the LLM.
 */
export function processIntent(
  intent: ConversationIntent,
  state: ConversationState,
  memory: ConversationMemory,
): ConversationResponse {
  const ctx = contextSummary(memory);

  switch (intent.kind) {
    case 'accept': {
      const newState: ConversationState = { ...state, phase: 'accepted' };
      const presence = state.pattern
        ? buildMiraPresence(state.pattern, 'accepted', false)
        : steadyPresence();
      const responses = [
        'Good. I\'ll check back tomorrow morning. You can tell me how it went whenever you\'re ready.',
        'Okay. Do it when the moment is right today. I\'m here when you need me.',
        'That\'s the one. I\'ll be watching for how it goes.',
      ];
      return {
        text: pickResponse(responses, intent),
        state: newState,
        presence,
        shouldEscalateToLLM: false,
        missionAction: { kind: 'accept' },
      };
    }

    case 'make_easier': {
      const adaptation = state.mission
        ? buildMissionAdaptation(state.mission.templateId, 'easier')
        : null;
      const newState: ConversationState = { ...state, phase: 'adapted', adapted: true };
      const presence = state.pattern
        ? buildMiraPresence(state.pattern, 'accepted', true)
        : steadyPresence();
      const text = adaptation
        ? `Okay — let's make it smaller. ${adaptation.action} Same idea, just a lighter step. Does that work?`
        : 'Okay, let\'s find something smaller. What part feels like too much?';
      return {
        text,
        state: newState,
        presence,
        shouldEscalateToLLM: false,
        missionAction: { kind: 'make_easier' },
      };
    }

    case 'later': {
      const newState: ConversationState = { ...state, phase: 'adapted', deferred: true };
      const presence = state.pattern
        ? buildMiraPresence(state.pattern, 'deferred', false)
        : steadyPresence();
      return {
        text: 'No problem. I\'ll hold this for you. Come back when the moment is right — there\'s no penalty for waiting.',
        state: newState,
        presence,
        shouldEscalateToLLM: false,
        missionAction: { kind: 'later' },
      };
    }

    case 'decline': {
      const newState: ConversationState = { ...state, phase: 'greeting', mission: null };
      const presence = steadyPresence();
      const reasonPart = intent.reason ? ` You mentioned ${summarizeBarrier(intent.reason)}.` : '';
      const text = `That's fair.${reasonPart} I won't push. Want to talk about what would work better, or should I come back to you tomorrow with something different?`;
      return {
        text,
        state: newState,
        presence,
        shouldEscalateToLLM: false,
      };
    }

    case 'done': {
      const newState: ConversationState = { ...state, phase: 'completed' };
      const presence = state.pattern
        ? buildMiraPresence(state.pattern, 'completed', false)
        : steadyPresence();
      const detailPart = intent.detail ? ` You said you ${intent.detail}.` : '';
      const responses = [
        `Logged.${detailPart} That's real. How do you feel it went?`,
        `I've got that.${detailPart} One step at a time. How was it?`,
        `Noted.${detailPart} I'll use this to shape what I suggest next. Any thoughts on how it felt?`,
      ];
      return {
        text: pickResponse(responses, intent),
        state: newState,
        presence,
        shouldEscalateToLLM: false,
        missionAction: { kind: 'complete' },
      };
    }

    case 'not_done': {
      const newState: ConversationState = { ...state, phase: 'greeting' };
      const presence = steadyPresence();
      const reasonPart = intent.reason ? ` ${summarizeBarrier(intent.reason)}.` : '';
      const text = `That's okay.${reasonPart} No judgment. Want me to suggest something smaller, or should we try again tomorrow?`;
      return {
        text,
        state: newState,
        presence,
        shouldEscalateToLLM: false,
        missionAction: { kind: 'relapse' },
      };
    }

    case 'report_outcome': {
      const newState: ConversationState = { ...state, phase: 'checking_in' };
      const presence = state.pattern
        ? buildMiraPresence(state.pattern, 'completed', false)
        : steadyPresence();

      const outcome: PatientReportedOutcome = {
        feltDifficulty: intent.feltDifficulty,
        noticedDifference: intent.noticedDifference,
        reportedAt: Date.now(),
      };

      // Deterministic acknowledgment that references the outcome without
      // making causal claims. Stays observational: "you noticed" not "it caused."
      const difficultyAck =
        intent.feltDifficulty === 'easier'
          ? "That's encouraging — easier than expected is a good sign it fits."
          : intent.feltDifficulty === 'harder'
            ? "Harder than expected is useful to know. I'll factor that into what I suggest next."
            : "Good to know it felt about right.";

      const differenceAck =
        intent.noticedDifference === 'yes'
          ? " You noticed a difference — I'll remember that."
          : intent.noticedDifference === 'no'
            ? " No difference noticed yet — that's normal early on. The pattern matters more over time."
            : " Hard to tell so far. That's honest.";

      const responses = [
        `${difficultyAck}${differenceAck} I've logged this.`,
        `${difficultyAck}${differenceAck} Thank you for telling me — this helps me suggest better next time.`,
        `Got it.${difficultyAck}${differenceAck} This is the kind of detail that shapes what comes next.`,
      ];

      return {
        text: pickResponse(responses, intent),
        state: newState,
        presence,
        shouldEscalateToLLM: false,
        missionAction: { kind: 'capture_outcome', outcome, reflection: intent.reflection },
      };
    }

    case 'how_was_it': {
      const newState: ConversationState = { ...state, phase: 'checking_in' };
      const presence = state.pattern
        ? buildMiraPresence(state.pattern, 'completed', false)
        : steadyPresence();
      // How-was-it questions should escalate to LLM for a contextual answer
      return {
        text: '',
        state: newState,
        presence,
        shouldEscalateToLLM: true,
      };
    }

    case 'chat': {
      // Free-form conversation — escalate to LLM
      const presence = steadyPresence();
      return {
        text: '',
        state,
        presence,
        shouldEscalateToLLM: true,
      };
    }
  }
}

function pickResponse(responses: string[], intent: ConversationIntent): string {
  // Deterministic pick based on intent kind hash
  const seed = intent.kind.length + (intent.kind === 'chat' ? 0 : intent.kind === 'done' ? 1 : 2);
  return responses[seed % responses.length];
}

/**
 * Build a context string for the LLM when escalating chat intents.
 * This gives the LLM the conversation history and current mission
 * context so its responses are grounded.
 */
export function buildLLMContext(
  state: ConversationState,
  memory: ConversationMemory,
): string {
  const ctx = contextSummary(memory);
  const parts: string[] = [];

  parts.push('Current conversation context:');
  if (state.mission) {
    parts.push(`- Active mission: ${state.mission.realWorldAction}`);
    parts.push(`- Mission status: ${state.mission.status}`);
    parts.push(`- Conversation phase: ${state.phase}`);
  }
  if (state.pattern) {
    parts.push(`- Pattern detected: ${state.pattern.headline}`);
    parts.push(`- Pattern explanation: ${state.pattern.explanation}`);
  }
  if (ctx.completionCount > 0) {
    parts.push(`- Patient has completed ${ctx.completionCount} missions total.`);
  }
  if (ctx.lastBarrier) {
    parts.push(`- Patient's last stated barrier: ${ctx.lastBarrier}`);
  }
  parts.push('- Safety: habits only. Never dosing, diagnosis, or causal claims.');
  parts.push('- Voice: warm, restrained, second person. Short sentences. One idea per line.');

  return parts.join('\n');
}
