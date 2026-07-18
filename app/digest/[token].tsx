/**
 * Weekly care-team digest — shareable programme summary (no dosing advice).
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Share,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchWeeklyDigest, WeeklyDigestPayload } from '@/domain/digest';
import { track } from '@/utils/analytics';
import { COLORS, FONTS, ANIMATIONS } from '@/constants/designSystem';
import { MetabolicField } from '@/components/atmosphere/MetabolicField';
import { PressableScale } from '@/components/ui/PressableScale';

const LOCAL_DIGEST_KEY = 'glucoseWars.lastDigest';
const P = COLORS.PROGRAMME;

export default function WeeklyDigestScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [digest, setDigest] = useState<WeeklyDigestPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    track('weekly_digest_opened', { token: token || '' });
    const load = async () => {
      if (!token) {
        setError('Missing digest token');
        return;
      }
      const remote = await fetchWeeklyDigest(token);
      if (remote?.ok && remote.digest) {
        setDigest(remote.digest);
        return;
      }
      const localRaw = await AsyncStorage.getItem(LOCAL_DIGEST_KEY);
      if (localRaw) {
        const parsed = JSON.parse(localRaw) as WeeklyDigestPayload & { token?: string };
        if (!parsed.token || parsed.token === token || String(token).startsWith('local-')) {
          setDigest(parsed);
          return;
        }
      }
      setError('Digest not found or expired');
    };
    load();
  }, [token]);

  useEffect(() => {
    if (!digest) return;
    const { duration, bezier } = ANIMATIONS.MOTION.enter;
    Animated.timing(enter, {
      toValue: 1,
      duration,
      easing: Easing.bezier(bezier[0], bezier[1], bezier[2], bezier[3]),
      useNativeDriver: true,
    }).start();
  }, [digest, enter]);

  if (error) {
    return (
      <View style={styles.root}>
        <MetabolicField band="unknown" intensity={0.25} />
        <SafeAreaView style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <PressableScale onPress={() => router.replace('/')} style={styles.ghostBtn}>
            <Text style={styles.ghostText}>Back to Realm</Text>
          </PressableScale>
        </SafeAreaView>
      </View>
    );
  }

  if (!digest) {
    return (
      <View style={styles.root}>
        <MetabolicField band="in_range" intensity={0.3} />
        <SafeAreaView style={styles.centered}>
          <Text style={styles.brand}>Glucose Wars</Text>
          <Text style={styles.loading}>Opening weekly digest…</Text>
        </SafeAreaView>
      </View>
    );
  }

  const assigned = Math.max(digest.missionsAssigned, 1);
  const rate = Math.round((digest.missionsCompleted / assigned) * 100);

  return (
    <View style={styles.root}>
      <MetabolicField band="in_range" intensity={0.4} />
      <SafeAreaView style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: enter,
              transform: [
                {
                  translateY: enter.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            }}
          >
            <Text style={styles.brand}>Glucose Wars</Text>
            <Text style={styles.headline}>Weekly digest</Text>
            <Text style={styles.meta}>
              Week of {digest.weekKey} · For care team review · Not medical advice
            </Text>

            <View style={styles.heroStat}>
              <Text style={styles.heroNumber}>
                {digest.missionsCompleted}/{assigned}
              </Text>
              <Text style={styles.heroLabel}>missions completed · {rate}% of assigned</Text>
              <Text style={styles.heroSecondary}>
                {digest.practiceSessions} practice sessions this week
              </Text>
              {digest.adherence?.relapses != null && Number(digest.adherence.relapses) > 0 ? (
                <Text style={styles.recoveryNote}>
                  {String(digest.adherence.relapses)} recovery moments — coaching recommended, not
                  blame
                </Text>
              ) : null}
            </View>

            {digest.narrative ? (
              <Text style={styles.narrative}>{digest.narrative}</Text>
            ) : null}

            <Section title="Wins">
              {digest.wins.map((w, i) => (
                <Text key={i} style={styles.bullet}>
                  {w}
                </Text>
              ))}
            </Section>

            {digest.concerns.length > 0 ? (
              <Section title="Notes">
                {digest.concerns.map((c, i) => (
                  <Text key={i} style={styles.bullet}>
                    {c}
                  </Text>
                ))}
              </Section>
            ) : null}

            {digest.topBehaviours.length > 0 ? (
              <Section title="Focus behaviours">
                <Text style={styles.behaviours}>{digest.topBehaviours.join(' · ')}</Text>
              </Section>
            ) : null}

            <PressableScale
              onPress={async () => {
                await Share.share({
                  message: `Glucose Wars weekly digest (${digest.weekKey}): ${digest.missionsCompleted} missions completed. ${digest.narrative || ''}`,
                });
                track('weekly_digest_shared', { week: digest.weekKey });
              }}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryText}>Share with care team</Text>
            </PressableScale>

            <PressableScale onPress={() => router.replace('/')} style={styles.ghostBtn}>
              <Text style={styles.ghostText}>Back to Realm</Text>
            </PressableScale>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.ink,
  },
  flex: { flex: 1, zIndex: 10 },
  centered: {
    flex: 1,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  scroll: {
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 48,
    maxWidth: 480,
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
    fontSize: 20,
    marginTop: 6,
  },
  meta: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 28,
  },
  heroStat: {
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.mist,
    borderRadius: 2,
    paddingVertical: 22,
    paddingHorizontal: 18,
    marginBottom: 22,
  },
  heroNumber: {
    fontFamily: FONTS.display,
    color: P.accent,
    fontSize: 40,
    letterSpacing: -1,
    lineHeight: 44,
  },
  heroLabel: {
    fontFamily: FONTS.bodyMedium,
    color: P.text,
    fontSize: 14,
    marginTop: 8,
  },
  heroSecondary: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  recoveryNote: {
    fontFamily: FONTS.body,
    color: P.warn,
    fontSize: 12,
    marginTop: 12,
    lineHeight: 18,
  },
  narrative: {
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: P.line,
  },
  sectionTitle: {
    fontFamily: FONTS.bodyMedium,
    color: P.accent,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  bullet: {
    fontFamily: FONTS.body,
    color: P.text,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 6,
  },
  behaviours: {
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 14,
    lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: P.accent,
    paddingVertical: 16,
    borderRadius: 2,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryText: {
    fontFamily: FONTS.bodyBold,
    color: P.ink,
    fontSize: 15,
  },
  ghostBtn: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: P.line,
    borderRadius: 2,
  },
  ghostText: {
    fontFamily: FONTS.bodyMedium,
    color: P.textSoft,
    fontSize: 13,
  },
  errorText: {
    fontFamily: FONTS.body,
    color: P.danger,
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 20,
  },
  loading: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    marginTop: 10,
    fontSize: 13,
  },
});
