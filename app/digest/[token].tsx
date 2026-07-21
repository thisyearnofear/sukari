/**
 * Care-team summary — exception-oriented clinical artifact (no kingdom lore).
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
import { fetchWeeklyDigest, listLocalWeeklyDigests, WeeklyDigestPayload, estimateStaffMinutesSaved } from '@/domain/digest';
import { track } from '@/utils/analytics';
import { COLORS, FONTS, ANIMATIONS } from '@/constants/designSystem';
import { PressableScale } from '@/components/ui/PressableScale';
import { buildAminaClinicianDigest, AMINA_DEMO } from '@/domain/demo';

const LOCAL_DIGEST_KEY = 'sukari.lastDigest';
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
      if (token === 'local-amina-outreach' || token === 'local-maya-outreach') {
        setDigest(buildAminaClinicianDigest(AMINA_DEMO.scenes.outreach));
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
      const localHistory = await listLocalWeeklyDigests();
      const historic = localHistory.find((item) => item.token === token);
      if (historic) {
        setDigest(historic);
        return;
      }
      setError('Summary not found or expired');
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

  useEffect(() => {
    if (!digest) return;
    const { minutes } = estimateStaffMinutesSaved(digest);
    track('measured_response_to_care_team_exception', {
      outreach_recommended: digest.outreachRecommended === true,
      safety_flags: digest.safetyFlags?.length ?? 0,
      week: digest.weekKey,
    });
    track('staff_minutes_saved_viewed', {
      week: digest.weekKey,
      outreach_recommended: digest.outreachRecommended === true,
      missions_completed: digest.missionsCompleted,
      estimated_minutes_saved: minutes,
    });
  }, [digest]);

  if (error) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <PressableScale onPress={() => router.replace('/')} style={styles.ghostBtn}>
            <Text style={styles.ghostText}>Back to programme</Text>
          </PressableScale>
        </SafeAreaView>
      </View>
    );
  }

  if (!digest) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.centered}>
          <Text style={styles.brand}>Sukari</Text>
          <Text style={styles.loading}>Opening care-team summary…</Text>
        </SafeAreaView>
      </View>
    );
  }

  const assigned = Math.max(digest.missionsAssigned, 1);
  const rate = Math.round((digest.missionsCompleted / assigned) * 100);
  const outreach = digest.outreachRecommended === true;
  const safety = digest.safetyFlags?.length ?? 0;
  const staffMinutes = estimateStaffMinutesSaved(digest);


  return (
    <View style={styles.root}>
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
            <Text style={styles.kicker}>Care team · exception summary</Text>
            <Text style={styles.brand}>Sukari</Text>
            <Text style={styles.headline}>Weekly intelligence</Text>
            <Text style={styles.meta}>
              Week of {digest.weekKey}
              {digest.patientLabel ? ` · ${digest.patientLabel}` : ''}
              {'\n'}Not medical advice · Habits and adherence only · No dosing
            </Text>

            <View style={styles.verdictBlock}>
              <Text style={[styles.verdict, outreach ? styles.verdictOn : styles.verdictOff]}>
                {outreach ? 'A human helps this week.' : 'No human needed this week.'}
              </Text>
              <Text style={styles.verdictReason}>
                {digest.outreachReason ||
                  (outreach
                    ? 'Human attention may improve adherence this week.'
                    : 'Adherence is holding — review only if useful.')}
              </Text>
            </View>

            <View style={styles.heroStat}>
              <Text style={styles.heroNumber}>
                {digest.missionsCompleted}/{assigned}
              </Text>
              <Text style={styles.heroLabel}>missions completed · {rate}% of assigned</Text>
              {digest.adherence?.relapses != null && Number(digest.adherence.relapses) > 0 ? (
                <Text style={styles.recoveryNote}>
                  {String(digest.adherence.relapses)} recovery moment(s) — coaching recommended, not
                  blame
                </Text>
              ) : null}
            </View>

            <View style={styles.staffMinutesBlock}>
              <Text style={styles.staffMinutesNumber}>{staffMinutes.minutes}</Text>
              <Text style={styles.staffMinutesLabel}>est. staff minutes saved this week</Text>
              <Text style={styles.staffMinutesModel}>{staffMinutes.model}</Text>
              <Text style={styles.staffMinutesFootnote}>
                Per-patient estimate. Aggregate across the cohort for the programme-level business
                metric.
              </Text>
            </View>

            {digest.dataCoverage ? (
              <Section title="Data coverage">
                <Text style={styles.bullet}>{digest.dataCoverage}</Text>
              </Section>
            ) : null}

            {digest.recurringPatterns && digest.recurringPatterns.length > 0 ? (
              <Section title="Recurring patterns">
                {digest.recurringPatterns.map((p, i) => (
                  <Text key={i} style={styles.bullet}>
                    {p}
                  </Text>
                ))}
              </Section>
            ) : null}

            {digest.experimentsTried && digest.experimentsTried.length > 0 ? (
              <Section title="What the patient tried">
                {digest.experimentsTried.map((ex, i) => (
                  <View key={i} style={styles.experiment}>
                    <Text style={styles.experimentAction}>{ex.action}</Text>
                    <Text style={styles.bullet}>
                      Completed {ex.completed}× · {ex.associatedNote}
                    </Text>
                  </View>
                ))}
              </Section>
            ) : null}

            {digest.changesSinceLastWeek && digest.changesSinceLastWeek.length > 0 ? (
              <Section title="Changes since last week">
                {digest.changesSinceLastWeek.map((c, i) => (
                  <Text key={i} style={styles.bullet}>
                    {c}
                  </Text>
                ))}
              </Section>
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

            {digest.patientBarriers && digest.patientBarriers.length > 0 ? (
              <Section title="Patient-reported barriers">
                {digest.patientBarriers.map((b, i) => (
                  <Text key={i} style={styles.bullet}>
                    {b}
                  </Text>
                ))}
              </Section>
            ) : null}

            <Section title="Safety flags">
              {safety > 0 ? (
                digest.safetyFlags!.map((f, i) => (
                  <Text key={i} style={[styles.bullet, styles.safetyFlag]}>
                    {f}
                  </Text>
                ))
              ) : (
                <Text style={styles.bullet}>None reported in-app this week</Text>
              )}
            </Section>

            {digest.narrative ? (
              <Section title="Summary">
                <Text style={styles.narrative}>{digest.narrative}</Text>
              </Section>
            ) : null}

            <Text style={styles.footerNote}>
              The clinician does not receive another dashboard to monitor continuously. They receive
              an exception-oriented summary when human attention can make a difference.
            </Text>

            <PressableScale
              onPress={async () => {
                await Share.share({
                  message: `Sukari care-team summary (${digest.weekKey}): ${digest.missionsCompleted}/${assigned} missions. Outreach: ${outreach ? 'suggested' : 'not required'}. ${digest.narrative || ''}`,
                });
                track('weekly_digest_shared', { week: digest.weekKey });
              }}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryText}>Share with care team</Text>
            </PressableScale>

            <PressableScale onPress={() => router.replace('/')} style={styles.ghostBtn}>
              <Text style={styles.ghostText}>Back to programme</Text>
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
    backgroundColor: '#F4F6F5',
  },
  flex: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  scroll: {
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 48,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  kicker: {
    fontFamily: FONTS.bodyMedium,
    color: '#5A6B62',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  brand: {
    fontFamily: FONTS.display,
    color: '#14201B',
    fontSize: 28,
    letterSpacing: -0.3,
  },
  headline: {
    fontFamily: FONTS.display,
    color: '#2A3A33',
    fontSize: 20,
    marginTop: 4,
  },
  meta: {
    fontFamily: FONTS.body,
    color: '#5A6B62',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 20,
  },
  verdictBlock: {
    marginBottom: 18,
  },
  verdict: {
    fontFamily: FONTS.display,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  verdictOn: {
    color: '#C4923A',
  },
  verdictOff: {
    color: '#2F7A5E',
  },
  verdictReason: {
    fontFamily: FONTS.body,
    color: '#2A3A33',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  heroStat: {
    borderWidth: 1,
    borderColor: 'rgba(20, 32, 27, 0.12)',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  heroNumber: {
    fontFamily: FONTS.display,
    color: '#2F7A5E',
    fontSize: 40,
    letterSpacing: -1,
    lineHeight: 44,
  },
  heroLabel: {
    fontFamily: FONTS.bodyMedium,
    color: '#14201B',
    fontSize: 14,
    marginTop: 8,
  },
  heroSecondary: {
    fontFamily: FONTS.body,
    color: '#5A6B62',
    fontSize: 13,
    marginTop: 4,
  },
  recoveryNote: {
    fontFamily: FONTS.body,
    color: '#8A6A28',
    fontSize: 12,
    marginTop: 12,
    lineHeight: 18,
  },
  staffMinutesBlock: {
    borderWidth: 1,
    borderColor: 'rgba(20, 32, 27, 0.12)',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  staffMinutesNumber: {
    fontFamily: FONTS.display,
    color: '#2F7A5E',
    fontSize: 32,
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  staffMinutesLabel: {
    fontFamily: FONTS.bodyMedium,
    color: '#14201B',
    fontSize: 13,
    marginTop: 4,
  },
  staffMinutesModel: {
    fontFamily: FONTS.body,
    color: '#5A6B62',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  staffMinutesFootnote: {
    fontFamily: FONTS.body,
    color: '#7A8B82',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(20, 32, 27, 0.1)',
  },
  sectionTitle: {
    fontFamily: FONTS.bodyMedium,
    color: '#2F7A5E',
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  bullet: {
    fontFamily: FONTS.body,
    color: '#14201B',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
  experiment: {
    marginBottom: 10,
  },
  experimentAction: {
    fontFamily: FONTS.bodyBold,
    color: '#14201B',
    fontSize: 14,
    marginBottom: 2,
  },
  safetyFlag: {
    color: '#B54A4A',
  },
  narrative: {
    fontFamily: FONTS.body,
    color: '#2A3A33',
    fontSize: 14,
    lineHeight: 22,
  },
  footerNote: {
    fontFamily: FONTS.body,
    color: '#5A6B62',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 18,
  },
  primaryBtn: {
    backgroundColor: '#2F7A5E',
    paddingVertical: 16,
    borderRadius: 2,
    alignItems: 'center',
  },
  primaryText: {
    fontFamily: FONTS.bodyBold,
    color: '#FFFFFF',
    fontSize: 15,
  },
  ghostBtn: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(20, 32, 27, 0.16)',
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  ghostText: {
    fontFamily: FONTS.bodyMedium,
    color: '#2A3A33',
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
    color: '#5A6B62',
    marginTop: 10,
    fontSize: 13,
  },
});
