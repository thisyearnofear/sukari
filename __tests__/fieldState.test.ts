import { fieldStateFromPattern, resolvePattern } from '@/domain/patterns';

describe('fieldStateFromPattern', () => {
  it('maps excursion patterns to a stressed field scaled by coverage', () => {
    const pattern = resolvePattern({ useDemo: true, demoDayIndex: 10 });
    expect(pattern.kind).toBe('evening_excursion');
    const state = fieldStateFromPattern(pattern);
    expect(state.band).toBe('high');
    expect(state.intensity).toBeGreaterThan(0.5);
    expect(state.intensity).toBeLessThanOrEqual(0.85);
  });

  it('settles the field when the mission is completed in real life', () => {
    const pattern = resolvePattern({ useDemo: true, demoDayIndex: 10 });
    const state = fieldStateFromPattern(pattern, { missionCompleted: true });
    expect(state).toEqual({ band: 'in_range', intensity: 0.4 });
  });

  it('keeps the field calm and unknown when data is insufficient', () => {
    const pattern = resolvePattern({ snapshot: null, useDemo: false });
    expect(pattern.kind).toBe('insufficient_data');
    const state = fieldStateFromPattern(pattern);
    expect(state.band).toBe('unknown');
    expect(state.intensity).toBeLessThanOrEqual(0.4);
  });

  it('handles a missing pattern gracefully', () => {
    const state = fieldStateFromPattern(null);
    expect(state.band).toBe('unknown');
    expect(state.intensity).toBeLessThanOrEqual(0.4);
  });

  it('deferred missions add gentle urgency without changing band or alarming', () => {
    const pattern = resolvePattern({ useDemo: true, demoDayIndex: 10 });
    const base = fieldStateFromPattern(pattern);
    const deferred = fieldStateFromPattern(pattern, { deferred: true });
    expect(deferred.band).toBe(base.band);
    expect(deferred.intensity).toBeGreaterThan(base.intensity);
    expect(deferred.intensity).toBeLessThanOrEqual(0.85);
  });

  it('never alarms after completion, even when deferred', () => {
    const pattern = resolvePattern({ useDemo: true, demoDayIndex: 10 });
    const state = fieldStateFromPattern(pattern, { missionCompleted: true, deferred: true });
    expect(state).toEqual({ band: 'in_range', intensity: 0.4 });
  });
});
