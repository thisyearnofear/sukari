/**
 * ManualCheckIn — "tell Sukari about today" moment picker.
 *
 * Extracted from MainMenu.tsx. Shown when the person chooses the manual
 * signal path. The orchestrator owns the selected moment and demo state.
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '@/constants/designSystem';
import { MetabolicField } from '@/components/atmosphere/MetabolicField';
import { PressableScale } from '@/components/ui/PressableScale';
import {
  SELF_REPORTED_MOMENTS,
  type SelfReportedMoment,
} from '@/domain/patterns';
import type { UserMode } from '@/types/game';

const P = COLORS.PROGRAMME;
const maxWidth = Platform.OS === 'web' ? 760 : 400;

const PATIENT_MANUAL_MOMENTS = SELF_REPORTED_MOMENTS.filter(
  (moment) => moment.id !== 'caregiver_checkin',
);
const CAREGIVER_MANUAL_MOMENT = SELF_REPORTED_MOMENTS.find(
  (moment) => moment.id === 'caregiver_checkin',
)!;

interface ManualCheckInProps {
  userMode: UserMode | null;
  /** When true, the back button returns to the current source instead of closing the picker. */
  changingSignalSource: boolean;
  onBack: () => void;
  onSelect: (moment: SelfReportedMoment) => void;
}

export const ManualCheckIn: React.FC<ManualCheckInProps> = ({
  userMode,
  changingSignalSource,
  onBack,
  onSelect,
}) => {
  const manualMoments = userMode === 'caregiver'
    ? [CAREGIVER_MANUAL_MOMENT]
    : PATIENT_MANUAL_MOMENTS;

  return (
    <View style={styles.root}>
      <MetabolicField band="unknown" intensity={0.3} />
      <ScrollView style={styles.zContent} contentContainerStyle={styles.signalScroll}>
        <TouchableOpacity
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back to signal choices"
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={18} color={P.cool} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.brandMark}>Sukari</Text>
        <Text style={styles.signalHeadline}>What feels most useful right now?</Text>
        <Text style={styles.signalSub}>
          Pick a moment, not a diagnosis. Sukari will turn it into one bounded mission you can change or decline.
        </Text>
        <View style={styles.signalOptions}>
          {manualMoments.map((moment) => (
            <PressableScale
              key={moment.id}
              onPress={() => onSelect(moment)}
              style={styles.signalOption}
              accessibilityRole="button"
              accessibilityLabel={`${moment.title}. ${moment.body}`}
            >
              <Text style={styles.signalOptionTitle}>{moment.title}</Text>
              <Text style={styles.signalOptionBody}>{moment.body}</Text>
            </PressableScale>
          ))}
        </View>
        <Text style={styles.signalScope}>
          This stays on your device. It is used only to choose today&apos;s habit mission, never for dosing or diagnosis.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.ink,
  },
  zContent: {
    flex: 1,
    zIndex: 10,
  },
  signalScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
    maxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    marginBottom: 8,
  },
  backButtonText: {
    fontFamily: FONTS.bodyMedium,
    color: P.cool,
    fontSize: 13,
  },
  brandMark: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  signalHeadline: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 30,
    lineHeight: 37,
    marginTop: 18,
  },
  signalSub: {
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 10,
  },
  signalOptions: {
    gap: 10,
    marginTop: 26,
  },
  signalOption: {
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.mist,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 2,
  },
  signalOptionTitle: {
    fontFamily: FONTS.bodyBold,
    color: P.text,
    fontSize: 15,
  },
  signalOptionBody: {
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  signalScope: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 12,
  },
});
