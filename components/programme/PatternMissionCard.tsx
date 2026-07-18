/**
 * Pattern → mission card — mission first; pattern detail on demand.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { MetabolicPattern, ExperimentOutcome } from '@/domain/patterns';
import type { ProgrammeMission } from '@/domain/programme';
import { COLORS, FONTS } from '@/constants/designSystem';
import { PressableScale } from '@/components/ui/PressableScale';
import { AgencyLaneTag } from '@/components/programme/AgencyLaneTag';
import {
  buildAgentDecisionTrace,
  buildMissionAdaptation,
  buildMissionMediaBrief,
  type MissionAdaptation,
  type PersonalisedWorldState,
  worldSceneLabel,
  worldToneCopy,
} from '@/domain/agent';
import { MissionVisual } from '@/components/programme/MissionVisual';
import { getPracticeCueForTemplate } from '@/domain/programme';

const P = COLORS.PROGRAMME;

export type MissionEase = 'accept' | 'easier' | 'not_practical';

interface PatternMissionCardProps {
  pattern: MetabolicPattern;
  mission: ProgrammeMission | null;
  outcome?: ExperimentOutcome | null;
  reflection?: string | null;
  demoLabel?: string | null;
  onAccept?: () => void;
  onMakeEasier?: () => void;
  onNotPractical?: () => void;
  onWhy?: () => void;
  onMarkDone?: () => void;
  onLater?: () => void;
  missionChoice?: MissionEase | null;
  adaptation?: MissionAdaptation | null;
  worldState?: PersonalisedWorldState | null;
  /** Soft home state after “Later today” */
  deferred?: boolean;
}

export function PatternMissionCard({
  pattern,
  mission,
  outcome,
  reflection,
  demoLabel,
  onAccept,
  onMakeEasier,
  onNotPractical,
  onWhy,
  onMarkDone,
  onLater,
  missionChoice,
  adaptation,
  worldState,
  deferred = false,
}: PatternMissionCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const done = mission?.status === 'completed';
  const practiced = mission?.status === 'practiced' || done;
  const accepted = !!missionChoice && missionChoice !== 'not_practical';
  const canLogRealWorldAction = (accepted || practiced || deferred) && !done;
  const decisionState = done ? 'completed' : deferred ? 'deferred' : accepted || practiced ? 'accepted' : 'unselected';
  const trace = buildAgentDecisionTrace(pattern, mission, decisionState);
  const mediaBrief = buildMissionMediaBrief(pattern, mission, worldState);
  const practiceCue = getPracticeCueForTemplate(mission?.templateId || pattern.suggestedBehaviour);

  const experimentText =
    (missionChoice === 'easier' && adaptation?.action) ||
    (missionChoice === 'easier'
      ? buildMissionAdaptation(mission?.templateId || pattern.suggestedBehaviour, 'easier').action
      : mission?.realWorldAction || pattern.suggestedExperiment);

  return (
    <View style={styles.root}>
      {demoLabel ? (
        <View style={styles.demoBanner}>
          <Text style={styles.demoText}>{demoLabel}</Text>
        </View>
      ) : null}

      {deferred && !done ? (
        <View style={styles.waitBanner}>
          <Text style={styles.waitTitle}>Waiting on you today</Text>
          <Text style={styles.waitBody}>
            Your action is saved for later today. Mark it when you’ve finished it in real life — no
            penalty for waiting.
          </Text>
        </View>
      ) : null}

      <View style={styles.cardHeader}>
        <Text style={[styles.eyebrow, styles.cardHeaderEyebrow]}>Today&apos;s mission</Text>
        <AgencyLaneTag lane="always" />
      </View>
      <MissionVisual brief={mediaBrief} worldState={worldState} requestPersonalisation={showDetails} />
      <Text style={styles.missionAction}>{experimentText}</Text>

      {practiceCue ? (
        <View style={styles.practiceCue} accessible accessibilityRole="summary">
          <Text style={styles.practiceCueLabel}>TODAY&apos;S PRACTICE FIELD</Text>
          <Text style={styles.practiceCueText}>
            {worldState ? `${worldSceneLabel(worldState.scene)} · ${worldToneCopy(worldState)}` : practiceCue.label}
          </Text>
          <Text style={styles.practiceCueDetail}>{practiceCue.detail}</Text>
        </View>
      ) : null}

      {adaptation ? (
        <View style={styles.adaptation} accessibilityLiveRegion="polite">
          <Text style={styles.adaptationLabel}>{adaptation.label}</Text>
          <Text style={styles.adaptationBody}>
            {missionChoice === 'easier'
              ? 'A smaller version is ready. You can change it again at any time.'
              : 'No pressure. Your mission is waiting when you are ready.'}
          </Text>
        </View>
      ) : null}

      <PressableScale
        onPress={() => {
          setShowDetails((v) => !v);
          onWhy?.();
        }}
        accessibilityRole="button"
        accessibilityLabel="Toggle pattern details"
        style={styles.linkBtn}
      >
        <Text style={styles.linkText}>{showDetails ? 'Hide context' : 'Why this?'}</Text>
      </PressableScale>

      {showDetails ? (
        <View style={styles.details}>
          <Text style={styles.patternOneLiner}>{pattern.headline}</Text>
          <Text style={styles.detailBody}>{pattern.explanation}</Text>
          <View style={styles.trace} accessibilityRole="summary">
            <Text style={styles.traceLabel}>Sukari&apos;s decision trace</Text>
            <Text style={styles.traceLine}>Observed: {trace.observed}</Text>
            <Text style={styles.traceLine}>Proposed: {trace.proposed}</Text>
            <Text style={styles.traceLine}>Next: {trace.next}</Text>
            <Text style={styles.traceMeta}>{trace.confidenceLabel} · {trace.inputSummary}</Text>
          </View>
          <Text style={styles.detailMeta}>
            Coverage {Math.round(pattern.dataCoverage * 100)}% ·{' '}
            {pattern.source === 'demo'
              ? 'Synthetic demo'
              : pattern.source === 'cgm'
                ? 'CGM-backed'
                : pattern.source === 'self_report'
                  ? 'Your local check-in'
                : 'Programme default'}
          </Text>
          {pattern.evidence.map((e, i) => (
            <Text key={i} style={styles.evidenceItem}>
              {e.label}: {e.detail}
            </Text>
          ))}
          <Text style={styles.whyExperiment}>{pattern.whyThisExperiment}</Text>
          <Text style={styles.safety}>{trace.safetyBoundary}</Text>
        </View>
      ) : null}

      {!missionChoice && !done && !deferred ? (
        <View style={styles.choiceSection}>
          <PressableScale onPress={onAccept} style={styles.acceptBtn} accessibilityRole="button">
            <Text style={styles.acceptText}>Do it now</Text>
          </PressableScale>
          <View style={styles.choiceRow}>
            <PressableScale onPress={onMakeEasier} style={styles.ghostBtn} accessibilityRole="button">
              <Text style={styles.ghostText}>Make it easier</Text>
            </PressableScale>
            {onLater ? (
              <PressableScale onPress={onLater} style={styles.ghostBtn} accessibilityRole="button">
                <Text style={styles.ghostText}>Later today</Text>
              </PressableScale>
            ) : null}
            <PressableScale onPress={onNotPractical} style={styles.textBtn} accessibilityRole="button">
              <Text style={styles.textBtnLabel}>Not practical today</Text>
            </PressableScale>
          </View>
        </View>
      ) : (
        <Text style={styles.choiceAck}>
          {done
            ? 'Complete in real life'
            : deferred
              ? 'Saved for later today'
              : practiced
                ? 'Rehearsed — mark when done in life'
                : missionChoice === 'easier'
                  ? 'Easier variant accepted'
                  : missionChoice === 'not_practical'
                    ? 'Flagged — coach will adapt'
                    : 'Mission accepted'}
        </Text>
      )}

      {canLogRealWorldAction ? (
        <View style={styles.realWorldActions}>
          {onMarkDone ? (
            <PressableScale onPress={onMarkDone} style={styles.doneBtn} accessibilityRole="button">
              <Text style={styles.acceptText}>I did it in real life</Text>
            </PressableScale>
          ) : null}
          {!deferred && onLater ? (
            <PressableScale onPress={onLater} style={styles.laterBtn} accessibilityRole="button">
              <Text style={styles.laterText}>Later today</Text>
            </PressableScale>
          ) : null}
        </View>
      ) : null}

      {outcome ? (
        <View style={styles.outcomeBlock}>
          <Text style={styles.eyebrow}>Measured response</Text>
          <Text style={styles.outcomeRate}>
            Mission completion · {outcome.completedDays}/{outcome.assignedDays}
          </Text>
          <Text style={styles.outcomeNote}>{outcome.associatedNote}</Text>
          {reflection ? (
            <Text style={styles.reflection}>“{reflection}”</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.mist,
    borderRadius: 2,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  demoBanner: {
    backgroundColor: P.warnSoft,
    borderWidth: 1,
    borderColor: P.warn,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    borderRadius: 2,
  },
  demoText: {
    fontFamily: FONTS.bodyMedium,
    color: P.warn,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  waitBanner: {
    borderWidth: 1,
    borderColor: P.warn,
    backgroundColor: P.warnSoft,
    borderRadius: 2,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  waitTitle: {
    fontFamily: FONTS.bodyBold,
    color: P.warn,
    fontSize: 13,
  },
  waitBody: {
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  practiceCue: {
    borderLeftWidth: 2,
    borderLeftColor: P.cool,
    marginTop: 14,
    paddingLeft: 10,
  },
  practiceCueLabel: {
    color: P.cool,
    fontFamily: FONTS.bodyMedium,
    fontSize: 9,
    letterSpacing: 1.05,
  },
  practiceCueText: {
    color: P.textSoft,
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  practiceCueDetail: {
    color: P.textSoft,
    fontFamily: FONTS.body,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardHeaderEyebrow: {
    marginBottom: 0,
  },
  eyebrow: {
    fontFamily: FONTS.bodyMedium,
    color: P.accent,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  missionAction: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  patternOneLiner: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  trace: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: P.line,
    gap: 3,
  },
  traceLabel: {
    fontFamily: FONTS.bodyMedium,
    color: P.cool,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  traceLine: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  traceMeta: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },
  linkBtn: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 4,
  },
  adaptation: {
    marginTop: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: P.cool,
  },
  adaptationLabel: {
    fontFamily: FONTS.bodyBold,
    color: P.cool,
    fontSize: 12,
  },
  adaptationBody: {
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  linkText: {
    fontFamily: FONTS.bodyMedium,
    color: P.cool,
    fontSize: 13,
  },
  details: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: P.line,
    gap: 6,
  },
  detailBody: {
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 13,
    lineHeight: 20,
  },
  detailMeta: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 11,
    marginBottom: 4,
  },
  evidenceItem: {
    fontFamily: FONTS.body,
    color: P.text,
    fontSize: 12,
    lineHeight: 18,
  },
  whyExperiment: {
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  safety: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },
  choiceSection: {
    marginTop: 16,
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  acceptBtn: {
    backgroundColor: P.accent,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 2,
    alignItems: 'center',
  },
  acceptText: {
    fontFamily: FONTS.bodyBold,
    color: P.ink,
    fontSize: 13,
  },
  ghostBtn: {
    borderWidth: 1,
    borderColor: P.line,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 2,
  },
  textBtn: {
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  textBtnLabel: {
    fontFamily: FONTS.bodyMedium,
    color: P.textMuted,
    fontSize: 12,
  },
  ghostText: {
    fontFamily: FONTS.bodyMedium,
    color: P.textSoft,
    fontSize: 12,
  },
  choiceAck: {
    fontFamily: FONTS.bodyMedium,
    color: P.accent,
    fontSize: 13,
    marginTop: 12,
  },
  realWorldActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  doneBtn: {
    flex: 1,
    backgroundColor: P.cool,
    paddingVertical: 12,
    borderRadius: 2,
    alignItems: 'center',
  },
  laterBtn: {
    borderWidth: 1,
    borderColor: P.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 2,
    justifyContent: 'center',
  },
  laterText: {
    fontFamily: FONTS.bodyMedium,
    color: P.textSoft,
    fontSize: 12,
  },
  outcomeBlock: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: P.line,
  },
  outcomeRate: {
    fontFamily: FONTS.bodyBold,
    color: P.text,
    fontSize: 14,
    marginBottom: 8,
  },
  outcomeNote: {
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 14,
    lineHeight: 21,
  },
  reflection: {
    fontFamily: FONTS.body,
    color: P.text,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
    fontStyle: 'italic',
  },
});
