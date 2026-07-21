/**
 * Intent parser — interprets natural language patient input as
 * structured mission intents.
 *
 * This is the bridge between free-text conversation and the state
 * machine. It does NOT call an LLM — it uses lightweight pattern
 * matching so the conversation feels instant. The LLM is used
 * separately for generating Mira's natural-language responses.
 *
 * The parser is deliberately permissive: "yeah sure", "ok", "that's
 * too much", "maybe later", "I did it", "actually I walked for like 10
 * minutes" should all resolve to clear intents. When the input doesn't
 * match any mission intent, it falls back to `chat` — a free-form
 * question or comment that Mira should respond to conversationally.
 */
/** Mission ease choice — mirrors the UI-layer MissionEase type. */
export type MissionEase = 'accept' | 'easier' | 'not_practical';

export type ConversationIntent =
  | { kind: 'accept' }
  | { kind: 'decline'; reason?: string }
  | { kind: 'make_easier' }
  | { kind: 'later' }
  | { kind: 'done'; detail?: string }
  | { kind: 'not_done'; reason?: string }
  | { kind: 'how_was_it'; detail?: string }
  | { kind: 'chat'; text: string };

const LOWER = (s: string) => s.toLowerCase().trim();

const ACCEPT_PATTERNS = [
  /^(ok|okay|sure|yes|yeah|yep|yup|alright|fine|sounds good|let'?s do it|i'?ll do it|i can do that|i'?ll try|why not)\b/,
  /^(sounds good|that works|makes sense)\b/,
  /^i'?m in\b/,
  /^go for it\b/,
];

const DECLINE_PATTERNS = [
  /^(no|nope|nah|not really|i don'?t think so|pass|skip)\b/,
  /^(that'?s too|too hard|too much|i can'?t|i cannot|not today|not possible)\b/,
  /^(i don'?t want to|no thanks|no thank you)\b/,
];

const EASIER_PATTERNS = [
  /^(make it easier|easier|something easier|smaller|less|too hard|can'?t do that|that'?s a lot)\b/,
  /^(maybe something smaller|what else|what about something easier)\b/,
  /^(that'?s too much|too ambitious|scale it back)\b/,
];

const LATER_PATTERNS = [
  /^(later|maybe later|not now|tonight|tomorrow|i'?ll do it later|after dinner|after work)\b/,
  /^(i'?ll get to it|give me some time|hold on)\b/,
];

const DONE_PATTERNS = [
  /^(done|did it|i did it|finished|completed|i walked|i went|i ate|i tried|i did)\b/,
  /^(yeah i (did|walked|went|tried|finished))\b/,
  /^(just (did|finished|walked))\b/,
  /^(i (actually )?did (it|that|this))\b/,
];

const NOT_DONE_PATTERNS = [
  /^(didn'?t do it|didn'?t happen|couldn'?t|couldn'?t do it|didn'?t get to it|didn'?t manage)\b/,
  /^(nope didn'?t|forgot|didn'?t have time|didn'?t make it)\b/,
  /^(i (didn'?t|did not|couldn'?t|could not))\b/,
];

const HOW_WAS_IT_PATTERNS = [
  /^(how (did|do)|how'?d it go|how was it|how did i do|results|what happened|did it work)\b/,
  /^(my (glucose|sugar|reading|cgm|numbers))\b/,
];

function matches(text: string, patterns: RegExp[]): string | null {
  const lower = LOWER(text);
  for (const p of patterns) {
    const m = lower.match(p);
    if (m) return m[0];
  }
  return null;
}

/**
 * Parse a patient's free-text input into a structured intent.
 *
 * The parser tries mission intents first (accept, decline, easier,
 * later, done, not_done, how_was_it) and falls back to `chat` —
 * a free-form message Mira should respond to conversationally.
 *
 * The `reason` field on decline/not_done captures the patient's
 * explanation so Mira can reference it later ("you said evenings
 * were hard last time").
 */
export function parseIntent(input: string): ConversationIntent {
  const text = input.trim();
  if (!text) return { kind: 'chat', text };

  if (matches(text, DONE_PATTERNS)) {
    // Try to extract detail: "I walked for 10 minutes" → "walked for 10 minutes"
    const lower = LOWER(text);
    const detailMatch = lower.match(/(?:i|just)\s+(?:actually\s+)?(did|walked|went|tried|finished|ate)\b(.*)/);
    const detail = detailMatch ? `${detailMatch[1]}${detailMatch[2]}`.trim() : undefined;
    return { kind: 'done', detail };
  }

  if (matches(text, NOT_DONE_PATTERNS)) {
    const lower = LOWER(text);
    const reasonMatch = lower.match(/(?:didn'?t|forgot|couldn'?t)\b(.*)/);
    const reason = reasonMatch ? reasonMatch[1].trim() : undefined;
    return { kind: 'not_done', reason };
  }

  if (matches(text, EASIER_PATTERNS)) {
    return { kind: 'make_easier' };
  }

  if (matches(text, LATER_PATTERNS)) {
    return { kind: 'later' };
  }

  if (matches(text, HOW_WAS_IT_PATTERNS)) {
    const lower = LOWER(text);
    const detailMatch = lower.match(/(?:my|the)\s+(glucose|sugar|reading|cgm|numbers?)\b(.*)/);
    const detail = detailMatch ? detailMatch[0] : undefined;
    return { kind: 'how_was_it', detail };
  }

  if (matches(text, ACCEPT_PATTERNS)) {
    return { kind: 'accept' };
  }

  if (matches(text, DECLINE_PATTERNS)) {
    const lower = LOWER(text);
    const reasonMatch = lower.match(/(?:too|that'?s|i can'?t|not)\b(.*)/);
    const reason = reasonMatch ? reasonMatch[0].trim() : undefined;
    return { kind: 'decline', reason };
  }

  return { kind: 'chat', text };
}

/**
 * Map a conversation intent to the MissionEase type used by the
 * existing mission adaptation system, when applicable.
 */
export function intentToMissionEase(intent: ConversationIntent): MissionEase | null {
  switch (intent.kind) {
    case 'make_easier':
      return 'easier';
    case 'later':
    case 'decline':
      return 'not_practical';
    case 'accept':
      return 'accept';
    default:
      return null;
  }
}
