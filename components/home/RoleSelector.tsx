/**
 * RoleSelector — first-run "tell us how Sukari should frame it" screen.
 *
 * Extracted from MainMenu.tsx. Purely presentational: the orchestrator owns
 * the selected role and the coach modal state.
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { COLORS, FONTS } from '@/constants/designSystem';
import { USER_MODE_CONFIGS } from '@/constants/userModes';
import { UserMode } from '@/types/game';
import { PrivacyMode } from '@/types/health';
import { MetabolicField } from '@/components/atmosphere/MetabolicField';
import { FloatingMiraOrb } from '@/components/agent/FloatingMiraOrb';
import { CoachModal } from '@/components/agent/CoachModal';
import { PressableScale } from '@/components/ui/PressableScale';
import { useCoach } from '@/hooks/useCoach';
import { track } from '@/utils/analytics';
import type { MetabolicPattern } from '@/domain/patterns';
import type { SignalSnapshot } from '@/domain/signals';

const P = COLORS.PROGRAMME;
const maxWidth = Platform.OS === 'web' ? 760 : 400;

interface RoleSelectorProps {
  privacyMode: PrivacyMode;
  pattern: MetabolicPattern;
  signalSnapshot: SignalSnapshot | null;
  onSelect: (mode: UserMode) => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  privacyMode,
  pattern,
  signalSnapshot,
  onSelect,
}) => {
  const [showCoach, setShowCoach] = React.useState(false);
  const [coachInput, setCoachInput] = React.useState('');
  const coach = useCoach();

  return (
    <View style={styles.root}>
      <MetabolicField band="unknown" intensity={0.35} />
      <FloatingMiraOrb onPress={() => setShowCoach(true)} />
      <ScrollView
        style={styles.zContent}
        contentContainerStyle={styles.roleScroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.brandMark}>Sukari</Text>
        <Text style={styles.roleHeadline}>Let’s make the next decision easier.</Text>
        <Text style={styles.roleSub}>
          One small experiment today. Better evidence for tomorrow. First, tell us how Sukari should frame it.
        </Text>

        <View style={styles.roleList}>
          {(Object.keys(USER_MODE_CONFIGS) as UserMode[]).map((mode) => {
            const config = USER_MODE_CONFIGS[mode];
            return (
              <PressableScale
                key={mode}
                onPress={() => {
                  onSelect(mode);
                  track('user_mode_selected', { user_mode: mode, privacy_mode: privacyMode });
                  track('role_selected', { user_mode: mode, privacy_mode: privacyMode });
                }}
                accessibilityLabel={`${config.name}. ${config.description}`}
                accessibilityRole="button"
                style={styles.roleRow}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.roleName}>{config.name}</Text>
                  <Text style={styles.roleDesc}>{config.subtitle}</Text>
                </View>
                <Text style={styles.roleArrow}>→</Text>
              </PressableScale>
            );
          })}
        </View>
      </ScrollView>
      <CoachModal
        visible={showCoach}
        onClose={() => setShowCoach(false)}
        mission={null}
        pattern={pattern}
        insights={coach.insights}
        chatReply={coach.chatReply}
        isLoading={coach.isLoading}
        input={coachInput}
        setInput={setCoachInput}
        onAsk={() => coach.ask(coachInput.trim(), signalSnapshot)}
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
  roleScroll: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    maxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  brandMark: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  roleHeadline: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 28,
    lineHeight: 34,
    marginTop: 20,
  },
  roleSub: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 14,
    marginTop: 8,
    marginBottom: 28,
    lineHeight: 20,
  },
  roleList: {
    gap: 10,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.mist,
    borderRadius: 2,
  },
  roleName: {
    fontFamily: FONTS.bodyBold,
    color: P.text,
    fontSize: 16,
  },
  roleDesc: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  roleArrow: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 18,
    marginLeft: 12,
  },
});
