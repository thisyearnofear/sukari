import {
  buildSelfReportedPattern,
  detectPatternFromReadings,
  resolvePattern,
  SELF_REPORTED_MOMENTS,
} from '@/domain/patterns';
import {
  MAYA_DEMO,
  getMayaDay,
  buildMayaClinicianDigest,
  mayaLoopSteps,
} from '@/domain/demo';
import { buildLocalDigest } from '@/domain/digest/types';
import { emptyAdherenceWeek } from '@/domain/programme';
import { buildAgentDecisionTrace, buildMissionAdaptation, buildMissionMediaBrief } from '@/domain/agent';

describe('patterns domain', () => {
  it('returns Maya evening pattern in demo mode', () => {
    const pattern = resolvePattern({ useDemo: true, demoDayIndex: 10 });
    expect(pattern.source).toBe('demo');
    expect(pattern.kind).toBe('evening_excursion');
    expect(pattern.suggestedBehaviour).toBe('post_meal_walk');
    expect(pattern.safetyBoundary.toLowerCase()).toContain('never insulin');
  });

  it('falls back to programme default without CGM', () => {
    const pattern = resolvePattern({ snapshot: null, useDemo: false });
    expect(pattern.source).toBe('rules');
    expect(pattern.kind).toBe('insufficient_data');
  });

  it('detects evening excursion from synthetic readings', () => {
    const day = getMayaDay(2);
    const pattern = detectPatternFromReadings(day.readings);
    expect(pattern).not.toBeNull();
    expect(pattern?.kind).toBe('evening_excursion');
  });

  it('creates an explainable bounded decision trace and non-sensitive media brief', () => {
    const pattern = resolvePattern({ useDemo: true, demoDayIndex: 10 });
    const trace = buildAgentDecisionTrace(pattern, null, 'unselected');
    const media = buildMissionMediaBrief(pattern, null);

    expect(trace.observed).toBeTruthy();
    expect(trace.proposed).toContain('walk');
    expect(trace.safetyBoundary.toLowerCase()).toContain('never insulin');
    expect(media).toEqual({ templateId: 'post_meal_walk', visualIntent: 'movement' });
  });

  it('uses an approved smaller variant when a patient asks for an easier mission', () => {
    expect(buildMissionAdaptation('post_meal_walk', 'easier')).toEqual({
      label: 'Adjusted for you',
      action: 'Walk for 5 minutes after your next meal.',
    });
    expect(buildMissionAdaptation('post_meal_walk', 'later').label).toBe('Adjusted for your day');
  });

  it('turns a local check-in into transparent, bounded mission evidence', () => {
    const moment = SELF_REPORTED_MOMENTS.find((item) => item.id === 'dinner_hard')!;
    const pattern = buildSelfReportedPattern(moment);
    const trace = buildAgentDecisionTrace(pattern, null, 'unselected');

    expect(pattern.source).toBe('self_report');
    expect(pattern.suggestedBehaviour).toBe('post_meal_walk');
    expect(pattern.explanation).toContain('not an inference');
    expect(trace.inputSummary).toBe('Patient-selected local check-in');
  });
});

describe('Maya demo fixture', () => {
  it('exposes a stable 14-day timeline', () => {
    expect(MAYA_DEMO.totalDays).toBe(14);
    const early = getMayaDay(1);
    const late = getMayaDay(10);
    expect(early.outcome).toBeNull();
    expect(late.outcome).not.toBeNull();
    expect(late.outcome?.associatedNote.toLowerCase()).toContain('associated');
    expect(late.outcome?.associatedNote.toLowerCase()).not.toContain('caused');
  });

  it('builds clinician digest with outreach fields', () => {
    const digest = buildMayaClinicianDigest(10);
    expect(digest.mode).toBe('clinician');
    expect(digest.outreachRecommended).toBe(false);
    expect(digest.experimentsTried?.length).toBeGreaterThan(0);
    expect(digest.patientLabel).toContain('synthetic');
  });

  it('escalates outreach on late demo days', () => {
    const digest = buildMayaClinicianDigest(12);
    expect(digest.outreachRecommended).toBe(true);
    expect(digest.safetyFlags?.length).toBeGreaterThan(0);
    expect(digest.outreachReason?.toLowerCase()).toContain('escalat');
  });

  it('advances loop phases across days', () => {
    const steps = mayaLoopSteps(10);
    const active = steps.find((s) => s.active);
    expect(active?.key).toBe('adapt');
  });
});

describe('clinician digest builder', () => {
  it('includes exception-oriented fields', () => {
    const digest = buildLocalDigest({
      adherence: { ...emptyAdherenceWeek(), assigned: 5, completed: 1, relapses: 2 },
      missionHistory: [],
      gamesPlayedThisWeekApprox: 3,
      patientLabel: 'Test member',
      recurringPatterns: ['Evening elevation'],
    });
    expect(digest.mode).toBe('clinician');
    expect(digest.outreachRecommended).toBe(true);
    expect(digest.dataCoverage).toBeTruthy();
    expect(digest.wins[0]).not.toMatch(/Realm/i);
  });
});
