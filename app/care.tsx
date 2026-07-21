import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getCohortOverview,
  type CohortOverview,
  type CohortPatientSummary,
  type WorkItemStatus,
  type WorkItemFilter,
  type WorkItemSort,
  type WorkQueueState,
  type MiraFlag,
  loadWorkQueue,
  saveWorkQueue,
  getWorkItem,
  updateWorkItemStatus,
  snoozeWorkItem,
  reopenExpiredSnoozes,
  filterByStatus,
  sortPatients,
  statusCounts,
  generateMiraFlags,
  topFlagForPatient,
  computeArchetypeCompletion,
  stampArchetypeContext,
} from '@/domain/cohort';
import { listLocalWeeklyDigests, type StoredWeeklyDigest } from '@/domain/digest';
import { FONTS } from '@/constants/designSystem';
import { PressableScale } from '@/components/ui/PressableScale';
import { track } from '@/utils/analytics';

const STATUS_COLORS: Record<WorkItemStatus, { bg: string; border: string; text: string; label: string }> = {
  open: { bg: 'rgba(196,146,58,0.10)', border: '#C4923A', text: '#8A6A28', label: 'Open' },
  contacted: { bg: 'rgba(74,143,168,0.10)', border: '#4A8FA8', text: '#3A6B7E', label: 'Contacted' },
  snoozed: { bg: 'rgba(90,107,98,0.08)', border: '#5A6B62', text: '#5A6B62', label: 'Snoozed' },
  resolved: { bg: 'rgba(47,122,94,0.10)', border: '#2F7A5E', text: '#2F634F', label: 'Resolved' },
};

const SEVERITY_COLORS: Record<MiraFlag['severity'], string> = {
  urgent: '#C94C3F',
  worth_a_conversation: '#C4923A',
  positive: '#2F7A5E',
};

const PRIORITY_LEFT: Record<number, string> = {
  0: '#C94C3F',
  1: '#C4923A',
  2: '#5A6B62',
  3: '#2F7A5E',
};

export default function CarePanelScreen() {
  const [cohort, setCohort] = useState<CohortOverview | null>(null);
  const [workQueue, setWorkQueue] = useState<WorkQueueState>({});
  const [localDigests, setLocalDigests] = useState<StoredWeeklyDigest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<WorkItemFilter>('open');
  const [sort, setSort] = useState<WorkItemSort>('priority');
  const [showLocal, setShowLocal] = useState(false);
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const compact = width < 700;

  // Load cohort + work queue + local digests
  useEffect(() => {
    let active = true;
    Promise.all([getCohortOverview(), loadWorkQueue(), listLocalWeeklyDigests()]).then(
      ([c, wq, digests]) => {
        if (!active) return;
        const reopened = reopenExpiredSnoozes(wq);
        setCohort(c);
        setWorkQueue(reopened);
        setLocalDigests(digests);
        setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  // Persist work queue on every change
  const updateQueue = useCallback((updater: (prev: WorkQueueState) => WorkQueueState) => {
    setWorkQueue((prev) => {
      const next = updater(prev);
      saveWorkQueue(next);
      return next;
    });
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
    const archetypeCompletion = computeArchetypeCompletion(patients);
    stampArchetypeContext(patients, archetypeCompletion);
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
        archetypeCompletion,
      },
      patients: patients.sort((a, b) => a.priority - b.priority),
      source: 'local' as const,
    };
  }, [localDigests]);

  const view = showLocal && localCohort ? localCohort : cohort;

  // Generate Mira flags
  const miraFlags = useMemo(() => {
    if (!view) return [];
    return generateMiraFlags(view.patients, workQueue);
  }, [view, workQueue]);

  // Filter + sort patients
  const filteredPatients = useMemo(() => {
    if (!view) return [];
    const filtered = filterByStatus(view.patients, workQueue, filter);
    return sortPatients(filtered, workQueue, sort);
  }, [view, workQueue, filter, sort]);

  const counts = useMemo(() => {
    if (!view) return { open: 0, contacted: 0, resolved: 0, snoozed: 0 };
    return statusCounts(view.patients, workQueue);
  }, [view, workQueue]);

  useEffect(() => {
    if (!view) return;
    track('care_panel_opened', {
      panel_size: view.aggregate.enrolled,
      open_items: counts.open,
      source: view.source,
    });
  }, [view, counts.open]);

  const handleStatusChange = useCallback(
    (patientLabel: string, status: WorkItemStatus) => {
      updateQueue((prev) => updateWorkItemStatus(prev, patientLabel, status));
      track('care_work_item_updated', { patient: patientLabel, status });
    },
    [updateQueue],
  );

  const handleSnooze = useCallback(
    (patientLabel: string, hours: number) => {
      updateQueue((prev) => snoozeWorkItem(prev, patientLabel, hours));
      track('care_work_item_snoozed', { patient: patientLabel, hours });
    },
    [updateQueue],
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex}>
        <ScrollView
          contentContainerStyle={[styles.scroll, compact && styles.scrollCompact]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={[styles.headerRow, compact && styles.headerRowCompact]}>
            <View>
              <Text style={styles.kicker}>Programme operator</Text>
              <Text style={styles.brand}>Sukari</Text>
              <Text style={styles.title}>Mira&apos;s work queue</Text>
            </View>
            <PressableScale
              onPress={() => router.replace('/')}
              style={styles.back}
              accessibilityRole="button"
            >
              <Text style={styles.backText}>Patient view</Text>
            </PressableScale>
          </View>

          {/* Source note */}
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

          {loading ? <Text style={styles.loading}>Loading work queue…</Text> : null}

          {!loading && view ? (
            <>
              {/* Aggregate header */}
              <AggregateHeader aggregate={view.aggregate} counts={counts} compact={compact} />

              {/* Mira flags section */}
              {miraFlags.length > 0 ? (
                <View style={styles.flagsSection}>
                  <Text style={styles.flagsTitle}>Mira&apos;s observations</Text>
                  <Text style={styles.flagsSubtitle}>
                    What Mira noticed while working with your patients this week.
                  </Text>
                  {miraFlags.slice(0, 6).map((flag, i) => (
                    <MiraFlagCard key={`${flag.patientLabel}-${i}`} flag={flag} />
                  ))}
                </View>
              ) : null}

              {/* Filter bar */}
              <View style={styles.filterBar}>
                {(['open', 'contacted', 'snoozed', 'resolved', 'all'] as WorkItemFilter[]).map((f) => (
                  <Pressable
                    key={f}
                    onPress={() => setFilter(f)}
                    style={[styles.filterChip, filter === f && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                      {f} ({counts[f as WorkItemStatus] ?? 0})
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Sort selector */}
              <View style={styles.sortRow}>
                <Text style={styles.sortLabel}>Sort by:</Text>
                {(['priority', 'completion', 'recent'] as WorkItemSort[]).map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setSort(s)}
                    style={[styles.sortChip, sort === s && styles.sortChipActive]}
                  >
                    <Text style={[styles.sortChipText, sort === s && styles.sortChipTextActive]}>
                      {s === 'recent' ? 'recently updated' : s}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Work queue items */}
              {filteredPatients.length === 0 ? (
                <View style={styles.emptyQueue}>
                  <Text style={styles.emptyQueueTitle}>
                    {filter === 'open' ? 'No open items' : `No ${filter} items`}
                  </Text>
                  <Text style={styles.emptyQueueText}>
                    {filter === 'open'
                      ? 'All patients are contacted, snoozed, or resolved. Nice work.'
                      : 'Switch filters to see other patients.'}
                  </Text>
                </View>
              ) : (
                filteredPatients.map((p) => (
                  <WorkQueueRow
                    key={p.patientLabel}
                    patient={p}
                    workItem={getWorkItem(workQueue, p.patientLabel)}
                    flag={topFlagForPatient(p, workQueue)}
                    expanded={expandedPatient === p.patientLabel}
                    compact={compact}
                    onToggle={() =>
                      setExpandedPatient((cur) =>
                        cur === p.patientLabel ? null : p.patientLabel,
                      )
                    }
                    onStatusChange={handleStatusChange}
                    onSnooze={handleSnooze}
                  />
                ))
              )}

              <Text style={styles.footer}>
                Mira narrows care-team attention to the people for whom a human conversation can
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

function AggregateHeader({
  aggregate,
  counts,
  compact,
}: {
  aggregate: CohortOverview['aggregate'];
  counts: Record<WorkItemStatus, number>;
  compact: boolean;
}) {
  return (
    <View style={styles.aggregateBlock}>
      <View style={[styles.aggregateGrid, compact && styles.aggregateGridCompact]}>
        <Metric
          value={String(counts.open)}
          label="open items"
          accent={counts.open > 0 ? '#C4923A' : '#2F7A5E'}
          compact={compact}
        />
        <Metric
          value={`${aggregate.weeklyAdherentPatients}/${aggregate.enrolled}`}
          label="weekly adherent"
          accent="#2F7A5E"
          compact={compact}
        />
        <Metric
          value={`${aggregate.cohortCompletionRate}%`}
          label="cohort completion"
          accent="#2A3A33"
          compact={compact}
        />
        <Metric
          value={String(aggregate.totalStaffMinutesSaved)}
          label="min saved this week"
          accent="#2F7A5E"
          compact={compact}
        />
      </View>
      {aggregate.archetypeCompletion
        ? (() => {
            const entries = Object.entries(aggregate.archetypeCompletion).sort(
              ([, a], [, b]) => b.count - a.count,
            );
            if (entries.length === 0) return null;
            return (
              <View style={[styles.archetypeLine, compact && styles.archetypeLineCompact]}>
                <Text style={styles.archetypeLabel}>By mission type this week:</Text>
                <View style={styles.archetypeChips}>
                  {entries.slice(0, 4).map(([behaviour, stats]) => (
                    <View key={behaviour} style={styles.archetypeChip}>
                      <Text style={styles.archetypeChipText}>
                        {behaviour.replace(/_/g, ' ')} · {stats.rate}% · {stats.count}{' '}
                        {stats.count === 1 ? 'patient' : 'patients'}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })()
        : null}
    </View>
  );
}

function Metric({
  value,
  label,
  accent,
  compact,
}: {
  value: string;
  label: string;
  accent: string;
  compact: boolean;
}) {
  return (
    <View style={[styles.metric, compact && styles.metricCompact]}>
      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.metricValue, { color: accent }]}>
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function MiraFlagCard({ flag }: { flag: MiraFlag }) {
  const color = SEVERITY_COLORS[flag.severity];
  return (
    <View style={[styles.flagCard, { borderLeftColor: color }]}>
      <View style={styles.flagHeader}>
        <Text style={[styles.flagPatient, { color }]}>{flag.patientLabel}</Text>
        <Text style={[styles.flagSeverity, { color }]}>
          {flag.severity === 'urgent'
            ? 'URGENT'
            : flag.severity === 'worth_a_conversation'
              ? 'WORTH A CONVERSATION'
              : 'POSITIVE'}
        </Text>
      </View>
      <Text style={styles.flagMessage}>{flag.message}</Text>
      <Text style={styles.flagSuggestion}>{flag.suggestion}</Text>
      {flag.miraActed ? (
        <Text style={styles.flagActed}>Mira has already reached out to the patient.</Text>
      ) : null}
    </View>
  );
}

function WorkQueueRow({
  patient,
  workItem,
  flag,
  expanded,
  compact,
  onToggle,
  onStatusChange,
  onSnooze,
}: {
  patient: CohortPatientSummary;
  workItem: ReturnType<typeof getWorkItem>;
  flag: MiraFlag | null;
  expanded: boolean;
  compact: boolean;
  onToggle: () => void;
  onStatusChange: (label: string, status: WorkItemStatus) => void;
  onSnooze: (label: string, hours: number) => void;
}) {
  const sc = STATUS_COLORS[workItem.status];
  const priorityLeft = PRIORITY_LEFT[patient.priority];
  const hasToken = (patient.digest as StoredWeeklyDigest | null)?.token;

  return (
    <View style={[styles.workRow, { borderLeftColor: priorityLeft }]}>
      {/* Status badge */}
      <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
        <Text style={[styles.statusBadgeText, { color: sc.text }]}>{sc.label}</Text>
      </View>

      {/* Main row */}
      <PressableScale onPress={onToggle} style={styles.rowTop} accessibilityRole="button">
        <View style={{ flex: 1 }}>
          <Text style={styles.patientName}>{patient.patientLabel}</Text>
          {flag ? (
            <Text style={[styles.flagPreview, { color: SEVERITY_COLORS[flag.severity] }]}>
              {flag.message}
            </Text>
          ) : (
            <Text style={styles.priorityReason}>{patient.priorityReason}</Text>
          )}
        </View>
        <View style={styles.rowMetric}>
          <Text style={styles.rowRate}>{patient.completionRate}%</Text>
          <Text style={styles.rowMetricLabel}>
            {patient.missionsCompleted}/{patient.missionsAssigned} missions
          </Text>
        </View>
      </PressableScale>

      {/* Expanded detail + actions */}
      {expanded ? (
        <View style={styles.rowDetail}>
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
          {patient.cohortMedianForArchetype != null && patient.primaryBehaviour ? (
            <Text style={styles.detailLine}>
              Cohort median for {patient.primaryBehaviour.replace(/_/g, ' ')} this week:{' '}
              {patient.cohortMedianForArchetype}% completion
            </Text>
          ) : null}
          {patient.staffMinutesSaved > 0 ? (
            <Text style={styles.detailLine}>{patient.staffMinutesSaved} min saved this week</Text>
          ) : null}
          {workItem.note ? (
            <Text style={[styles.detailLine, { fontStyle: 'italic' }]}>
              Note: {workItem.note}
            </Text>
          ) : null}

          {/* Quick actions */}
          <View style={styles.actionRow}>
            {workItem.status !== 'contacted' ? (
              <PressableScale
                onPress={() => onStatusChange(patient.patientLabel, 'contacted')}
                style={[styles.actionButton, { backgroundColor: '#4A8FA8' }]}
                accessibilityRole="button"
              >
                <Text style={styles.actionButtonText}>Mark contacted</Text>
              </PressableScale>
            ) : null}
            {workItem.status !== 'resolved' ? (
              <PressableScale
                onPress={() => onStatusChange(patient.patientLabel, 'resolved')}
                style={[styles.actionButton, { backgroundColor: '#2F7A5E' }]}
                accessibilityRole="button"
              >
                <Text style={styles.actionButtonText}>Resolve</Text>
              </PressableScale>
            ) : null}
            {workItem.status !== 'snoozed' ? (
              <PressableScale
                onPress={() => onSnooze(patient.patientLabel, 24)}
                style={[styles.actionButton, { backgroundColor: '#5A6B62' }]}
                accessibilityRole="button"
              >
                <Text style={styles.actionButtonText}>Snooze 24h</Text>
              </PressableScale>
            ) : null}
            {workItem.status !== 'open' ? (
              <PressableScale
                onPress={() => onStatusChange(patient.patientLabel, 'open')}
                style={[styles.actionButton, { backgroundColor: '#C4923A' }]}
                accessibilityRole="button"
              >
                <Text style={styles.actionButtonText}>Reopen</Text>
              </PressableScale>
            ) : null}
          </View>

          {hasToken ? (
            <PressableScale
              onPress={() => {
                track('care_outreach_reviewed', {
                  patient: patient.patientLabel,
                  safety_flags: patient.digest?.safetyFlags?.length ?? 0,
                });
                router.push({ pathname: '/digest/[token]', params: { token: hasToken } });
              }}
              style={styles.reviewButton}
              accessibilityRole="button"
            >
              <Text style={styles.reviewText}>Review full rationale</Text>
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
  scrollCompact: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 44 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 },
  headerRowCompact: { gap: 12 },
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
  aggregateGrid: { flexDirection: 'row', gap: 10, marginTop: 24 },
  aggregateGridCompact: { flexWrap: 'wrap' },
  aggregateBlock: { marginBottom: 30 },
  archetypeLine: { marginTop: 14, backgroundColor: '#FFF', borderWidth: 1, borderColor: 'rgba(20,32,27,0.10)', padding: 14 },
  archetypeLineCompact: { padding: 12 },
  archetypeLabel: { fontFamily: FONTS.bodyMedium, color: '#5A6B62', fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 },
  archetypeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  archetypeChip: { backgroundColor: 'rgba(47,122,94,0.08)', borderWidth: 1, borderColor: 'rgba(47,122,94,0.20)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 2 },
  archetypeChipText: { fontFamily: FONTS.bodyMedium, color: '#2F634F', fontSize: 12 },
  metric: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: 'rgba(20,32,27,0.12)', padding: 16, minHeight: 96 },
  metricCompact: { flexBasis: '46%', flexGrow: 1, flexShrink: 0, maxWidth: '48%', minHeight: 104 },
  metricValue: { fontFamily: FONTS.display, fontSize: 30, lineHeight: 36 },
  metricLabel: { fontFamily: FONTS.bodyMedium, color: '#5A6B62', fontSize: 12, marginTop: 6 },
  // Mira flags
  flagsSection: { marginTop: 8, marginBottom: 28 },
  flagsTitle: { fontFamily: FONTS.display, color: '#14201B', fontSize: 20, marginBottom: 4 },
  flagsSubtitle: { fontFamily: FONTS.body, color: '#5A6B62', fontSize: 13, lineHeight: 19, marginBottom: 14 },
  flagCard: { backgroundColor: '#FFF', borderWidth: 1, borderColor: 'rgba(20,32,27,0.10)', borderLeftWidth: 4, padding: 16, marginBottom: 8 },
  flagHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  flagPatient: { fontFamily: FONTS.bodyBold, fontSize: 13 },
  flagSeverity: { fontFamily: FONTS.bodyBold, fontSize: 10, letterSpacing: 1.2 },
  flagMessage: { fontFamily: FONTS.body, color: '#2A3A33', fontSize: 14, lineHeight: 21, marginBottom: 6 },
  flagSuggestion: { fontFamily: FONTS.bodyMedium, color: '#5A6B62', fontSize: 13, lineHeight: 19 },
  flagActed: { fontFamily: FONTS.bodyMedium, color: '#2F7A5E', fontSize: 12, marginTop: 6, fontStyle: 'italic' },
  // Filter bar
  filterBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#FFF', borderWidth: 1, borderColor: 'rgba(20,32,27,0.12)', borderRadius: 2 },
  filterChipActive: { backgroundColor: '#14201B', borderColor: '#14201B' },
  filterChipText: { fontFamily: FONTS.bodyMedium, color: '#5A6B62', fontSize: 12, textTransform: 'capitalize' },
  filterChipTextActive: { color: '#FFF' },
  // Sort
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  sortLabel: { fontFamily: FONTS.bodyMedium, color: '#5A6B62', fontSize: 12 },
  sortChip: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#FFF', borderWidth: 1, borderColor: 'rgba(20,32,27,0.10)', borderRadius: 2 },
  sortChipActive: { backgroundColor: 'rgba(47,122,94,0.15)', borderColor: '#2F7A5E' },
  sortChipText: { fontFamily: FONTS.bodyMedium, color: '#5A6B62', fontSize: 12 },
  sortChipTextActive: { color: '#2F634F' },
  // Empty state
  emptyQueue: { backgroundColor: '#FFF', borderWidth: 1, borderColor: 'rgba(20,32,27,0.10)', padding: 24, marginBottom: 16 },
  emptyQueueTitle: { fontFamily: FONTS.bodyBold, color: '#14201B', fontSize: 15, marginBottom: 6 },
  emptyQueueText: { fontFamily: FONTS.body, color: '#5A6B62', fontSize: 13, lineHeight: 19 },
  // Work queue rows
  workRow: { backgroundColor: '#FFF', borderWidth: 1, borderColor: 'rgba(20,32,27,0.10)', borderLeftWidth: 4, padding: 14, marginBottom: 8 },
  statusBadge: { alignSelf: 'flex-start', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8, borderRadius: 2 },
  statusBadgeText: { fontFamily: FONTS.bodyBold, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 },
  patientName: { fontFamily: FONTS.bodyBold, color: '#14201B', fontSize: 14 },
  flagPreview: { fontFamily: FONTS.body, fontSize: 12, lineHeight: 18, marginTop: 4 },
  priorityReason: { fontFamily: FONTS.bodyMedium, color: '#5A6B62', fontSize: 12, marginTop: 4 },
  rowMetric: { alignItems: 'flex-end', minWidth: 80 },
  rowRate: { fontFamily: FONTS.display, color: '#2A3A33', fontSize: 22 },
  rowMetricLabel: { fontFamily: FONTS.body, color: '#718078', fontSize: 11, marginTop: 2 },
  rowDetail: { marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(20,32,27,0.08)', paddingTop: 12 },
  detailLine: { fontFamily: FONTS.body, color: '#5A6B62', fontSize: 13, lineHeight: 19, marginBottom: 4 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  actionButton: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 2 },
  actionButtonText: { fontFamily: FONTS.bodyBold, color: '#FFF', fontSize: 12 },
  reviewButton: { alignSelf: 'flex-start', backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(20,32,27,0.16)', paddingHorizontal: 14, paddingVertical: 9, marginTop: 10 },
  reviewText: { fontFamily: FONTS.bodyBold, color: '#2A3A33', fontSize: 12 },
  footer: { fontFamily: FONTS.body, color: '#5A6B62', fontSize: 13, lineHeight: 19, marginTop: 36, maxWidth: 560 },
});
