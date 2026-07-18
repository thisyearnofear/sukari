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

const P = COLORS.PROGRAMME;

export type MissionEase = 'accept' | 'easier' | 'another' | 'not_practical';

interface PatternMissionCardProps {
  pattern: MetabolicPattern;
  mission: ProgrammeMission | null;
  outcome?: ExperimentOutcome | null;
  reflection?: string | null;
  demoLabel?: string | null;
  onAccept?: () => void;
  onMakeEasier?: () => void;
  onChooseAnother?: () => void;
  onNotPractical?: () => void;
  onWhy?: () => void;
  onMarkDone?: () => void;
  missionChoice?: MissionEase | null;
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
  onChooseAnother,
  onNotPractical,
  onWhy,
  onMarkDone,
  missionChoice,
  deferred = false,
}: PatternMissionCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const done = mission?.status === 'completed';
  const practiced = mission?.status === 'practiced' || done;

  const experimentText =
    missionChoice === 'easier'
      ? 'Take a 5-minute walk within 30 minutes after dinner (easier variant).'
      : mission?.realWorldAction || pattern.suggestedExperiment;

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
            Rehearsal is done. Mark the habit when you’ve finished it in real life — no penalty for
            waiting.
          </Text>
        </View>
      ) : null}

      <View style={styles.cardHeader}>
        <Text style={[styles.eyebrow, styles.cardHeaderEyebrow]}>Tonight’s mission</Text>
        <AgencyLaneTag lane="always" />
      </View>
      <Text style={styles.missionAction}>{experimentText}</Text>
      <Text style={styles.patternOneLiner} numberOfLines={showDetails ? 4 : 2}>
        {pattern.headline}
      </Text>

      <PressableScale
        onPress={() => {
          setShowDetails((v) => !v);
          onWhy?.();
        }}
        accessibilityRole="button"
        accessibilityLabel="Toggle pattern details"
        style={styles.linkBtn}
      >
        <Text style={styles.linkText}>{showDetails ? 'Hide details' : 'Why this?'}</Text>
      </PressableScale>

      {showDetails ? (
        <View style={styles.details}>
          <Text style={styles.detailBody}>{pattern.explanation}</Text>
          <Text style={styles.detailMeta}>
            Coverage {Math.round(pattern.dataCoverage * 100)}% ·{' '}
            {pattern.source === 'demo'
              ? 'Synthetic demo'
              : pattern.source === 'cgm'
                ? 'CGM-backed'
                : 'Programme default'}
          </Text>
          {pattern.evidence.map((e, i) => (
            <Text key={i} style={styles.evidenceItem}>
              {e.label}: {e.detail}
            </Text>
          ))}
          <Text style={styles.whyExperiment}>{pattern.whyThisExperiment}</Text>
          <Text style={styles.safety}>{pattern.safetyBoundary}</Text>
        </View>
      ) : null}

      {!missionChoice && !done && !deferred ? (
        <View style={styles.choiceRow}>
          <PressableScale onPress={onAccept} style={styles.acceptBtn} accessibilityRole="button">
            <Text style={styles.acceptText}>Accept</Text>
          </PressableScale>
          <PressableScale onPress={onMakeEasier} style={styles.ghostBtn} accessibilityRole="button">
            <Text style={styles.ghostText}>Easier</Text>
          </PressableScale>
          <PressableScale onPress={onChooseAnother} style={styles.ghostBtn} accessibilityRole="button">
            <Text style={styles.ghostText}>Another</Text>
          </PressableScale>
          <PressableScale onPress={onNotPractical} style={styles.ghostBtn} accessibilityRole="button">
            <Text style={styles.ghostText}>Not now</Text>
          </PressableScale>
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
                  : missionChoice === 'another'
                    ? 'Alternate mission selected'
                    : missionChoice === 'not_practical'
                      ? 'Flagged — coach will adapt'
                      : 'Mission accepted'}
        </Text>
      )}

      {(practiced || deferred) && !done && onMarkDone ? (
        <PressableScale onPress={onMarkDone} style={styles.doneBtn} accessibilityRole="button">
          <Text style={styles.acceptText}>I did it in real life</Text>
        </PressableScale>
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
    marginBottom: 8,
  },
  patternOneLiner: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  linkBtn: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 4,
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
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  acceptBtn: {
    backgroundColor: P.accent,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 2,
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
  doneBtn: {
    marginTop: 14,
    backgroundColor: P.cool,
    paddingVertical: 12,
    borderRadius: 2,
    alignItems: 'center',
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
