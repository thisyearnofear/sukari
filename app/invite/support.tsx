/**
 * Caregiver invite landing — sets caregiver mode + support mission.
 * URL carries template id only (no raw glucose).
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
import { track } from '@/utils/analytics';
import { COLORS, FONTS, ANIMATIONS } from '@/constants/designSystem';
import { MetabolicField } from '@/components/atmosphere/MetabolicField';
import { PressableScale } from '@/components/ui/PressableScale';

const P = COLORS.PROGRAMME;

export default function CaregiverSupportInvite() {
  const params = useLocalSearchParams<{ templateId?: string; invite?: string }>();
  const { setUserMode, ensureTodayMission, progress } = usePlayerProgressContext();
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    track('caregiver_invite_opened', {
      template_id: params.templateId || 'caregiver_support',
      invite: params.invite || '',
    });
    setUserMode('caregiver');
    ensureTodayMission(null, params.templateId || 'caregiver_support');
  }, [params.templateId, params.invite, setUserMode, ensureTodayMission]);

  useEffect(() => {
    const { duration, bezier } = ANIMATIONS.MOTION.enter;
    Animated.timing(enter, {
      toValue: 1,
      duration,
      easing: Easing.bezier(bezier[0], bezier[1], bezier[2], bezier[3]),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  return (
    <View style={styles.root}>
      <MetabolicField band="in_range" intensity={0.45} />
      <SafeAreaView style={styles.safe}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: enter,
              transform: [
                {
                  translateY: enter.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.brand}>Sukari</Text>
          <Text style={styles.headline}>You’ve been invited to support</Text>
          <Text style={styles.body}>
            Someone asked you to help with their metabolic programme tonight. No clinical data is
            shared — just one clear support action.
          </Text>

          {progress.activeMission?.caregiverSupportAction ? (
            <View style={styles.askCard}>
              <Text style={styles.askLabel}>Support ask</Text>
              <Text style={styles.askText}>{progress.activeMission.caregiverSupportAction}</Text>
            </View>
          ) : (
            <View style={styles.askCard}>
              <Text style={styles.askLabel}>Support ask</Text>
              <Text style={styles.askText}>
                Check in once today — presence over perfection.
              </Text>
            </View>
          )}

          <PressableScale
            onPress={() => router.replace('/')}
            accessibilityRole="button"
            accessibilityLabel="Enter as support"
            style={styles.primary}
          >
            <Text style={styles.primaryText}>Enter as support</Text>
          </PressableScale>

          <PressableScale
            onPress={() =>
              router.push({
                pathname: '/(game)/onboarding',
                params: { controlMode: 'swipe' },
              })
            }
            accessibilityRole="button"
            accessibilityLabel="Try a short empathy practice"
            style={styles.secondary}
          >
            <Text style={styles.secondaryText}>Try a short rehearsal</Text>
          </PressableScale>

          <Text style={styles.footnote}>Not medical advice · No glucose values in this invite</Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.ink,
  },
  safe: {
    flex: 1,
    zIndex: 10,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 28,
    paddingVertical: 32,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  brand: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 28,
    letterSpacing: -0.3,
  },
  headline: {
    fontFamily: FONTS.display,
    color: P.textSoft,
    fontSize: 22,
    lineHeight: 28,
    marginTop: 10,
  },
  body: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12,
    marginBottom: 28,
  },
  askCard: {
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.mist,
    borderRadius: 2,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  askLabel: {
    fontFamily: FONTS.bodyMedium,
    color: P.accent,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  askText: {
    fontFamily: FONTS.body,
    color: P.text,
    fontSize: 16,
    lineHeight: 24,
  },
  primary: {
    backgroundColor: P.accent,
    paddingVertical: 16,
    borderRadius: 2,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryText: {
    fontFamily: FONTS.bodyBold,
    color: P.ink,
    fontSize: 15,
  },
  secondary: {
    borderWidth: 1,
    borderColor: P.line,
    paddingVertical: 14,
    borderRadius: 2,
    alignItems: 'center',
  },
  secondaryText: {
    fontFamily: FONTS.bodyMedium,
    color: P.textSoft,
    fontSize: 14,
  },
  footnote: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 16,
  },
});
