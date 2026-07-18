import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buildAminaClinicianDigest, AMINA_DEMO } from '@/domain/demo';
import { listLocalWeeklyDigests, type StoredWeeklyDigest, type WeeklyDigestPayload } from '@/domain/digest';
import { COLORS, FONTS } from '@/constants/designSystem';
import { PressableScale } from '@/components/ui/PressableScale';
import { track } from '@/utils/analytics';

const P = COLORS.PROGRAMME;

function completionRate(digest: WeeklyDigestPayload) {
  return Math.round((digest.missionsCompleted / Math.max(1, digest.missionsAssigned)) * 100);
}

export default function CarePanelScreen() {
  const [localDigests, setLocalDigests] = useState<StoredWeeklyDigest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDemo, setShowDemo] = useState(false);

  const demoPanel = useMemo(() => {
    const needsOutreach = buildAminaClinicianDigest(AMINA_DEMO.scenes.outreach);
    const settling = buildAminaClinicianDigest(AMINA_DEMO.scenes.measure);
    const stable = {
      ...buildAminaClinicianDigest(AMINA_DEMO.scenes.measure),
      patientLabel: 'Programme member · sample (synthetic)',
      missionsCompleted: 6,
      missionsAssigned: 7,
      practiceSessions: 4,
      outreachRecommended: false,
      outreachReason: 'Adherence is holding. No review needed this week.',
      concerns: [],
      safetyFlags: [],
    };
    return [needsOutreach, settling, stable];
  }, []);

  useEffect(() => {
    let active = true;
    listLocalWeeklyDigests().then((digests) => {
      if (!active) return;
      setLocalDigests(digests);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const panel = showDemo ? demoPanel : localDigests;

  const exceptionCount = panel.filter((digest) => digest.outreachRecommended).length;
  const completed = panel.reduce((sum, digest) => sum + digest.missionsCompleted, 0);
  const assigned = panel.reduce((sum, digest) => sum + digest.missionsAssigned, 0);

  useEffect(() => {
    track('care_panel_opened', {
      panel_size: panel.length,
      exception_count: exceptionCount,
      source: showDemo ? 'synthetic_demo' : 'local_programme_summaries',
    });
  }, [panel.length, exceptionCount, showDemo]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.kicker}>Programme operator</Text>
              <Text style={styles.brand}>Sukari</Text>
              <Text style={styles.title}>This week&apos;s attention queue</Text>
            </View>
            <PressableScale onPress={() => router.replace('/')} style={styles.back} accessibilityRole="button">
              <Text style={styles.backText}>Patient view</Text>
            </PressableScale>
          </View>

          {showDemo ? (
            <View style={styles.demoNote}>
              <Text style={styles.demoNoteText}>Synthetic demo cohort. No real patient data is shown.</Text>
            </View>
          ) : (
            <View style={styles.localNote}>
              <Text style={styles.localNoteText}>This device&apos;s stored weekly programme summaries. No raw glucose data is shown.</Text>
            </View>
          )}

          <View style={styles.sourceRow}>
            <Text style={styles.sourceText}>{showDemo ? 'Demo cohort' : 'Local programme summaries'}</Text>
            <PressableScale
              onPress={() => setShowDemo((current) => !current)}
              style={styles.sourceButton}
              accessibilityRole="button"
            >
              <Text style={styles.sourceButtonText}>{showDemo ? 'Use local summaries' : 'Open demo cohort'}</Text>
            </PressableScale>
          </View>

          {loading ? <Text style={styles.loading}>Loading programme summaries…</Text> : null}
          {!loading && panel.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No weekly summaries yet</Text>
              <Text style={styles.emptyText}>Create a care-team summary from the patient view to add a real, minimal programme record here.</Text>
            </View>
          ) : null}

          {panel.length > 0 ? <View style={styles.summaryGrid}>
            <Metric value={String(exceptionCount)} label="people to review" accent={exceptionCount > 0 ? P.warn : P.accent} />
            <Metric value={`${Math.round((completed / Math.max(assigned, 1)) * 100)}%`} label="mission completion" accent={P.accent} />
            <Metric value={String(panel.length - exceptionCount)} label="no action needed" accent={P.cool} />
          </View> : null}

          {panel.some((digest) => digest.outreachRecommended) ? <Text style={styles.sectionLabel}>Needs human attention</Text> : null}
          {panel.filter((digest) => digest.outreachRecommended).map((digest) => (
            <ExceptionCard key={digest.patientLabel} digest={digest} />
          ))}

          {panel.some((digest) => !digest.outreachRecommended) ? <Text style={styles.sectionLabel}>Holding without outreach</Text> : null}
          {panel.filter((digest) => !digest.outreachRecommended).map((digest) => (
            <OutcomeRow key={digest.patientLabel} digest={digest} />
          ))}

          {panel.length > 0 ? <Text style={styles.footer}>
            Sukari narrows care-team attention to the people for whom a human conversation can change the week.
          </Text> : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Metric({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color: accent }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function ExceptionCard({ digest }: { digest: WeeklyDigestPayload & { token?: string } }) {
  const rate = completionRate(digest);
  return (
    <View style={styles.exceptionCard}>
      <View style={styles.cardTopRow}>
        <View>
          <Text style={styles.patient}>{digest.patientLabel}</Text>
          <Text style={styles.status}>Outreach recommended</Text>
        </View>
        <Text style={styles.rate}>{rate}%</Text>
      </View>
      <Text style={styles.reason}>{digest.outreachReason}</Text>
      <Text style={styles.detail}>
        {digest.missionsCompleted}/{digest.missionsAssigned} missions completed · {digest.practiceSessions} rehearsals
      </Text>
      {digest.patientBarriers?.length ? <Text style={styles.detail}>Barriers: {digest.patientBarriers.join(' · ')}</Text> : null}
      <PressableScale
        onPress={() => {
          track('care_outreach_reviewed', { patient: digest.patientLabel || 'programme_member', safety_flags: digest.safetyFlags?.length ?? 0 });
          router.push({ pathname: '/digest/[token]', params: { token: digest.token || 'local-amina-outreach' } });
        }}
        style={styles.reviewButton}
        accessibilityRole="button"
      >
        <Text style={styles.reviewText}>Review rationale</Text>
      </PressableScale>
    </View>
  );
}

function OutcomeRow({ digest }: { digest: WeeklyDigestPayload }) {
  return (
    <View style={styles.outcomeRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.patient}>{digest.patientLabel}</Text>
        <Text style={styles.detail}>{digest.outreachReason}</Text>
      </View>
      <Text style={styles.outcomeRate}>{completionRate(digest)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F6F5' },
  flex: { flex: 1 },
  scroll: { width: '100%', maxWidth: 1080, alignSelf: 'center', padding: 32, paddingBottom: 56 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 },
  kicker: { fontFamily: FONTS.bodyMedium, color: '#5A6B62', fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase' },
  brand: { fontFamily: FONTS.display, color: '#14201B', fontSize: 30, marginTop: 4 },
  title: { fontFamily: FONTS.display, color: '#2A3A33', fontSize: 28, lineHeight: 34, marginTop: 12 },
  back: { borderWidth: 1, borderColor: 'rgba(20,32,27,0.16)', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#FFF' },
  backText: { fontFamily: FONTS.bodyMedium, color: '#2A3A33', fontSize: 13 },
  demoNote: { alignSelf: 'flex-start', marginTop: 18, backgroundColor: 'rgba(196,146,58,0.12)', borderWidth: 1, borderColor: 'rgba(196,146,58,0.45)', paddingHorizontal: 12, paddingVertical: 8 },
  demoNoteText: { fontFamily: FONTS.bodyMedium, color: '#7A5B1D', fontSize: 12 },
  localNote: { alignSelf: 'flex-start', marginTop: 18, backgroundColor: 'rgba(47,122,94,0.10)', borderWidth: 1, borderColor: 'rgba(47,122,94,0.28)', paddingHorizontal: 12, paddingVertical: 8 },
  localNoteText: { fontFamily: FONTS.bodyMedium, color: '#2F634F', fontSize: 12 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14 },
  sourceText: { flex: 1, fontFamily: FONTS.bodyMedium, color: '#5A6B62', fontSize: 12 },
  sourceButton: { borderWidth: 1, borderColor: 'rgba(20,32,27,0.16)', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 9 },
  sourceButtonText: { fontFamily: FONTS.bodyMedium, color: '#2A3A33', fontSize: 12 },
  loading: { fontFamily: FONTS.body, color: '#5A6B62', fontSize: 14, marginTop: 28 },
  emptyState: { borderWidth: 1, borderColor: 'rgba(20,32,27,0.12)', backgroundColor: '#FFF', padding: 20, marginTop: 24 },
  emptyTitle: { fontFamily: FONTS.bodyBold, color: '#14201B', fontSize: 16 },
  emptyText: { fontFamily: FONTS.body, color: '#5A6B62', fontSize: 13, lineHeight: 20, marginTop: 8, maxWidth: 560 },
  summaryGrid: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 34 },
  metric: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: 'rgba(20,32,27,0.12)', padding: 18, minHeight: 106 },
  metricValue: { fontFamily: FONTS.display, fontSize: 34, lineHeight: 40 },
  metricLabel: { fontFamily: FONTS.bodyMedium, color: '#5A6B62', fontSize: 12, marginTop: 6 },
  sectionLabel: { fontFamily: FONTS.bodyMedium, color: '#2F7A5E', fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10 },
  exceptionCard: { backgroundColor: '#FFF', borderWidth: 1, borderColor: 'rgba(196,146,58,0.6)', borderLeftWidth: 4, borderLeftColor: '#C4923A', padding: 20, marginBottom: 30 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  patient: { fontFamily: FONTS.bodyBold, color: '#14201B', fontSize: 15 },
  status: { fontFamily: FONTS.bodyMedium, color: '#8A6A28', fontSize: 12, marginTop: 4 },
  rate: { fontFamily: FONTS.display, color: '#8A6A28', fontSize: 28 },
  reason: { fontFamily: FONTS.body, color: '#2A3A33', fontSize: 15, lineHeight: 22, marginTop: 18 },
  detail: { fontFamily: FONTS.body, color: '#5A6B62', fontSize: 12, lineHeight: 18, marginTop: 8 },
  reviewButton: { alignSelf: 'flex-start', backgroundColor: '#2F7A5E', paddingHorizontal: 14, paddingVertical: 11, marginTop: 18 },
  reviewText: { fontFamily: FONTS.bodyBold, color: '#FFF', fontSize: 13 },
  outcomeRow: { flexDirection: 'row', alignItems: 'center', gap: 18, backgroundColor: '#FFF', borderWidth: 1, borderColor: 'rgba(20,32,27,0.12)', padding: 16, marginBottom: 8 },
  outcomeRate: { fontFamily: FONTS.display, color: '#2F7A5E', fontSize: 24 },
  footer: { fontFamily: FONTS.body, color: '#5A6B62', fontSize: 12, lineHeight: 18, marginTop: 32, maxWidth: 560 },
});
