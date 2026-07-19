/**
 * CoachModal — the canonical Mira conversation surface for Sukari.
 *
 * Shared across every screen that needs "tap orb → ask Mira": the mission
 * card, the role selector, the signal path, the hero intro. One component,
 * one voice, one posture-aware placeholder. Aligns with the network
 * conversation surface spec in famile/web/docs/MIRA.md §4.
 */
import React from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '@/constants/designSystem';
import { PressableScale } from '@/components/ui/PressableScale';
import type { ProgrammeMission } from '@/domain/programme';
import type { MetabolicPattern } from '@/domain/patterns';

const P = COLORS.PROGRAMME;

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
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.coachBackdrop}>
        <View style={styles.coachSheet}>
          <View style={styles.sheetHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={[
                  styles.miraPresenceDot,
                  { backgroundColor: isLoading ? P.accent : P.cool },
                ]}
              />
              <Text style={styles.sheetTitle}>Mira</Text>
            </View>
            <TouchableOpacity onPress={onClose} accessibilityRole="button">
              <Text style={styles.link}>Close</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sheetMuted}>Habits only — never dosing or medical advice.</Text>
          {mission && (
            <Text style={[styles.sheetBody, { marginTop: 10 }]}>
              Today: {mission.realWorldAction}
            </Text>
          )}
          {pattern && (
            <Text style={[styles.insight, { marginTop: 8 }]}>· {pattern.whyThisExperiment}</Text>
          )}
          {insights.map((line, i) => (
            <Text key={i} style={styles.insight}>
              · {line}
            </Text>
          ))}
          {chatReply ? (
            <View style={styles.coachReply}>
              <Text style={styles.sheetBody}>{chatReply}</Text>
            </View>
          ) : null}
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={isLoading ? 'Listening…' : 'What’s on your mind…'}
            placeholderTextColor={P.textMuted}
            style={styles.input}
          />
          <PressableScale
            disabled={isLoading || !input.trim()}
            onPress={onAsk}
            style={[styles.primaryCta, { opacity: isLoading || !input.trim() ? 0.5 : 1 }]}
          >
            <Text style={styles.primaryCtaText}>{isLoading ? 'Thinking…' : 'Ask Mira'}</Text>
          </PressableScale>
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
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  link: {
    fontFamily: FONTS.bodyMedium,
    color: P.cool,
    fontSize: 14,
  },
  sheetMuted: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 11,
  },
  sheetBody: {
    fontFamily: FONTS.body,
    color: P.text,
    fontSize: 14,
    lineHeight: 20,
  },
  insight: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  coachReply: {
    backgroundColor: P.mist,
    borderLeftWidth: 2,
    borderLeftColor: P.accent,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
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
    marginBottom: 12,
  },
  primaryCta: {
    backgroundColor: P.accent,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 4,
  },
  primaryCtaText: {
    fontFamily: FONTS.bodyBold,
    color: P.ink,
    fontSize: 15,
  },
});
