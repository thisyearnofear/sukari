/**
 * CoachModal — the canonical Mira conversation surface for Sukari.
 *
 * Shared across every screen that needs "tap orb → ask Mira": the mission
 * card, the role selector, the signal path, the hero intro. One component,
 * one voice, one posture-aware placeholder. Aligns with the network
 * conversation surface spec in famile/web/docs/MIRA.md §4.
 *
 * Features:
 * - Streaming: reply renders token-by-token as chunks arrive
 * - Session memory: conversation thread is displayed and sent as context
 * - Tier transition: orb grows from inline to standard when modal opens
 * - "Sit with me" rest mode: long-press the orb for a contemplative 90s
 *   breathing session with no input, no mission — just stillness
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  Vibration,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '@/constants/designSystem';
import { PressableScale } from '@/components/ui/PressableScale';
import { MiraOrb } from './MiraOrb';
import type { ProgrammeMission } from '@/domain/programme';
import type { MetabolicPattern } from '@/domain/patterns';
import type { ChatMessage } from '@/hooks/useCoach';
import { postureMorph } from '@/domain/agent/miraContract';
import { steadyPresence, type SukariMiraPresence } from '@/domain/agent';

const P = COLORS.PROGRAMME;

/** Rest mode duration in ms. */
const SIT_DURATION_MS = 90_000;

interface CoachModalProps {
  visible: boolean;
  onClose: () => void;
  mission?: ProgrammeMission | null;
  pattern?: MetabolicPattern;
  insights?: string[];
  chatReply: string | null;
  isLoading: boolean;
  input: string;
  setInput: (v: string) => void;
  onAsk: () => void;
  messages?: ChatMessage[];
  onClearChat?: () => void;
  presence?: SukariMiraPresence;
}

export const CoachModal: React.FC<CoachModalProps> = ({
  visible,
  onClose,
  mission,
  pattern,
  insights = [],
  chatReply,
  isLoading,
  input,
  setInput,
  onAsk,
  messages = [],
  onClearChat,
  presence,
}) => {
  const insets = useSafeAreaInsets();
  // --- Rest mode ("Sit with me") ---
  const [sitting, setSitting] = React.useState(false);
  const sitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sitFade = useRef(new Animated.Value(0)).current;
  const orbScale = useRef(new Animated.Value(0.84)).current;

  // Orb tier transition: grow when modal opens, settle when it closes.
  useEffect(() => {
    if (visible && !sitting) {
      Animated.timing(orbScale, {
        toValue: 1,
        duration: 720,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }).start();
    } else if (!visible) {
      orbScale.setValue(0.84);
      setSitting(false);
    }
  }, [visible, sitting, orbScale]);

  // Rest mode fade in/out.
  useEffect(() => {
    if (sitting) {
      Animated.timing(sitFade, {
        toValue: 1,
        duration: 800,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }).start();
      sitTimer.current = setTimeout(() => {
        endSit();
      }, SIT_DURATION_MS);
    } else {
      Animated.timing(sitFade, {
        toValue: 0,
        duration: 600,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }).start();
    }
    return () => {
      if (sitTimer.current) clearTimeout(sitTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sitting]);

  const beginSit = () => {
    Vibration.vibrate(30);
    setSitting(true);
  };

  const endSit = () => {
    setSitting(false);
    Vibration.vibrate(15);
  };

  const basePresence = presence ?? steadyPresence();
  const displayedPresence: SukariMiraPresence = isLoading
    ? {
        ...basePresence,
        posture: 'inquiry',
        valence: 0.1,
        reaction: null,
        label: 'Listening',
        message: 'Mira is considering your question within today’s habit boundary.',
        morph: postureMorph('inquiry', 0.1),
      }
    : basePresence;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.coachBackdrop}>
        <View style={[styles.coachSheet, { paddingBottom: Math.max(24, insets.bottom + 16) }]}>
          {/* Header with orb + presence dot */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerIdentity}>
              <Animated.View style={{ transform: [{ scale: orbScale }] }}>
                <MiraOrb
                  posture={displayedPresence.posture}
                  presence={displayedPresence}
                  size={72}
                />
              </Animated.View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View
                    style={[
                      styles.miraPresenceDot,
                      {
                        backgroundColor: isLoading
                          ? P.accent
                          : sitting
                            ? P.cool
                            : P.cool,
                      },
                    ]}
                  />
                  <Text style={styles.sheetTitle}>Mira</Text>
                </View>
                <Text style={styles.sheetSubtitle}>
                  {sitting
                    ? 'Sit with me'
                    : isLoading
                      ? 'Listening…'
                      : 'Habits only — never dosing'}
                </Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={sitting ? endSit : onClose} accessibilityRole="button">
                <Text style={styles.link}>{sitting ? 'Return' : 'Close'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Rest mode overlay — orb breathes, panel dims, no input */}
          {sitting && (
            <Animated.View
              style={[styles.sitOverlay, { opacity: sitFade }]}
              pointerEvents="auto"
            >
              <Text style={styles.sitText}>Stillness is data.</Text>
              <Text style={styles.sitHint}>Stay for a breath, or return when you are ready.</Text>
            </Animated.View>
          )}

          {!sitting && (
            <>
              <View style={styles.presenceCard} accessibilityRole="summary">
                <Text style={styles.presenceLabel}>Mira · {displayedPresence.label}</Text>
                <Text style={styles.presenceMessage}>{displayedPresence.message}</Text>
              </View>
              <PressableScale onPress={beginSit} accessibilityRole="button" style={styles.sitLink}>
                <Text style={styles.sitLinkText}>Sit quietly with Mira</Text>
              </PressableScale>
            </>
          )}

          {/* Mission context (hidden in rest mode) */}
          {!sitting && mission && (
            <Text style={[styles.sheetBody, { marginTop: 10 }]}>
              Today: {mission.realWorldAction}
            </Text>
          )}
          {!sitting && pattern && (
            <Text style={[styles.insight, { marginTop: 8 }]}>
              · {pattern.whyThisExperiment}
            </Text>
          )}
          {!sitting &&
            insights.map((line, i) => (
              <Text key={i} style={styles.insight}>
                · {line}
              </Text>
            ))}

          {/* Conversation thread */}
          {!sitting && (
            <ScrollView
              style={styles.thread}
              contentContainerStyle={{ paddingBottom: 8 }}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((msg, i) => (
                <View
                  key={i}
                  style={[
                    styles.threadBubble,
                    msg.role === 'user' ? styles.threadUser : styles.threadMira,
                  ]}
                >
                  <Text style={styles.threadText}>{msg.content}</Text>
                </View>
              ))}
              {/* Streaming reply — shown while loading, before it lands in messages */}
              {isLoading && chatReply !== null && chatReply !== '' && (
                <View style={[styles.threadBubble, styles.threadMira]}>
                  <Text style={styles.threadText}>{chatReply}</Text>
                  <Text style={styles.cursor}>▍</Text>
                </View>
              )}
            </ScrollView>
          )}

          {/* Input + ask button (hidden in rest mode) */}
          {!sitting && (
            <>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder={isLoading ? 'Listening…' : 'What’s on your mind…'}
                placeholderTextColor={P.textMuted}
                style={styles.input}
                editable={!isLoading}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {messages.length > 0 && onClearChat && (
                  <PressableScale
                    onPress={onClearChat}
                    style={styles.clearBtn}
                  >
                    <Text style={styles.clearBtnText}>Clear</Text>
                  </PressableScale>
                )}
                <PressableScale
                  disabled={isLoading || !input.trim()}
                  onPress={onAsk}
                  style={[
                    styles.primaryCta,
                    { flex: 1, opacity: isLoading || !input.trim() ? 0.5 : 1 },
                  ]}
                >
                  <Text style={styles.primaryCtaText}>
                    {isLoading ? 'Listening…' : 'Ask Mira'}
                  </Text>
                </PressableScale>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  coachBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  coachSheet: {
    backgroundColor: P.inkElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '92%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIdentity: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  miraPresenceDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  sheetTitle: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 22,
  },
  sheetSubtitle: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  link: {
    fontFamily: FONTS.bodyMedium,
    color: P.cool,
    fontSize: 14,
  },
  sheetBody: {
    fontFamily: FONTS.body,
    color: P.text,
    fontSize: 14,
    lineHeight: 20,
  },
  presenceCard: {
    borderLeftWidth: 2,
    borderLeftColor: P.accent,
    backgroundColor: P.mist,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  presenceLabel: {
    fontFamily: FONTS.bodyBold,
    color: P.text,
    fontSize: 13,
  },
  presenceMessage: {
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  sitLink: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  sitLinkText: {
    fontFamily: FONTS.bodyMedium,
    color: P.cool,
    fontSize: 13,
  },
  insight: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  thread: {
    marginTop: 12,
    maxHeight: 280,
  },
  threadBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: '88%',
  },
  threadUser: {
    alignSelf: 'flex-end',
    backgroundColor: P.mist,
  },
  threadMira: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(119, 201, 158, 0.12)',
    borderLeftWidth: 2,
    borderLeftColor: P.accent,
  },
  threadText: {
    fontFamily: FONTS.body,
    color: P.text,
    fontSize: 14,
    lineHeight: 20,
  },
  cursor: {
    fontFamily: FONTS.body,
    color: P.accent,
    fontSize: 14,
  },
  input: {
    backgroundColor: P.mist,
    color: P.text,
    fontFamily: FONTS.body,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: P.line,
    marginTop: 14,
    marginBottom: 10,
  },
  primaryCta: {
    backgroundColor: P.accent,
    paddingVertical: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  primaryCtaText: {
    fontFamily: FONTS.bodyBold,
    color: P.ink,
    fontSize: 15,
  },
  clearBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: P.line,
  },
  clearBtnText: {
    fontFamily: FONTS.bodyMedium,
    color: P.textMuted,
    fontSize: 14,
  },
  sitOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.0)',
  },
  sitText: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.7,
  },
  sitHint: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 13,
    marginTop: 16,
  },
});
