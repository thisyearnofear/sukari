/**
 * SignalSourcePicker — first-run "start with what you have" screen, plus the
 * CGM disclaimer and signal-availability modals.
 *
 * Extracted from MainMenu.tsx. The orchestrator owns the chosen path and the
 * live-signal availability flags; this component just renders the choices and
 * emits the selection.
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '@/constants/designSystem';
import { MetabolicField } from '@/components/atmosphere/MetabolicField';
import { FloatingMiraOrb } from '@/components/agent/FloatingMiraOrb';
import { CoachModal } from '@/components/agent/CoachModal';
import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';
import { PressableScale } from '@/components/ui/PressableScale';
import { useCoach } from '@/hooks/useCoach';
import { track } from '@/utils/analytics';
import type { CGMProvider } from '@/types/health';
import type { MetabolicPattern } from '@/domain/patterns';
import type { SignalSnapshot } from '@/domain/signals';
import type { SignalPath } from './types';

const P = COLORS.PROGRAMME;
const maxWidth = Platform.OS === 'web' ? 760 : 400;

interface SignalSourcePickerProps {
  /** True when the user is changing the source mid-programme (shows "keep current" back button). */
  changingSignalSource: boolean;
  liveSignalAvailable: boolean;
  dexcomConfigured: boolean;
  healthKitAvailable: boolean;
  defaultProvider: CGMProvider;
  privacyMode: string;
  pattern: MetabolicPattern;
  signalSnapshot: SignalSnapshot | null;
  onChoosePath: (path: SignalPath) => void;
  onKeepCurrent: () => void;
  /** Fired when the user accepts the medical disclaimer for a live connection. */
  onAcceptConnection: (provider: CGMProvider) => void;
}

export const SignalSourcePicker: React.FC<SignalSourcePickerProps> = ({
  changingSignalSource,
  liveSignalAvailable,
  dexcomConfigured,
  healthKitAvailable,
  defaultProvider,
  privacyMode,
  pattern,
  signalSnapshot,
  onChoosePath,
  onKeepCurrent,
  onAcceptConnection,
}) => {
  const [showCoach, setShowCoach] = React.useState(false);
  const [coachInput, setCoachInput] = React.useState('');
  const [showCGMDisclaimer, setShowCGMDisclaimer] = React.useState(false);
  const [showSignalAvailability, setShowSignalAvailability] = React.useState(false);
  const [requestedProvider, setRequestedProvider] = React.useState<CGMProvider>(defaultProvider);
  const coach = useCoach();

  const openSignalConnection = (provider: CGMProvider = defaultProvider) => {
    if ((provider === 'dexcom' && !dexcomConfigured) || (provider === 'libre' && !healthKitAvailable)) {
      setShowSignalAvailability(true);
      track('signal_connection_preview_opened', { provider, privacy_mode: privacyMode });
      return;
    }
    setRequestedProvider(provider);
    setShowCGMDisclaimer(true);
  };

  const handleChoose = (path: SignalPath) => {
    if (path === 'connect') {
      track('signal_connection_chosen', { available: liveSignalAvailable, privacy_mode: privacyMode });
      openSignalConnection();
      return;
    }
    onChoosePath(path);
  };

  return (
    <View style={styles.root}>
      <MetabolicField band="unknown" intensity={0.3} />
      <FloatingMiraOrb onPress={() => setShowCoach(true)} />
      <ScrollView style={styles.zContent} contentContainerStyle={styles.signalScroll}>
        {changingSignalSource ? (
          <TouchableOpacity
            onPress={onKeepCurrent}
            accessibilityRole="button"
            accessibilityLabel="Keep my current mission input"
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={18} color={P.cool} />
            <Text style={styles.backButtonText}>Keep current source</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={styles.brandMark}>Sukari</Text>
        <Text style={styles.signalHeadline}>
          {changingSignalSource ? 'Choose a new mission input.' : 'Start with what you have.'}
        </Text>
        <Text style={styles.signalSub}>
          Sukari turns a signal or a moment from your day into one small, changeable mission.
        </Text>
        <View style={styles.signalOptions}>
          <PressableScale
            onPress={() => handleChoose('demo')}
            style={[styles.signalOption, styles.signalOptionPrimary]}
            accessibilityRole="button"
          >
            <Text style={styles.signalOptionTitle}>Use Amina&apos;s example</Text>
            <Text style={styles.signalOptionPrimaryBody}>A private, synthetic 14-day pattern. No account or data needed.</Text>
          </PressableScale>
          <PressableScale
            onPress={() => handleChoose('connect')}
            style={styles.signalOption}
            accessibilityRole="button"
          >
            <Text style={styles.signalOptionTitle}>
              {liveSignalAvailable ? 'Connect a live signal' : 'Connect a signal (preview)'}
            </Text>
            <Text style={styles.signalOptionBody}>
              {liveSignalAvailable
                ? 'Read-only, with your permission. Availability depends on your device and programme setup.'
                : 'Available in a configured programme build. This submission does not have a live connection enabled.'}
            </Text>
          </PressableScale>
          <PressableScale
            onPress={() => handleChoose('manual')}
            style={styles.signalOption}
            accessibilityRole="button"
          >
            <Text style={styles.signalOptionTitle}>Tell Sukari about today</Text>
            <Text style={styles.signalOptionBody}>Choose a moment in a few taps. It stays on this device.</Text>
          </PressableScale>
        </View>
        <PressableScale
          onPress={() => handleChoose('without_signal')}
          style={styles.continueWithoutSignal}
          accessibilityRole="button"
        >
          <Text style={styles.continueWithoutSignalText}>Give me a general habit mission</Text>
        </PressableScale>
        <Text style={styles.signalScope}>Connect data later when you are ready. Sukari never gives dosing or diagnostic advice.</Text>
      </ScrollView>

      <Modal visible={showCGMDisclaimer} transparent animationType="fade" onRequestClose={() => setShowCGMDisclaimer(false)}>
        <View style={styles.modalCenter}>
          <MedicalDisclaimer
            onAccept={() => {
              setShowCGMDisclaimer(false);
              onAcceptConnection(requestedProvider);
            }}
            onDecline={() => setShowCGMDisclaimer(false)}
          />
        </View>
      </Modal>

      <Modal
        visible={showSignalAvailability}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSignalAvailability(false)}
      >
        <View style={styles.modalCenter}>
          <View style={styles.availabilityCard}>
            <Text style={styles.availabilityEyebrow}>Signal connection</Text>
            <Text style={styles.availabilityTitle}>Preview in this build</Text>
            <Text style={styles.availabilityBody}>
              This connection is not available in this session. Dexcom needs programme OAuth configuration; Apple Health needs a compatible native device and permission.
            </Text>
            <Text style={styles.availabilityBody}>
              You can still use Amina&apos;s labelled example or a private local check-in today.
            </Text>
            <PressableScale
              onPress={() => setShowSignalAvailability(false)}
              accessibilityRole="button"
              style={styles.primaryCta}
            >
              <Text style={styles.primaryCtaText}>Choose another input</Text>
            </PressableScale>
          </View>
        </View>
      </Modal>

      <CoachModal
        visible={showCoach}
        onClose={() => setShowCoach(false)}
        mission={null}
        pattern={undefined}
        insights={[]}
        chatReply={coach.chatReply}
        isLoading={coach.isLoading}
        input={coachInput}
        setInput={setCoachInput}
        onAsk={async () => {
          const q = coachInput.trim();
          setCoachInput('');
          await coach.ask(q, signalSnapshot);
        }}
        messages={coach.messages}
        onClearChat={coach.clearChat}
      />
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
  signalOptionPrimary: {
    borderColor: P.accent,
    backgroundColor: P.accentSoft,
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
  signalOptionPrimaryBody: {
    fontFamily: FONTS.body,
    color: P.text,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  continueWithoutSignal: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    marginTop: 6,
  },
  continueWithoutSignalText: {
    fontFamily: FONTS.bodyMedium,
    color: P.cool,
    fontSize: 13,
  },
  signalScope: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 12,
  },
  modalCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  availabilityCard: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.inkElevated,
    borderRadius: 2,
    padding: 20,
    gap: 10,
  },
  availabilityEyebrow: {
    fontFamily: FONTS.bodyMedium,
    color: P.cool,
    fontSize: 10,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  availabilityTitle: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 24,
    lineHeight: 30,
  },
  availabilityBody: {
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 14,
    lineHeight: 21,
  },
  primaryCta: {
    backgroundColor: P.accent,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 2,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryCtaText: {
    fontFamily: FONTS.bodyBold,
    color: P.ink,
    fontSize: 16,
    letterSpacing: 0.2,
  },
});
