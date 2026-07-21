/**
 * ConversationHome — the conversation-first primary surface.
 *
 * This replaces the mission-card-first layout. The patient opens
 * the app into a conversation with Mira, not a card with buttons.
 *
 * Mira initiates. The patient responds in natural language. The
 * mission, the adaptation, the follow-up, and the completion all
 * happen in one continuous thread.
 *
 * The conversation engine handles mission intents deterministically
 * (accept, easier, later, done, not_done). Free-form chat escalates
 * to the LLM via useCoach.
 *
 * Infrastructure leveraged:
 * - useCoach: LLM streaming for free-form chat
 * - conversationEngine: state machine for mission intents
 * - conversationMemory: cross-session context
 * - MiraOrb: posture-aware visual presence
 * - buildMiraPresence: posture from conversation state
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '@/constants/designSystem';
import { MiraOrb } from '@/components/agent/MiraOrb';
import { PressableScale } from '@/components/ui/PressableScale';
import { useCoach } from '@/hooks/useCoach';
import { track } from '@/utils/analytics';
import type { ProgrammeMission, PatientReportedOutcome } from '@/domain/programme/types';
import type { MetabolicPattern } from '@/domain/patterns/types';
import type { SignalSnapshot } from '@/domain/signals';
import type { UserMode } from '@/types/game';
import {
  parseIntent,
} from '@/domain/agent/intentParser';
import {
  processIntent,
  generateOpeningLine,
  initialConversationState,
  type ConversationState,
} from '@/domain/agent/conversationEngine';
import {
  loadConversationMemory,
  saveConversationMemory,
  markSessionOpened,
  appendTurn,
  contextSummary,
  type ConversationMemory,
} from '@/domain/agent/conversationMemory';
import { steadyPresence, buildMiraPresence, type SukariMiraPresence } from '@/domain/agent/miraPresence';

const P = COLORS.PROGRAMME;

interface ConversationHomeProps {
  mission: ProgrammeMission | null;
  pattern: MetabolicPattern | null;
  signalSnapshot: SignalSnapshot;
  userMode: UserMode | null;
  demoMode: boolean;
  onAccept: () => void;
  onMakeEasier: () => void;
  onLater: () => void;
  onNotPractical: () => void;
  onMarkDone: () => void;
  onRelapse: () => void;
  onCaptureOutcome: (outcome: PatientReportedOutcome, reflection?: string) => void;
  onOpenSettings: () => void;
  onOpenCharter: () => void;
  onOpenCareTeamSummary: () => void;
}

interface ThreadMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

let messageCounter = 0;
function nextId(): string {
  messageCounter += 1;
  return `msg-${Date.now()}-${messageCounter}`;
}

export const ConversationHome: React.FC<ConversationHomeProps> = ({
  mission,
  pattern,
  signalSnapshot,
  userMode,
  demoMode,
  onAccept,
  onMakeEasier,
  onLater,
  onNotPractical,
  onMarkDone,
  onRelapse,
  onCaptureOutcome,
  onOpenSettings,
  onOpenCharter,
  onOpenCareTeamSummary,
}) => {
  const coach = useCoach();
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [input, setInput] = useState('');
  const [presence, setPresence] = useState<SukariMiraPresence>(steadyPresence());
  const [convState, setConvState] = useState<ConversationState>(
    initialConversationState(mission, pattern),
  );
  const [memory, setMemory] = useState<ConversationMemory | null>(null);
  const [opened, setOpened] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const isProcessingRef = useRef(false);

  // Load conversation memory on mount and generate opening line
  useEffect(() => {
    let active = true;
    loadConversationMemory().then((mem) => {
      if (!active || isProcessingRef.current) return;
      const openedMem = markSessionOpened(mem);
      setMemory(openedMem);
      saveConversationMemory(openedMem);

      const state = initialConversationState(mission, pattern);
      setConvState(state);

      const opening = generateOpeningLine(state, openedMem);
      const openingMsg: ThreadMessage = {
        id: nextId(),
        role: 'assistant',
        content: opening,
        timestamp: Date.now(),
      };
      setThread([openingMsg]);

      // Set presence based on initial state
      if (state.phase === 'offering' && pattern) {
        setPresence(buildPresenceFromState(state, pattern));
      }

      setOpened(true);
      track('conversation_opened', {
        phase: state.phase,
        has_prior_context: contextSummary(openedMem).hasPriorContext,
        session_count: openedMem.sessionCount,
      });
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update conversation state when mission changes externally
  useEffect(() => {
    if (!opened) return;
    setConvState((prev) => ({
      ...prev,
      mission,
      pattern,
    }));
  }, [mission, pattern, opened]);

  // Auto-scroll to bottom when thread changes
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [thread, coach.chatReply]);

  const buildPresenceFromState = useCallback(
    (state: ConversationState, pat: MetabolicPattern | null): SukariMiraPresence => {
      if (!pat) return steadyPresence();
      const missionState =
        state.phase === 'completed'
          ? 'completed'
          : state.phase === 'adapted' && state.deferred
            ? 'deferred'
            : state.phase === 'accepted' || state.phase === 'adapted'
              ? 'accepted'
              : 'unselected';
      const adapted = state.phase === 'adapted' && state.adapted && !state.deferred;
      return buildMiraPresence(pat, missionState as 'unselected' | 'accepted' | 'deferred' | 'completed', adapted);
    },
    [],
  );

  const persistTurns = useCallback(
    (userMsg: ThreadMessage, assistantMsg: ThreadMessage, intentKind?: string) => {
      if (!memory) return;
      let updated = appendTurn(
        memory,
        {
          id: userMsg.id,
          role: 'user',
          content: userMsg.content,
          timestamp: userMsg.timestamp,
          intent: intentKind,
        },
        mission,
        pattern,
      );
      updated = appendTurn(
        updated,
        {
          id: assistantMsg.id,
          role: 'assistant',
          content: assistantMsg.content,
          timestamp: assistantMsg.timestamp,
        },
        mission,
        pattern,
      );
      setMemory(updated);
      saveConversationMemory(updated);
    },
    [memory, mission, pattern],
  );

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setInput('');

    // Add user message to thread
    const userMsg: ThreadMessage = {
      id: nextId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setThread((prev) => [...prev, userMsg]);

    // Parse intent
    const intent = parseIntent(text);
    track('conversation_intent', {
      kind: intent.kind,
      phase: convState.phase,
      demo: demoMode,
    });

    // Process intent through the conversation engine
    const response = processIntent(intent, convState, memory ?? {
      turns: [],
      facts: [],
      lastOpenedAt: null,
      sessionCount: 0,
    });

    // Update conversation state
    setConvState(response.state);
    setPresence(response.presence);

    // Execute mission action if any
    if (response.missionAction) {
      switch (response.missionAction.kind) {
        case 'accept':
          onAccept();
          break;
        case 'make_easier':
          onMakeEasier();
          break;
        case 'later':
          onLater();
          break;
        case 'complete':
          onMarkDone();
          break;
        case 'capture_outcome':
          onCaptureOutcome(response.missionAction.outcome, response.missionAction.reflection);
          break;
        case 'relapse':
          onRelapse();
          break;
      }
    }

    if (response.shouldEscalateToLLM) {
      // Escalate to LLM for free-form chat
      const llmReply = await coach.ask(text, signalSnapshot);
      const assistantContent = llmReply || response.text || "I'm here. Tell me more.";
      const assistantMsg: ThreadMessage = {
        id: nextId(),
        role: 'assistant',
        content: assistantContent,
        timestamp: Date.now(),
      };
      setThread((prev) => [...prev, assistantMsg]);
      persistTurns(userMsg, assistantMsg, intent.kind);
    } else {
      // Deterministic response — add immediately
      const assistantMsg: ThreadMessage = {
        id: nextId(),
        role: 'assistant',
        content: response.text,
        timestamp: Date.now(),
      };
      setThread((prev) => [...prev, assistantMsg]);
      persistTurns(userMsg, assistantMsg, intent.kind);
    }

    isProcessingRef.current = false;
  }, [
    input,
    convState,
    memory,
    demoMode,
    coach,
    signalSnapshot,
    onAccept,
    onMakeEasier,
    onLater,
    onMarkDone,
    onRelapse,
    onCaptureOutcome,
    persistTurns,
  ]);

  const isLoading = coach.isLoading || isProcessingRef.current;

  // Show streaming reply in the thread while LLM is responding
  const displayThread = useMemo<ThreadMessage[]>(() => {
    if (coach.chatReply && isLoading) {
      const streamingMsg: ThreadMessage = {
        id: 'streaming',
        role: 'assistant',
        content: coach.chatReply,
        timestamp: Date.now(),
      };
      // Replace any existing streaming message
      const withoutStreaming = thread.filter((m) => m.id !== 'streaming');
      return [...withoutStreaming, streamingMsg];
    }
    return thread.filter((m) => m.id !== 'streaming');
  }, [thread, coach.chatReply, isLoading]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <PressableScale onPress={onOpenSettings} style={styles.headerButton} accessibilityRole="button">
              <Text style={styles.headerButtonText}>Settings</Text>
            </PressableScale>
            <MiraOrb
              posture={presence.posture}
              presence={presence}
              size={56}
            />
            <PressableScale onPress={onOpenCareTeamSummary} style={styles.headerButton} accessibilityRole="button">
              <Text style={styles.headerButtonText}>Care team</Text>
            </PressableScale>
          </View>

          {/* Conversation thread */}
          <ScrollView
            ref={scrollRef}
            style={styles.threadScroll}
            contentContainerStyle={styles.threadContent}
            showsVerticalScrollIndicator={false}
          >
            {displayThread.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && !coach.chatReply ? (
              <ThinkingIndicator />
            ) : null}
          </ScrollView>

          {/* Input bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={isLoading ? 'Mira is responding…' : 'Talk to Mira…'}
              placeholderTextColor={P.textMuted}
              editable={!isLoading}
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <PressableScale
              onPress={handleSend}
              style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
              accessibilityRole="button"
              disabled={!input.trim() || isLoading}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </PressableScale>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

function MessageBubble({ message }: { message: ThreadMessage }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAssistant]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

/**
 * Variegated phrases Mira "thinks" while waiting for the LLM.
 * Each pick is random per mount — the patient doesn't see the same
 * phrase every time. The phrases are in Mira's voice: calm,
 * observational, never clinical. They hint at what she's doing
 * (listening, recalling, finding the right words) without breaking
 * the conversation illusion.
 */
const THINKING_PHRASES = [
  'listening…',
  'let me find the right words…',
  'thinking about what you said…',
  'sitting with that for a moment…',
  'let me think…',
  'considering…',
  'holding that…',
  'finding the thread…',
  'let me sit with that…',
  'turning it over…',
  'let me gather my thoughts…',
  'one moment…',
];

function ThinkingIndicator() {
  // Pick a random phrase on each mount — variegated per trigger.
  const phraseRef = useRef(THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)]);
  return (
    <View style={styles.typingIndicator}>
      <MiraOrb posture="inquiry" size={22} />
      <Text style={styles.typingText}>{phraseRef.current}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.ink,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: P.line,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerButtonText: {
    fontFamily: FONTS.bodyMedium,
    color: P.textSoft,
    fontSize: 13,
  },
  threadScroll: {
    flex: 1,
  },
  threadContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  messageRow: {
    marginBottom: 14,
    maxWidth: '100%',
  },
  messageRowUser: {
    alignItems: 'flex-end',
  },
  messageRowAssistant: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 4,
  },
  bubbleUser: {
    backgroundColor: P.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(61, 155, 122, 0.3)',
  },
  bubbleAssistant: {
    backgroundColor: 'rgba(180, 210, 195, 0.06)',
    borderWidth: 1,
    borderColor: P.line,
    borderLeftWidth: 3,
    borderLeftColor: P.accent,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTextUser: {
    fontFamily: FONTS.body,
    color: P.text,
  },
  bubbleTextAssistant: {
    fontFamily: FONTS.body,
    color: P.text,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  typingText: {
    fontFamily: FONTS.bodyMedium,
    color: P.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: P.line,
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.body,
    color: P.text,
    fontSize: 15,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(180, 210, 195, 0.06)',
    borderWidth: 1,
    borderColor: P.line,
    borderRadius: 4,
  },
  sendButton: {
    backgroundColor: P.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    fontFamily: FONTS.bodyBold,
    color: '#FFF',
    fontSize: 14,
  },
});
