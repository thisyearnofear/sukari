import { parseIntent, intentToMissionEase } from '@/domain/agent/intentParser';
import {
  initialConversationState,
  generateOpeningLine,
  processIntent,
} from '@/domain/agent/conversationEngine';
import {
  emptyConversationMemory,
  markSessionOpened,
  appendTurn,
  contextSummary,
} from '@/domain/agent/conversationMemory';
import type { ProgrammeMission } from '@/domain/programme/types';
import type { MetabolicPattern } from '@/domain/patterns/types';

const mockPattern: MetabolicPattern = {
  id: 'test-pattern',
  kind: 'evening_excursion',
  headline: 'Evening glucose running higher',
  explanation: 'Your evenings have been elevated this week.',
  evidence: [],
  dataCoverage: 0.8,
  whySeeingThis: 'CGM data shows a pattern.',
  safetyBoundary: 'Habits only.',
  suggestedBehaviour: 'post_meal_walk',
  suggestedExperiment: 'Walk after dinner',
  whyThisExperiment: 'Movement may help.',
  source: 'demo',
  detectedAt: Date.now(),
};

const mockMission: ProgrammeMission = {
  id: 'test-mission',
  dateKey: '2025-01-01',
  behaviourTarget: 'post_meal_walk',
  templateId: 'post_meal_walk',
  realmCopy: 'Take a walk',
  realWorldAction: 'Walk for 10 minutes after dinner.',
  transferHint: 'Try it tonight.',
  caregiverSupportAction: 'Ask someone to walk with you.',
  status: 'assigned',
  source: 'rules',
};

describe('intentParser', () => {
  it('parses accept intents', () => {
    expect(parseIntent('ok').kind).toBe('accept');
    expect(parseIntent('sure').kind).toBe('accept');
    expect(parseIntent("yeah I'll do it").kind).toBe('accept');
    expect(parseIntent('sounds good').kind).toBe('accept');
  });

  it('parses make_easier intents', () => {
    expect(parseIntent('too hard').kind).toBe('make_easier');
    expect(parseIntent('something easier').kind).toBe('make_easier');
    expect(parseIntent("that's too much").kind).toBe('make_easier');
  });

  it('parses later intents', () => {
    expect(parseIntent('maybe later').kind).toBe('later');
    expect(parseIntent('not now').kind).toBe('later');
    expect(parseIntent('after dinner').kind).toBe('later');
  });

  it('parses done intents with detail', () => {
    const result = parseIntent('I walked for 10 minutes');
    expect(result.kind).toBe('done');
    if (result.kind === 'done') {
      expect(result.detail).toBeTruthy();
    }
  });

  it('parses not_done intents', () => {
    expect(parseIntent("didn't do it").kind).toBe('not_done');
    expect(parseIntent('forgot').kind).toBe('not_done');
    expect(parseIntent("couldn't make it").kind).toBe('not_done');
  });

  it('falls back to chat for unstructured input', () => {
    expect(parseIntent('what is my glucose level').kind).toBe('chat');
    expect(parseIntent('tell me about protein').kind).toBe('chat');
  });

  it('maps intents to mission ease', () => {
    expect(intentToMissionEase({ kind: 'make_easier' })).toBe('easier');
    expect(intentToMissionEase({ kind: 'later' })).toBe('not_practical');
    expect(intentToMissionEase({ kind: 'decline' })).toBe('not_practical');
    expect(intentToMissionEase({ kind: 'accept' })).toBe('accept');
    expect(intentToMissionEase({ kind: 'chat', text: 'hi' })).toBeNull();
  });
});

describe('conversationEngine', () => {
  it('generates a first-session opening line', () => {
    const state = initialConversationState(mockMission, mockPattern);
    const mem = markSessionOpened(emptyConversationMemory());
    const opening = generateOpeningLine(state, mem);
    expect(opening).toContain('pattern');
    expect(opening.length).toBeGreaterThan(10);
  });

  it('generates a returning-session opening line with context', () => {
    const state = initialConversationState(mockMission, mockPattern);
    let mem = markSessionOpened(emptyConversationMemory());
    // Simulate a past session with a barrier
    mem = appendTurn(
      mem,
      { id: 't1', role: 'user', content: 'evenings are hard for me', timestamp: Date.now() - 86400000, intent: 'decline' },
      mockMission,
      mockPattern,
    );
    mem = appendTurn(
      mem,
      { id: 't2', role: 'assistant', content: 'That\'s fair.', timestamp: Date.now() - 86400000 },
      mockMission,
      mockPattern,
    );
    mem = markSessionOpened(mem);
    const opening = generateOpeningLine(state, mem);
    expect(opening.toLowerCase()).toContain('evening');
  });

  it('processes accept intent and transitions to accepted state', () => {
    const state = initialConversationState(mockMission, mockPattern);
    const mem = emptyConversationMemory();
    const response = processIntent({ kind: 'accept' }, state, mem);
    expect(response.state.phase).toBe('accepted');
    expect(response.missionAction?.kind).toBe('accept');
    expect(response.shouldEscalateToLLM).toBe(false);
    expect(response.text.length).toBeGreaterThan(5);
  });

  it('processes make_easier intent and transitions to adapted state', () => {
    const state = initialConversationState(mockMission, mockPattern);
    const mem = emptyConversationMemory();
    const response = processIntent({ kind: 'make_easier' }, state, mem);
    expect(response.state.phase).toBe('adapted');
    expect(response.state.adapted).toBe(true);
    expect(response.missionAction?.kind).toBe('make_easier');
    expect(response.text.toLowerCase()).toContain('smaller');
  });

  it('processes done intent and transitions to completed state', () => {
    const state = initialConversationState(mockMission, mockPattern);
    const mem = emptyConversationMemory();
    const response = processIntent({ kind: 'done', detail: 'walked for 10 minutes' }, state, mem);
    expect(response.state.phase).toBe('completed');
    expect(response.missionAction?.kind).toBe('complete');
    expect(response.text).toContain('walked');
  });

  it('escalates chat intents to LLM', () => {
    const state = initialConversationState(mockMission, mockPattern);
    const mem = emptyConversationMemory();
    const response = processIntent({ kind: 'chat', text: 'what is protein?' }, state, mem);
    expect(response.shouldEscalateToLLM).toBe(true);
    expect(response.text).toBe('');
  });
});

describe('conversationMemory', () => {
  it('tracks completion count across turns', () => {
    let mem = emptyConversationMemory();
    mem = appendTurn(
      mem,
      { id: 't1', role: 'user', content: 'I did it', timestamp: Date.now(), intent: 'done' },
      mockMission,
      mockPattern,
    );
    const ctx = contextSummary(mem);
    expect(ctx.completionCount).toBe(1);
  });

  it('tracks barriers from decline intents', () => {
    let mem = emptyConversationMemory();
    mem = appendTurn(
      mem,
      { id: 't1', role: 'user', content: 'evenings are too hard', timestamp: Date.now(), intent: 'decline' },
      mockMission,
      mockPattern,
    );
    const ctx = contextSummary(mem);
    expect(ctx.lastBarrier).toContain('hard');
  });

  it('increments session count on open', () => {
    let mem = emptyConversationMemory();
    mem = markSessionOpened(mem);
    mem = markSessionOpened(mem);
    expect(mem.sessionCount).toBe(2);
  });
});
