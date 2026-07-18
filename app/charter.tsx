/**
 * Agency Charter — the published boundary of the agent's powers.
 * One tap from home and from any lane marker. The agent proposes;
 * the patient disposes. Design authority: docs/PRODUCT_DESIGN.md §4.
 */
import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '@/constants/designSystem';
import { AGENCY_CHARTER, type AgencyLaneId } from '@/constants/agencyCharter';
import { MetabolicField } from '@/components/atmosphere/MetabolicField';
import { PressableScale } from '@/components/ui/PressableScale';
import { track } from '@/utils/analytics';

const P = COLORS.PROGRAMME;

const LANE_COLORS: Record<AgencyLaneId, string> = {
  always: P.accent,
  asks_first: P.cool,
  never: P.danger,
};

export default function CharterScreen() {
  useEffect(() => {
    track('screen_view', { screen: 'charter' });
  }, []);

  return (
    <View style={styles.root}>
      <MetabolicField band="in_range" intensity={0.35} />
      <SafeAreaView style={styles.flex}>
        <View style={styles.topBar}>
          <PressableScale
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            accessibilityRole="button"
            accessibilityLabel="Back to programme"
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={18} color={P.textSoft} />
            <Text style={styles.backText}>Back</Text>
          </PressableScale>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>Agency charter</Text>
          <Text style={styles.title}>{AGENCY_CHARTER.title}</Text>
          <Text style={styles.tagline}>{AGENCY_CHARTER.tagline}</Text>
          <Text style={styles.intro}>{AGENCY_CHARTER.intro}</Text>

          {AGENCY_CHARTER.lanes.map((lane) => (
            <View key={lane.id} style={styles.laneCard}>
              <View style={styles.laneHeader}>
                <Ionicons name={lane.icon} size={15} color={LANE_COLORS[lane.id]} />
                <Text style={[styles.laneTag, { color: LANE_COLORS[lane.id] }]}>{lane.tag}</Text>
              </View>
              <Text style={styles.laneTitle}>{lane.title}</Text>
              <Text style={styles.laneSummary}>{lane.summary}</Text>
              {lane.items.map((item) => (
                <View key={item} style={styles.itemRow}>
                  <View style={[styles.itemDot, { backgroundColor: LANE_COLORS[lane.id] }]} />
                  <Text style={styles.itemText}>{item}</Text>
                </View>
              ))}
            </View>
          ))}

          <Text style={styles.safety}>{AGENCY_CHARTER.safety}</Text>
        </ScrollView>
      </SafeAreaView>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 8,
    paddingRight: 12,
  },
  backText: {
    fontFamily: FONTS.bodyMedium,
    color: P.textSoft,
    fontSize: 14,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 48,
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
  },
  eyebrow: {
    fontFamily: FONTS.bodyMedium,
    color: P.accent,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  tagline: {
    fontFamily: FONTS.displayItalic,
    color: P.textSoft,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
  intro: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
    marginBottom: 20,
  },
  laneCard: {
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.mist,
    borderRadius: 2,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  laneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  laneTag: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  laneTitle: {
    fontFamily: FONTS.bodyBold,
    color: P.text,
    fontSize: 15,
    lineHeight: 21,
  },
  laneSummary: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 7,
  },
  itemDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 7,
  },
  itemText: {
    flex: 1,
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 13,
    lineHeight: 19,
  },
  safety: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 8,
  },
});
