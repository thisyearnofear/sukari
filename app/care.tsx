import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCohortOverview, type CohortOverview, type CohortPatientSummary } from '@/domain/cohort';
import { listLocalWeeklyDigests, type StoredWeeklyDigest } from '@/domain/digest';
import { FONTS } from '@/constants/designSystem';
import { PressableScale } from '@/components/ui/PressableScale';
import { track } from '@/utils/analytics';

export default function CarePanelScreen() {
  const [cohort, setCohort] = useState<CohortOverview | null>(null);
  const [localDigests, setLocalDigests] = useState<StoredWeeklyDigest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLocal, setShowLocal] = useState(false);
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getCohortOverview(), listLocalWeeklyDigests()]).then(([c, digests]) => {
      if (!active) return;
      setCohort(c);
      setLocalDigests(digests);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const localCohort = useMemo<CohortOverview | null>(() => {
    if (localDigests.length === 0) return null;
    const patients: CohortPatientSummary[] = localDigests.map((d) => {
      const rate = Math.round((d.missionsCompleted / Math.max(1, d.missionsAssigned)) * 100);
      const hasSafety = (d.safetyFlags?.length ?? 0) > 0;
      const priority: 0 | 1 | 2 | 3 = hasSafety ? 0 : d.outreachRecommended ? 1 : 2;
      return {
        patientLabel: d.patientLabel || 'Programme member',
        priority,
        digest: d,
        missionsCompleted: d.missionsCompleted,
        missionsAssigned: d.missionsAssigned,
        completionRate: rate,
        hasSafetyFlag: hasSafety,
        outreachRecommended: !!d.outreachRecommended,
        priorityReason: hasSafety
          ? 'Safety flag — clinical review'
          : d.outreachRecommended
            ? 'Outreach recommended'
            : 'Holding',
        staffMinutesSaved: 0,
      };
    });
    return {
      weekKey: localDigests[0]?.weekKey || '',
      aggregate: {
        enrolled: patients.length,
        needsAttention: patients.filter((p) => p.priority <= 1).length,
        holding: patients.filter((p) => p.priority === 2).length,
        stable: 0,
        cohortCompletionRate: Math.round(
          (patients.reduce((s, p) => s + p.missionsCompleted, 0) /
            Math.max(1, patients.reduce((s, p) => s + p.missionsAssigned, 0))) *
            100,
        ),
        totalStaffMinutesSaved: 0,
        weeklyAdherentPatients: patients.filter((p) => p.missionsCompleted > 0).length,
      },
      patients: patients.sort((a, b) => a.priority - b.priority),
      source: 'local' as const,
    };
  }, [localDigests]);

  const view = showLocal && localCohort ? localCohort : cohort;

  useEffect(() => {
    if (!view) return;
    track('care_panel_opened', {
      panel_size: view.aggregate.enrolled,
      exception_count: view.aggregate.needsAttention,
      source: view.source,
    });
  }, [view]);

  const needsAttention = view?.patients.filter((p) => p.priority <= 1) ?? [];
  const holding = view?.patients.filter((p) => p.priority === 2) ?? [];
  const stable = view?.patients.filter((p) => p.priority === 3) ?? [];

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.kicker}>Programme operator</Text>
              <Text style={styles.brand}>Sukari</Text>
              <Text style={styles.title}>This week&apos;s cohort</Text>
            </View>
            <PressableScale onPress={() => router.replace('/')} style={styles.back} accessibilityRole="button">
              <Text style={styles.backText}>Patient view</Text>
            </PressableScale>
          </View>

          {view?.source === 'synthetic' ? (
            <View style={styles.demoNote}>
              <Text style={styles.demoNoteText}>
                Synthetic demo cohort — 30 programme members. No real patient data is shown.
              </Text>
            </View>
          ) : view?.source === 'local' ? (
            <View style={styles.localNote}>
              <Text style={styles.localNoteText}>
                This device&apos;s stored weekly summaries. No raw glucose data is shown.
              </Text>
            </View>
          ) : null}

          {localCohort ? (
            <View style={styles.sourceRow}>
              <Text style={styles.sourceText}>
                {showLocal ? 'Local summaries' : 'Synthetic cohort'}
              </Text>
              <PressableScale
                onPress={() => setShowLocal((c) => !c)}
                style={styles.sourceButton}
                accessibilityRole="button"
              >
                <Text style={styles.sourceButtonText}>
                  {showLocal ? 'Show synthetic cohort' : 'Show local summaries'}
                </Text>
              </PressableScale>
            </View>
          ) : null}

          {loading ? <Text style={styles.loading}>Loading cohort…</Text> : null}

          {!loading && view ? (
            <>
              <AggregateHeader aggregate={view.aggregate} />

              {needsAttention.length > 0 ? (
                <Text style={styles.sectionLabel}>Needs human attention ({needsAttention.length})</Text>
              ) : null}
              {needsAttention.map((p) => (
                <PatientRow
                  key={p.patientLabel}
                  patient={p}
                  expanded={expandedPatient === p.patientLabel}
                  onToggle={() =>
                    setExpandedPatient((cur) => (cur === p.patientLabel ? null : p.patientLabel))
                  }
                />
              ))}

              {holding.length > 0 ? (
                <Text style={[styles.sectionLabel, { color: '#5A6B62', marginTop: 28 }]}>
                  Holding without outreach ({holding.length})
                </Text>
              ) : null}
              {holding.map((p) => (
                <PatientRow
                  key={p.patientLabel}
                  patient={p}
                  expanded={expandedPatient === p.patientLabel}
                  onToggle={() =>
                    setExpandedPatient((cur) => (cur === p.patientLabel ? null : p.patientLabel))
                  }
                />
              ))}

              {stable.length > 0 ? (
                <Text style={[styles.sectionLabel, { color: '#2F7A5E', marginTop: 28 }]}>
                  Stable this week ({stable.length})
                </Text>
              ) : null}
              {stable.map((p) => (
                <PatientRow
                  key={p.patientLabel}
                  patient={p}
                  expanded={expandedPatient === p.patientLabel}
                  onToggle={() =>
                    setExpandedPatient((cur) => (cur === p.patientLabel ? null : p.patientLabel))
                  }
                />
              ))}

              <Text style={styles.footer}>
                Sukari narrows care-team attention to the people for whom a human conversation can
                change the week. {view.aggregate.totalStaffMinutesSaved} estimated staff minutes
                saved across {view.aggregate.enrolled} enrolled patients.
              </Text>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function AggregateHeader({ aggregate }: { aggregate: CohortOverview['aggregate'] }) {
  return (
    <View style={styles.aggregateGrid}>
      <Metric
        value={String(aggregate.needsAttention)}
        label="need attention"
        accent={aggregate.needsAttention > 0 ? '#C4923A' : '#2F7A5E'}
      />
      <Metric
        value={`${aggregate.weeklyAdherentPatients}/${aggregate.enrolled}`}
        label="weekly adherent"
        accent="#2F7A5E"
      />
      <Metric
        value={`${aggregate.cohortCompletionRate}%`}
        label="cohort completion"
        accent="#2A3A33"
      />
      <Metric
        value={String(aggregate.totalStaffMinutesSaved)}
        label="min saved"
        accent="#2F7A5E"
      />
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

const PRIORITY_COLORS: Record<number, { border: string; left: string; text: string }> = {
  0: { border: 'rgba(201,76,63,0.5)', left: '#C94C3F', text: '#C94C3F' },
  1: { border: 'rgba(196,146,58,0.6)', left: '#C4923A', text: '#8A6A28' },
  2: { border: 'rgba(20,32,27,0.12)', left: '#5A6B62', text: '#5A6B62' },
  3: { border: 'rgba(47,122,94,0.25)', left: '#2F7A5E', text: '#2F7A5E' },
};

function PatientRow({
  patient,
  expanded,
  onToggle,
}: {
  patient: CohortPatientSummary;
  expanded: boolean;
  onToggle: () => void;
}) {
  const c = PRIORITY_COLORS[patient.priority];
  const hasToken = (patient.digest as StoredWeeklyDigest | null)?.token;

  return (
    <View style={[styles.patientRow, { borderColor: c.border, borderLeftColor: c.left }]}>
      <PressableScale onPress={onToggle} style={styles.rowTop} accessibilityRole="button">
        <View style={{ flex: 1 }}>
          <Text style={styles.patientName}>{patient.patientLabel}</Text>
          <Text style={[styles.priorityReason, { color: c.text }]}>{patient.priorityReason}</Text>
        </View>
        <Text style={[styles.rowRate, { color: c.text }]}>{patient.completionRate}%</Text>
      </PressableScale>

      {expanded ? (
        <View style={styles.rowDetail}>
          <Text style={styles.detailLine}>
            {patient.missionsCompleted}/{patient.missionsAssigned} missions completed
          </Text>
          {patient.digest?.outreachReason ? (
            <Text style={styles.detailLine}>{patient.digest.outreachReason}</Text>
          ) : null}
          {patient.digest?.patientBarriers?.length ? (
            <Text style={styles.detailLine}>
              Barriers: {patient.digest.patientBarriers.join(' · ')}
            </Text>
          ) : null}
          {patient.digest?.safetyFlags?.length ? (
            <Text style={[styles.detailLine, { color: '#C94C3F' }]}>
              Safety: {patient.digest.safetyFlags.join(' · ')}
            </Text>
          ) : null}
          {patient.digest?.wins?.length ? (
            <Text style={styles.detailLine}>Wins: {patient.digest.wins[0]}</Text>
          ) : null}
          {patient.staffMinutesSaved > 0 ? (
            <Text style={styles.detailLine}>{patient.staffMinutesSaved} min saved this week</Text>
          ) : null}

          {hasToken ? (
            <PressableScale
              onPress={() => {
                track('care_outreach_reviewed', {
                  patient: patient.patientLabel,
                  safety_flags: patient.digest?.safetyFlags?.length ?? 0,
                });
                router.push({
                  pathname: '/digest/[token]',
                  params: { token: hasToken },
                });
              }}
              style={styles.reviewButton}
              accessibilityRole="button"
            >
              <Text style={styles.reviewText}>Review rationale</Text>
            </PressableScale>
          ) : null}
        </View>
      ) : null}
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
  aggregateGrid: { flexDirection: 'row', gap: 10, marginTop: 24, marginBottom: 30 },
  metric: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: 'rgba(20,32,27,0.12)', padding: 16, minHeight: 96 },
  metricValue: { fontFamily: FONTS.display, fontSize: 30, lineHeight: 36 },
  metricLabel: { fontFamily: FONTS.bodyMedium, color: '#5A6B62', fontSize: 11, marginTop: 6 },
  sectionLabel: { fontFamily: FONTS.bodyMedium, color: '#2F7A5E', fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10 },
  patientRow: { backgroundColor: '#FFF', borderWidth: 1, borderLeftWidth: 4, padding: 16, marginBottom: 8 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  patientName: { fontFamily: FONTS.bodyBold, color: '#14201B', fontSize: 14 },
  priorityReason: { fontFamily: FONTS.bodyMedium, fontSize: 12, marginTop: 4 },
  rowRate: { fontFamily: FONTS.display, fontSize: 24 },
  rowDetail: { marginTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(20,32,27,0.08)', paddingTop: 12 },
  detailLine: { fontFamily: FONTS.body, color: '#5A6B62', fontSize: 12, lineHeight: 18, marginBottom: 4 },
  reviewButton: { alignSelf: 'flex-start', backgroundColor: '#2F7A5E', paddingHorizontal: 14, paddingVertical: 10, marginTop: 10 },
  reviewText: { fontFamily: FONTS.bodyBold, color: '#FFF', fontSize: 12 },
  footer: { fontFamily: FONTS.body, color: '#5A6B62', fontSize: 12, lineHeight: 18, marginTop: 36, maxWidth: 560 },
});
