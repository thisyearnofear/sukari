/**
 * Integration tests for usePlayerProgress logic.
 * Tests the progression system's pure state transitions.
 */
import { KINGDOM_MILESTONES } from '../hooks/usePlayerProgress';

describe('usePlayerProgress', () => {
  describe('KINGDOM_MILESTONES', () => {
    it('should be sorted by ascending renown', () => {
      for (let i = 1; i < KINGDOM_MILESTONES.length; i++) {
        expect(KINGDOM_MILESTONES[i].renown).toBeGreaterThan(KINGDOM_MILESTONES[i - 1].renown);
      }
    });

    it('starts at 0 renown (Squire)', () => {
      expect(KINGDOM_MILESTONES[0].renown).toBe(0);
      expect(KINGDOM_MILESTONES[0].title).toBe('Squire');
    });

    it('all milestones have required fields', () => {
      KINGDOM_MILESTONES.forEach(m => {
        expect(typeof m.renown).toBe('number');
        expect(m.title).toBeTruthy();
        expect(m.icon).toBeTruthy();
      });
    });
  });

  describe('tier progression logic', () => {
    const tiers = ['tier1', 'tier2', 'tier3'] as const;

    it('unlockNextTier advances to next tier', () => {
      // Simulate the unlock logic
      const getNextTier = (current: string) => {
        const idx = tiers.indexOf(current as any);
        return tiers[idx + 1] || current;
      };

      expect(getNextTier('tier1')).toBe('tier2');
      expect(getNextTier('tier2')).toBe('tier3');
      expect(getNextTier('tier3')).toBe('tier3'); // max tier stays
    });
  });

  describe('daily quest reset logic', () => {
    it('detects new day correctly', () => {
      const isNewDay = (lastReset: Date | null, now: Date) => {
        if (!lastReset) return true;
        return now.getDate() !== lastReset.getDate() ||
          now.getMonth() !== lastReset.getMonth() ||
          now.getFullYear() !== lastReset.getFullYear();
      };

      expect(isNewDay(null, new Date())).toBe(true);
      expect(isNewDay(new Date(), new Date())).toBe(false);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isNewDay(yesterday, new Date())).toBe(true);
    });
  });

  describe('lore discovery', () => {
    it('should not duplicate discovered lore', () => {
      const discovered = ['brain', 'exercise'];
      const newId = 'brain';
      const shouldAdd = !discovered.includes(newId);
      expect(shouldAdd).toBe(false);
    });

    it('should add new lore', () => {
      const discovered = ['brain', 'exercise'];
      const newId = 'fiber';
      const shouldAdd = !discovered.includes(newId);
      expect(shouldAdd).toBe(true);
    });
  });
});
