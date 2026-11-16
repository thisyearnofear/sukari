import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Coffee, Footprints, HandHeart, MoonStar, Salad, Sparkles } from 'lucide-react-native';
import { COLORS, FONTS } from '@/constants/designSystem';
import type { BehaviourTarget, ProgrammeMission } from '@/domain/programme/types';
import type { ConversationPhase } from '@/domain/agent/conversationEngine';

const P = COLORS.PROGRAMME;

const BEHAVIOUR_ICON: Record<BehaviourTarget, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  protein_first: Salad,
  post_meal_walk: Footprints,
  reject_liquid_sugar: Coffee,
  pair_carbs: Salad,
  steady_evening: MoonStar,
  ally_rally: HandHeart,
  caregiver_support: HandHeart,
};

const STATE_LINE: Partial<Record<ConversationPhase, string>> = {
  offering: 'Mira is offering this for today',
  accepted: 'Accepted — waiting on you',
  adapted: 'Made easier — still counts',
  completed: 'Done today',
};

/**
 * MissionCard — the mission as a first-class artifact in the conversation.
 * Soft-radius elevated card: kicker, glyph, the real-world action, and the
 * bounded reason. Replaces the thin "TODAY'S CUE" strip.
 */
export function MissionCard({
  mission,
  phase,
  compact,
}: {
  mission: ProgrammeMission;
  phase: ConversationPhase;
  /** Condensed single-row strip for short viewports. */
  compact?: boolean;
}) {
  const Icon = BEHAVIOUR_ICON[mission.behaviourTarget] ?? Sparkles;
  const stateLine = STATE_LINE[phase] ?? 'Mira is offering this for today';

  if (compact) {
    return (
      <View style={styles.compactCard} accessibilityLabel={`Today's mission: ${mission.realWorldAction}. ${stateLine}`}>
        <View style={styles.compactGlyph}>
          <Icon size={15} color={P.accent} strokeWidth={1.7} />
        </View>
        <Text style={styles.compactTitle} numberOfLines={1}>
          {mission.realWorldAction}
        </Text>
        <Text style={styles.compactPhase}>{stateLine}</Text>
      </View>
    );
  }

  const done = phase === 'completed';

  return (
    <View style={[styles.card, done && styles.cardDone]} accessibilityRole="summary">
      <View style={styles.row}>
        <View style={[styles.glyph, done && styles.glyphDone]}>
          <Icon size={26} color={done ? P.accent : P.text} strokeWidth={1.6} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.kicker}>TODAY&apos;S MISSION</Text>
          <Text style={styles.action}>{mission.realWorldAction}</Text>
        </View>
      </View>
      {mission.realmCopy ? <Text style={styles.reason}>{mission.realmCopy}</Text> : null}
      {STATE_LINE[phase] ? (
        <View style={styles.footer}>
          <View style={[styles.dot, done && styles.dotDone]} />
          <Text style={styles.stateText}>{STATE_LINE[phase]}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.inkElevated,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  cardDone: {
    borderColor: P.accentSoft,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  glyph: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.accentSoft,
    borderWidth: 1,
    borderColor: P.accent,
  },
  glyphDone: {
    backgroundColor: 'rgba(61, 155, 122, 0.28)',
  },
  copy: { flex: 1 },
  kicker: {
    fontFamily: FONTS.bodyMedium,
    color: P.accent,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  action: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 18,
    lineHeight: 24,
    marginTop: 4,
  },
  reason: {
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: P.line,
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.inkElevated,
  },
  compactGlyph: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.accentSoft,
  },
  compactTitle: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    color: P.text,
    fontSize: 13,
  },
  compactPhase: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 11,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: P.warn,
  },
  dotDone: {
    backgroundColor: P.accent,
  },
  stateText: {
    fontFamily: FONTS.bodyMedium,
    color: P.textMuted,
    fontSize: 12,
    letterSpacing: 0.3,
  },
});
