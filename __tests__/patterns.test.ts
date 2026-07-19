import {
  buildSelfReportedPattern,
  detectPatternFromReadings,
  resolvePattern,
  SELF_REPORTED_MOMENTS,
} from '@/domain/patterns';
import {
  AMINA_DEMO,
  getAminaDay,
  buildAminaClinicianDigest,
  aminaLoopSteps,
} from '@/domain/demo';
import { buildLocalDigest } from '@/domain/digest/types';
import { emptyAdherenceWeek , selectMission } from '@/domain/programme';
import {
  buildAgentDecisionTrace,
  buildMissionAdaptation,
  buildMissionMediaBrief,
  buildPersonalisedWorldState,
  buildMiraPresence,
  worldSceneLabel,
} from '@/domain/agent';

describe('patterns domain', () => {
  it('returns Amina evening pattern in demo mode', () => {
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
    const day = getAminaDay(2);
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
    expect(media).toEqual({ templateId: 'post_meal_walk', visualIntent: 'movement', scene: undefined });
  });

  it('uses an approved smaller variant when a patient asks for an easier mission', () => {
    expect(buildMissionAdaptation('post_meal_walk', 'easier')).toEqual({
      label: 'Adjusted for you',
      action: 'Walk for 5 minutes after your next meal.',
    });
    expect(buildMissionAdaptation('post_meal_walk', 'later').label).toBe('Adjusted for your day');
  });

  it('gives Mira a truthful, bounded posture for the current mission state', () => {
    const pattern = resolvePattern({ useDemo: true, demoDayIndex: 10 });
    // 2nd-person voice per the network contract (famile/web/docs/MIRA.md).
    expect(buildMiraPresence(pattern, 'unselected', false).label).toBe('I noticed a pattern');
    expect(buildMiraPresence(pattern, 'accepted', true).label).toBe('Adjusted for you');
    expect(buildMiraPresence(pattern, 'deferred', false).label).toBe('Holding this for you');
    expect(buildMiraPresence(pattern, 'completed', false).label).toBe('Logged');
    // Posture vocabulary aligns with the network contract.
    expect(buildMiraPresence(pattern, 'unselected', false).posture).toBe('offering');
    expect(buildMiraPresence(pattern, 'accepted', false).posture).toBe('watching');
    expect(buildMiraPresence(pattern, 'accepted', true).posture).toBe('adapting');
    expect(buildMiraPresence(pattern, 'deferred', false).posture).toBe('holding');
    expect(buildMiraPresence(pattern, 'completed', false).posture).toBe('completed');
    // Morph params are projected from the contract.
    expect(buildMiraPresence(pattern, 'unselected', false).morph.bloom).toBeGreaterThan(0.4);
  });

  it('builds a bounded world state that changes presentation without retaining readings', () => {
    const pattern = resolvePattern({ useDemo: true, demoDayIndex: 10 });
    const mission = selectMission({ userMode: 'personal', forceTemplateId: 'post_meal_walk' });
    const world = buildPersonalisedWorldState(pattern, mission, 'easier');
    const media = buildMissionMediaBrief(pattern, mission, world);

    expect(world).toMatchObject({
      missionId: mission.id,
      scene: 'after_meal_path',
      tone: 'gentle',
      practiceIntensity: 'unhurried',
    });
    expect(worldSceneLabel(world.scene)).toBe('After-meal path');
    expect(media.scene).toBe('after_meal_path');
    expect(JSON.stringify(world)).not.toContain('mg/dL');
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

describe('Amina demo fixture', () => {
  it('exposes a stable 14-day timeline', () => {
    expect(AMINA_DEMO.totalDays).toBe(14);
    const early = getAminaDay(1);
    const late = getAminaDay(10);
    expect(early.outcome).toBeNull();
    expect(late.outcome).not.toBeNull();
    expect(late.outcome?.associatedNote.toLowerCase()).toContain('associated');
    expect(late.outcome?.associatedNote.toLowerCase()).not.toContain('caused');
  });

  it('builds clinician digest with outreach fields', () => {
    const digest = buildAminaClinicianDigest(10);
    expect(digest.mode).toBe('clinician');
    expect(digest.outreachRecommended).toBe(false);
    expect(digest.experimentsTried?.length).toBeGreaterThan(0);
    expect(digest.patientLabel).toContain('synthetic');
  });

  it('escalates outreach on late demo days', () => {
    const digest = buildAminaClinicianDigest(12);
    expect(digest.outreachRecommended).toBe(true);
    expect(digest.safetyFlags?.length).toBeGreaterThan(0);
    expect(digest.outreachReason?.toLowerCase()).toContain('escalat');
  });

  it('advances loop phases across days', () => {
    const steps = aminaLoopSteps(10);
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
