/**
 * Integration tests for useGameTimer logic.
 * Tests the timer's state transitions without rendering React components.
 */
import { getTimePhase, getMorningConditionConfig, getRandomAnnouncement } from '../hooks/useGameTimer';

describe('useGameTimer helpers', () => {
  describe('getTimePhase', () => {
    it('returns morning for high timer values', () => {
      expect(getTimePhase(60)).toBe('morning');
      expect(getTimePhase(46)).toBe('morning');
    });

    it('returns midday for mid-range timer', () => {
      expect(getTimePhase(45)).toBe('midday');
      expect(getTimePhase(31)).toBe('midday');
    });

    it('returns afternoon for lower timer', () => {
      expect(getTimePhase(30)).toBe('afternoon');
      expect(getTimePhase(16)).toBe('afternoon');
    });

    it('returns evening for final phase', () => {
      expect(getTimePhase(15)).toBe('evening');
      expect(getTimePhase(1)).toBe('evening');
      expect(getTimePhase(0)).toBe('evening');
    });
  });

  describe('getMorningConditionConfig', () => {
    it('returns config for valid conditions', () => {
      const config = getMorningConditionConfig('well_rested');
      expect(config).toBeDefined();
      expect(config.id).toBe('well_rested');
    });

    it('falls back to normal_day for unknown conditions', () => {
      const config = getMorningConditionConfig('nonexistent' as any);
      expect(config.id).toBe('normal_day');
    });

    it('all conditions have required fields', () => {
      const conditions = ['well_rested', 'poor_sleep', 'sick_day', 'marathon_day', 'stressed', 'recovery_day', 'normal_day'] as const;
      conditions.forEach(c => {
        const config = getMorningConditionConfig(c);
        expect(config.id).toBe(c);
        expect(config.name).toBeTruthy();
        expect(config.icon).toBeTruthy();
        expect(config.needsMultipliers).toBeDefined();
        expect(config.metricModifiers).toBeDefined();
      });
    });
  });

  describe('getRandomAnnouncement', () => {
    it('returns a string for valid categories', () => {
      const result = getRandomAnnouncement('GAME_START');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('returns empty string for invalid categories', () => {
      const result = getRandomAnnouncement('NONEXISTENT' as any);
      expect(result).toBe('');
    });
  });
});
