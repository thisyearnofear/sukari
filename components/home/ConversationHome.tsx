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
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, FONTS } from '@/constants/designSystem';
import { MiraOrb } from '@/components/agent/MiraOrb';
import { PressableScale } from '@/components/ui/PressableScale';
import { WelcomeScene } from '@/components/home/WelcomeScene';
import { MissionVisual } from '@/components/programme/MissionVisual';
import {
  processIntent,
  generateOpeningLine,
  initialConversationState,
  type ConversationState,
  type ConversationPhase,
} from '@/domain/agent/conversationEngine';
import { buildMissionMediaBrief } from '@/domain/agent';
import { useCoach } from '@/hooks/useCoach';
import { track } from '@/utils/analytics';
import {
  completionHeartbeat,
  offerPulse,
  acceptPulse,
  completePulse,
  milestonePulse,
  noticeTick,
} from '@/utils/haptics';
import type { ProgrammeMission, PatientReportedOutcome } from '@/domain/programme/types';
import type { MetabolicPattern } from '@/domain/patterns/types';
import type { SignalSnapshot } from '@/domain/signals';
import type { UserMode } from '@/types/game';
import {
  parseIntent,
} from '@/domain/agent/intentParser';
import {
  loadConversationMemory,
  saveConversationMemory,
  markSessionOpened,
  appendTurn,
  contextSummary,
  type ConversationMemory,
} from '@/domain/agent/conversationMemory';
import { steadyPresence, buildMiraPresence, type SukariMiraPresence } from '@/domain/agent/miraPresence';
import { postureMorph } from '@/domain/agent/miraContract';

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
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeDone, setWelcomeDone] = useState(false);
  const fadeOpacity = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);
  const isProcessingRef = useRef(false);

  // Orb reactivity — the orb responds to the patient's attention.
  // isTyping: patient is actively typing → orb shifts to inquiry (listening)
  // idleTimer: patient stopped typing but hasn't sent → orb shifts to watching
  // savedPresence: the presence before typing started, restored when idle/sent
  const [isTyping, setIsTyping] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedPresenceRef = useRef<SukariMiraPresence | null>(null);
  const wasTypingRef = useRef(false);

  // Load conversation memory on mount and generate opening line
  useEffect(() => {
    let active = true;
    loadConversationMemory().then((mem) => {
      if (!active || isProcessingRef.current) return;

      // First-ever open: show the welcome scene instead of jumping
      // straight into the conversation. sessionCount is 0 before
      // markSessionOpened increments it.
      const isFirstEver = mem.sessionCount === 0 && mem.turns.length === 0;

      const openedMem = markSessionOpened(mem);
      setMemory(openedMem);
      saveConversationMemory(openedMem);

      if (isFirstEver) {
        setShowWelcome(true);
        // Don't generate the opening line yet — the welcome scene's
        // onComplete will transition into the conversation.
        return;
      }

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
      // The orb "notices" the patient — a subtle haptic tick on open.
      noticeTick();
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

  // Handle welcome scene completion — transition into conversation
  const handleWelcomeComplete = useCallback(
    (firstMessage: string) => {
      // Fade out the welcome scene, then show the conversation
      Animated.timing(fadeOpacity, {
        toValue: 0,
        duration: 600,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        setShowWelcome(false);
        setWelcomeDone(true);
        fadeOpacity.setValue(1);

        // Now generate the opening line and seed the conversation
        // with the patient's first message from the welcome scene.
        if (memory) {
          const state = initialConversationState(mission, pattern);
          setConvState(state);

          const opening = generateOpeningLine(state, memory);
          const openingMsg: ThreadMessage = {
            id: nextId(),
            role: 'assistant',
            content: opening,
            timestamp: Date.now(),
          };

          const userMsg: ThreadMessage = {
            id: nextId(),
            role: 'user',
            content: firstMessage,
            timestamp: Date.now() + 1,
          };

          setThread([openingMsg, userMsg]);
          setOpened(true);

          if (state.phase === 'offering' && pattern) {
            setPresence(buildPresenceFromState(state, pattern));
          }

          track('conversation_opened', {
            phase: state.phase,
            has_prior_context: false,
            session_count: 1,
            from_welcome: true,
          });
        }
      });
    },
    [memory, mission, pattern, fadeOpacity],
  );

  // Update conversation state when mission changes externally
  useEffect(() => {
    if (!opened) return;
    setConvState((prev) => ({
      ...prev,
      mission,
      pattern,
    }));
  }, [mission, pattern, opened]);

  // Orb reactivity: when the patient starts typing, the orb shifts to
  // inquiry (listening). When they stop for 2 seconds without sending,
  // it shifts to watching (waiting patiently). When they send, it
  // restores to the conversation-state presence.
  const handleInputChange = useCallback(
    (text: string) => {
      setInput(text);

      // First keystroke — save current presence and shift to inquiry
      if (!wasTypingRef.current && text.length > 0) {
        wasTypingRef.current = true;
        savedPresenceRef.current = presence;
        setPresence({
          ...presence,
          posture: 'inquiry',
          morph: postureMorph('inquiry', 0),
          label: 'Listening',
          message: 'Mira is listening.',
        });
      }

      // Reset the idle timer — patient is still typing
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

      // If text is empty (patient deleted everything), restore presence
      if (text.length === 0 && wasTypingRef.current) {
        wasTypingRef.current = false;
        if (savedPresenceRef.current) {
          setPresence(savedPresenceRef.current);
          savedPresenceRef.current = null;
        }
        return;
      }

      // Start idle timer — if patient stops typing for 2s, shift to watching
      idleTimerRef.current = setTimeout(() => {
        setPresence((prev) => ({
          ...prev,
          posture: 'watching',
          morph: postureMorph('watching', 0),
          label: 'Waiting',
          message: 'Mira is waiting.',
        }));
      }, 2000);
    },
    [presence],
  );

  // Restore presence after sending
  const restorePresenceAfterSend = useCallback(() => {
    wasTypingRef.current = false;
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    // Don't restore saved presence — the conversation engine will set
    // the correct presence for the new state.
    savedPresenceRef.current = null;
  }, []);

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
    restorePresenceAfterSend();

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

    // Haptic punctuation — fires at meaningful loop moments, not on
    // every message. The patterns are distinct so the patient can feel
    // the difference between "offered," "accepted," "done," and
    // "you noticed something."
    if (response.state.phase === 'offering' && convState.phase !== 'offering') {
      offerPulse();
    }
    if (response.state.phase === 'accepted' && convState.phase !== 'accepted') {
      acceptPulse();
    }
    if (response.state.phase === 'completed' && convState.phase !== 'completed') {
      completePulse();
    }
    // Milestone: first noticed-difference — double pulse
    if (
      response.missionAction?.kind === 'capture_outcome' &&
      response.missionAction.outcome.noticedDifference === 'yes' &&
      memory &&
      contextSummary(memory).noticedDifferenceCount === 0
    ) {
      milestonePulse();
    }

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
          completionHeartbeat();
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
    restorePresenceAfterSend,
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

  if (showWelcome) {
    return (
      <Animated.View style={[styles.root, { opacity: fadeOpacity }]}>
        <WelcomeScene onComplete={handleWelcomeComplete} />
      </Animated.View>
    );
  }

  // Split thread into "recent" (last 2-3 messages, prominent) and
  // "earlier" (older messages, faded and compressed). This creates the
  // spatial feel — the current exchange is centered and present, the
  // past recedes.
  const recentCount = 3;
  const earlierMessages = displayThread.slice(0, -recentCount);
  const recentMessages = displayThread.slice(-recentCount);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Minimal header — just settings/care team, no orb */}
          <View style={styles.header}>
            <PressableScale onPress={onOpenSettings} style={styles.headerButton} accessibilityRole="button">
              <Text style={styles.headerButtonText}>Settings</Text>
            </PressableScale>
            <PressableScale onPress={onOpenCareTeamSummary} style={styles.headerButton} accessibilityRole="button">
              <Text style={styles.headerButtonText}>Care team</Text>
            </PressableScale>
          </View>

          {/* Orb — large, central, with loop ring */}
          <View style={styles.orbStage}>
            <LoopRing phase={convState.phase} size={120} />
            <MiraOrb
              posture={presence.posture}
              presence={presence}
              size={90}
            />
          </View>

          {/* Conversation — spatial layout */}
          <ScrollView
            ref={scrollRef}
            style={styles.threadScroll}
            contentContainerStyle={styles.threadContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Earlier messages — faded, compressed */}
            {earlierMessages.length > 0 && (
              <View style={styles.earlierSection}>
                {earlierMessages.map((msg) => (
                  <FadedMessage key={msg.id} message={msg} />
                ))}
              </View>
            )}

            {/* Recent messages — prominent, centered */}
            <View style={styles.recentSection}>
              {recentMessages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              {/* Mission visual — appears inline when a mission is
                  being offered or is active. The glyph gives the
                  mission visual weight in the conversation — it's not
                  just text, it's an artifact. */}
              {convState.mission && convState.pattern &&
                (convState.phase === 'offering' || convState.phase === 'accepted' || convState.phase === 'adapted') && (
                  <MissionVisual
                    brief={buildMissionMediaBrief(convState.pattern, convState.mission)}
                  />
                )}

              {isLoading && !coach.chatReply ? (
                <ThinkingIndicator />
              ) : null}
            </View>
          </ScrollView>

          {/* Input bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={handleInputChange}
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

/**
 * LoopRing — a subtle SVG arc around the orb that visualizes where the
 * patient is in the conversation loop. The arc fills as the phase
 * progresses: greeting (empty) → offering (quarter) → accepted (half)
 * → completed (three-quarters) → checking_in (full ring).
 *
 * The ring is faint — it's ambient information, not a progress bar.
 * The patient perceives the loop without being told they're in a loop.
 */
const PHASE_PROGRESS: Record<ConversationPhase, number> = {
  greeting: 0,
  offering: 0.25,
  accepted: 0.5,
  adapted: 0.5,
  completed: 0.75,
  checking_in: 1,
};

function LoopRing({ phase, size }: { phase: ConversationPhase; size: number }) {
  const progress = PHASE_PROGRESS[phase] ?? 0;
  const strokeWidth = 1.5;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  // SVG arc: circumference * progress
  const circumference = 2 * Math.PI * radius;
  const dashLength = circumference * progress;
  const gap = circumference - dashLength;

  return (
    <View style={[loopRingStyles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* Background ring — always visible, very faint */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={P.line}
          strokeWidth={strokeWidth}
          opacity={0.5}
        />
        {/* Progress arc — fills with the phase */}
        {progress > 0 && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={P.accent}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashLength} ${gap}`}
            strokeLinecap="round"
            opacity={0.6}
            // Start from top (12 o'clock)
            transform={`rotate(-90 ${center} ${center})`}
          />
        )}
      </Svg>
    </View>
  );
}

const loopRingStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * FadedMessage — earlier messages rendered at reduced opacity and
 * smaller size. They're still readable if the patient scrolls up, but
 * they recede visually so the current exchange feels central.
 */
function FadedMessage({ message }: { message: ThreadMessage }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.messageRowAssistant, fadedStyles.row]}>
      <Text
        style={[
          isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant,
          fadedStyles.text,
        ]}
        numberOfLines={3}
      >
        {message.content}
      </Text>
    </View>
  );
}

const fadedStyles = StyleSheet.create({
  row: {
    opacity: 0.4,
    marginBottom: 10,
  },
  text: {
    fontSize: 13,
    lineHeight: 19,
  },
});

function MessageBubble({ message }: { message: ThreadMessage }) {
  const isUser = message.role === 'user';
  if (isUser) {
    // Patient messages: right-aligned, subtle accent background, no
    // heavy bubble border. Reads as "your words" without feeling like
    // a standard chat app.
    return (
      <View style={styles.messageRowUser}>
        <View style={styles.bubbleUser}>
          <Text style={styles.bubbleTextUser}>{message.content}</Text>
        </View>
      </View>
    );
  }
  // Mira's messages: no bubble at all. Prose flowing from the left,
  // like a letter or journal entry. This is the key differentiator —
  // the conversation reads as writing, not as a transcript of bubbles.
  return (
    <View style={styles.messageRowAssistant}>
      <Text style={styles.bubbleTextAssistant}>{message.content}</Text>
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
    paddingVertical: 8,
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
  orbStage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  threadScroll: {
    flex: 1,
  },
  threadContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  earlierSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: P.line,
  },
  recentSection: {
    // Recent messages are full opacity, centered in the reading area
  },
  messageRow: {
    marginBottom: 14,
    maxWidth: '100%',
  },
  messageRowUser: {
    alignItems: 'flex-end',
    marginBottom: 18,
  },
  messageRowAssistant: {
    alignItems: 'flex-start',
    marginBottom: 20,
    // Slight left indent so Mira's prose reads as a distinct voice
    // without needing a bubble container.
    borderLeftWidth: 2,
    borderLeftColor: P.accentSoft,
    paddingLeft: 14,
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 4,
  },
  bubbleUser: {
    maxWidth: '80%',
    backgroundColor: P.accentSoft,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
  },
  bubbleAssistant: {
    // No bubble — prose style
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTextUser: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    lineHeight: 22,
    color: P.text,
  },
  bubbleTextAssistant: {
    fontFamily: FONTS.body,
    fontSize: 16,
    lineHeight: 25,
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
