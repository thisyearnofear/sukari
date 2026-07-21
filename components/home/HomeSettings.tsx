/**
 * HomeSettings — bottom sheet for demo, signals, privacy, and educational links.
 *
 * Extracted from MainMenu.tsx. The orchestrator owns all state and passes
 * setters in; this component is purely presentational.
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '@/constants/designSystem';
import { PrivacyMode, PrivacySettings, CGMProvider } from '@/types/health';
import { PrivacyToggle } from '@/components/PrivacyToggle';
import { PrivacySettingsModal } from '@/components/PrivacySettings';
import { AMINA_DEMO } from '@/domain/demo';

const P = COLORS.PROGRAMME;

interface CgmConnectionState {
  isConnected: boolean;
  provider?: CGMProvider;
  latestReading?: { value: number } | null;
  disconnect: () => void;
}

interface HomeSettingsProps {
  visible: boolean;
  onClose: () => void;

  // Demo
  demoMode: boolean;
  onToggleDemo: (on: boolean) => void;
  onJumpDemoDay: (day: number) => void;

  // Signals
  cgm: CgmConnectionState;
  dexcomConfigured: boolean;
  healthKitAvailable: boolean;
  liveSignalAvailable: boolean;
  onChangeSignalSource: () => void;
  onOpenSignalConnection: (provider: CGMProvider) => void;
  onShowSignalAvailability: () => void;

  // Privacy
  privacyMode: PrivacyMode;
  onSetPrivacyMode: (mode: PrivacyMode) => void;
  privacySettings: PrivacySettings;
  onUpdatePrivacySettings: (settings: Partial<PrivacySettings>) => void;
}

export const HomeSettings: React.FC<HomeSettingsProps> = ({
  visible,
  onClose,
  demoMode,
  onToggleDemo,
  onJumpDemoDay,
  cgm,
  dexcomConfigured,
  healthKitAvailable,
  liveSignalAvailable,
  onChangeSignalSource,
  onOpenSignalConnection,
  onShowSignalAvailability,
  privacyMode,
  onSetPrivacyMode,
  privacySettings,
  onUpdatePrivacySettings,
}) => {
  const [showPrivacySettings, setShowPrivacySettings] = React.useState(false);

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Settings</Text>
              <TouchableOpacity onPress={onClose} accessibilityRole="button">
                <Text style={styles.link}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <SettingsSection title="Demo (judges)">
                <TouchableOpacity
                  onPress={() => onToggleDemo(!demoMode)}
                  accessibilityRole="switch"
                  style={styles.switchRow}
                >
                  <View>
                    <Text style={styles.sheetBody}>
                      {demoMode ? 'Amina demo on' : 'Amina demo off'}
                    </Text>
                    <Text style={styles.sheetMuted}>Synthetic 14-day closed-loop timeline</Text>
                  </View>
                  <View
                    style={[
                      styles.switchTrack,
                      { backgroundColor: demoMode ? P.accent : P.line },
                    ]}
                  >
                    <View
                      style={[
                        styles.switchThumb,
                        demoMode ? { marginLeft: 18 } : { marginLeft: 2 },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
                {demoMode ? (
                  <>
                    <SheetButton
                      label="Jump to measured-response day"
                      onPress={() => {
                        onJumpDemoDay(AMINA_DEMO.scenes.measure);
                        onClose();
                      }}
                    />
                    <SheetButton
                      label="Jump to outreach / escalation day"
                      onPress={() => {
                        onJumpDemoDay(AMINA_DEMO.scenes.outreach);
                        onClose();
                      }}
                    />
                  </>
                ) : null}
              </SettingsSection>

              <SettingsSection title="Signals">
                <SheetButton label="Change mission input" onPress={onChangeSignalSource} />
                {cgm.isConnected ? (
                  <View style={styles.switchRow}>
                    <View>
                      <Text style={styles.sheetBody}>
                        {cgm.provider === 'libre' ? 'Apple Health' : 'Dexcom'} connected
                      </Text>
                      {cgm.latestReading && (
                        <Text style={styles.sheetMuted}>
                          Latest {cgm.latestReading.value} mg/dL
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity onPress={cgm.disconnect} accessibilityRole="button">
                      <Text style={[styles.link, { color: P.danger }]}>Disconnect</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    {dexcomConfigured ? (
                      <SheetButton label="Connect Dexcom" onPress={() => onOpenSignalConnection('dexcom')} />
                    ) : (
                      <SheetButton label="Dexcom connection (preview)" onPress={onShowSignalAvailability} />
                    )}
                    {healthKitAvailable && (
                      <SheetButton label="Connect Apple Health" onPress={() => onOpenSignalConnection('libre')} />
                    )}
                    <Text style={styles.sheetMuted}>
                      {liveSignalAvailable
                        ? 'Read-only signal access fuels pattern → mission selection.'
                        : 'Live connection is not enabled in this submission build.'}
                    </Text>
                  </>
                )}
              </SettingsSection>

              <SettingsSection title="Privacy">
                <PrivacyToggle
                  currentMode={privacyMode}
                  onToggle={(mode) => onSetPrivacyMode(mode)}
                />
                <SheetButton label="Privacy details" onPress={() => setShowPrivacySettings(true)} />
              </SettingsSection>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <PrivacySettingsModal
        settings={privacySettings}
        onSave={(settings) => {
          onUpdatePrivacySettings(settings);
          setShowPrivacySettings(false);
        }}
        onClose={() => setShowPrivacySettings(false)}
        visible={showPrivacySettings}
      />
    </>
  );
};

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function SheetButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="button" style={styles.sheetBtn}>
      <Text style={styles.sheetBody}>{label}</Text>
      <Text style={styles.roleArrow}>→</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: P.inkElevated,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderColor: P.line,
    padding: 20,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 22,
  },
  section: {
    marginBottom: 22,
    gap: 8,
  },
  sectionTitle: {
    fontFamily: FONTS.bodyMedium,
    color: P.accent,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sheetBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.line,
  },
  sheetBody: {
    fontFamily: FONTS.body,
    color: P.text,
    fontSize: 14,
  },
  sheetMuted: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchTrack: {
    width: 36,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
  },
  link: {
    fontFamily: FONTS.bodyMedium,
    color: P.textSoft,
    fontSize: 13,
    paddingVertical: 4,
  },
  roleArrow: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 18,
    marginLeft: 12,
  },
});
