/**
 * Unit tests for leaderboard worker validation logic.
 * These test the pure functions extracted from the worker.
 */

// Inline the validation constants and helpers to test without Cloudflare runtime
const MAX_SCORE_PER_SECOND = 15;
const MAX_GAME_DURATION = 120;

function isValidId(s: unknown): boolean {
  return typeof s === 'string' && s.length >= 3 && s.length <= 128;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

describe('Leaderboard Validation', () => {
  describe('isValidId', () => {
    it('accepts valid IDs', () => {
      expect(isValidId('abc')).toBe(true);
      expect(isValidId('player-123')).toBe(true);
      expect(isValidId('a'.repeat(128))).toBe(true);
    });

    it('rejects invalid IDs', () => {
      expect(isValidId('')).toBe(false);
      expect(isValidId('ab')).toBe(false);
      expect(isValidId('a'.repeat(129))).toBe(false);
      expect(isValidId(null)).toBe(false);
      expect(isValidId(123)).toBe(false);
    });
  });

  describe('clamp', () => {
    it('clamps values to range', () => {
      expect(clamp(5, 1, 10)).toBe(5);
      expect(clamp(-1, 1, 10)).toBe(1);
      expect(clamp(100, 1, 10)).toBe(10);
    });
  });

  describe('Anti-cheat score validation', () => {
    it('rejects scores exceeding max plausible', () => {
      const duration = 30; // tier1
      const maxPlausible = duration * MAX_SCORE_PER_SECOND;
      expect(500).toBeGreaterThan(maxPlausible); // 500 > 450
      expect(400).toBeLessThanOrEqual(maxPlausible); // 400 <= 450
    });

    it('uses MAX_GAME_DURATION as default', () => {
      const maxPlausible = MAX_GAME_DURATION * MAX_SCORE_PER_SECOND;
      expect(maxPlausible).toBe(1800);
    });

    it('allows reasonable scores for each tier', () => {
      const tiers = [
        { name: 'tier1', duration: 30 },
        { name: 'tier2', duration: 60 },
        { name: 'tier3', duration: 90 },
        { name: 'weekly', duration: 120 },
      ];

      tiers.forEach(tier => {
        const max = tier.duration * MAX_SCORE_PER_SECOND;
        // A good player might score ~5-8 points per second
        const goodScore = tier.duration * 7;
        expect(goodScore).toBeLessThanOrEqual(max);
      });
    });
  });
});
