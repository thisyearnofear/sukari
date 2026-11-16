import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { COLORS, FONTS } from '@/constants/designSystem';
import { PressableScale } from '@/components/ui/PressableScale';
import type { ConversationPhase } from '@/domain/agent/conversationEngine';

const P = COLORS.PROGRAMME;

/**
 * Suggested replies scaffold the next conversational turn. Labels are
 * chosen to parse cleanly through domain/agent/intentParser — every chip
 * maps to a real intent, never a dead end. Free text remains available;
 * the chips are affordance, not constraint.
 */
const CHIPS_BY_PHASE: Record<ConversationPhase, string[]> = {
  greeting: ['What did you notice?', 'Show me today'],
  offering: ["Sure, let's do it", 'Make it easier', 'Maybe later'],
  accepted: ['I did it', "Couldn't get to it", 'How did it go?'],
  adapted: ['I did it', "Couldn't get to it", 'How did it go?'],
  completed: ['It went well', 'It was hard', 'I noticed a difference'],
  checking_in: ['It went well', 'It was hard', 'I noticed a difference'],
};

export function SuggestedReplies({
  phase,
  disabled,
  onPick,
}: {
  phase: ConversationPhase;
  disabled?: boolean;
  onPick: (text: string) => void;
}) {
  const chips = CHIPS_BY_PHASE[phase] ?? CHIPS_BY_PHASE.greeting;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {chips.map((label) => (
        <PressableScale
          key={label}
          onPress={() => onPick(label)}
          disabled={disabled}
          style={[styles.chip, disabled && styles.chipDisabled]}
          accessibilityRole="button"
          accessibilityLabel={`Reply: ${label}`}
        >
          <Text style={styles.chipText}>{label}</Text>
        </PressableScale>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 6,
  },
  chip: {
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: 'rgba(180, 210, 195, 0.07)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipDisabled: {
    opacity: 0.35,
  },
  chipText: {
    fontFamily: FONTS.bodyMedium,
    color: P.textSoft,
    fontSize: 13,
  },
});
