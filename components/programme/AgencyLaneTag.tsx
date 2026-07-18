/**
 * Agency lane marker — glyph + one-word tag on agent-initiated cards.
 * Nothing agent-initiated appears without one; tapping opens the charter.
 * Design authority: docs/PRODUCT_DESIGN.md §4.
 */
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, FONTS } from '@/constants/designSystem';
import { getAgencyLane, type AgencyLaneId } from '@/constants/agencyCharter';
import { PressableScale } from '@/components/ui/PressableScale';

const P = COLORS.PROGRAMME;

const LANE_COLORS: Record<AgencyLaneId, { fg: string; bg: string }> = {
  always: { fg: P.accent, bg: P.accentSoft },
  asks_first: { fg: P.cool, bg: P.coolSoft },
  never: { fg: P.danger, bg: P.mist },
};

interface AgencyLaneTagProps {
  lane: AgencyLaneId;
  /** Defaults to opening the Agency Charter. */
  onPress?: () => void;
}

export function AgencyLaneTag({ lane, onPress }: AgencyLaneTagProps) {
  const config = getAgencyLane(lane);
  const colors = LANE_COLORS[lane];
  return (
    <PressableScale
      onPress={onPress ?? (() => router.push('/charter'))}
      accessibilityRole="button"
      accessibilityLabel={`${config.tag} — open the agency charter`}
      style={[styles.tag, { backgroundColor: colors.bg, borderColor: colors.fg }]}
    >
      <Ionicons name={config.icon} size={11} color={colors.fg} />
      <Text style={[styles.text, { color: colors.fg }]}>{config.tag}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  text: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
