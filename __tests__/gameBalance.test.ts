import { ALLY_FOODS, ENEMY_FOODS, STABILITY_ZONES, COMBO_TIERS } from '../constants/gameConfig';

describe('Game Balance', () => {
  describe('Stability impact asymmetry', () => {
    it('enemy stability penalty should not exceed 2.5x the best ally gain', () => {
      const maxAllyGain = Math.max(...ALLY_FOODS.map(f => f.effects?.stability ?? 0));
      const maxEnemyPenalty = Math.max(...ENEMY_FOODS.map(f => Math.abs(f.effects?.stability ?? 0)));
      expect(maxEnemyPenalty).toBeLessThanOrEqual(maxAllyGain * 2.5);
    });

    it('all allies should have positive stability effects', () => {
      const nonContextual = ALLY_FOODS.filter(f => f.faction !== 'contextual');
      nonContextual.forEach(food => {
        expect(food.effects?.stability).toBeGreaterThanOrEqual(0);
      });
    });

    it('all enemies should have negative stability effects', () => {
      ENEMY_FOODS.forEach(food => {
        expect(food.effects?.stability).toBeLessThan(0);
      });
    });
  });

  describe('Stability zones', () => {
    it('zones should cover full 0-100 range without gaps', () => {
      expect(STABILITY_ZONES.CRITICAL_LOW.min).toBe(0);
      expect(STABILITY_ZONES.CRITICAL_HIGH.max).toBe(100);
      expect(STABILITY_ZONES.CRITICAL_LOW.max + 1).toBe(STABILITY_ZONES.WARNING_LOW.min);
      expect(STABILITY_ZONES.WARNING_LOW.max + 1).toBe(STABILITY_ZONES.BALANCED.min);
      expect(STABILITY_ZONES.BALANCED.max + 1).toBe(STABILITY_ZONES.WARNING_HIGH.min);
      expect(STABILITY_ZONES.WARNING_HIGH.max + 1).toBe(STABILITY_ZONES.CRITICAL_HIGH.min);
    });
  });

  describe('Combo tiers', () => {
    it('should be sorted by ascending count', () => {
      for (let i = 1; i < COMBO_TIERS.length; i++) {
        expect(COMBO_TIERS[i].count).toBeGreaterThan(COMBO_TIERS[i - 1].count);
      }
    });

    it('multipliers should increase with tier', () => {
      for (let i = 1; i < COMBO_TIERS.length; i++) {
        expect(COMBO_TIERS[i].multiplier).toBeGreaterThan(COMBO_TIERS[i - 1].multiplier);
      }
    });
  });

  describe('Food data integrity', () => {
    it('all foods should have required fields', () => {
      [...ALLY_FOODS, ...ENEMY_FOODS].forEach(food => {
        expect(food.name).toBeTruthy();
        expect(food.sprite).toBeTruthy();
        expect(food.type).toBeTruthy();
        expect(food.faction).toBeTruthy();
        expect(typeof food.basePoints).toBe('number');
        expect(typeof food.spawnWeight).toBe('number');
      });
    });

    it('spawn weights should be positive', () => {
      [...ALLY_FOODS, ...ENEMY_FOODS].forEach(food => {
        expect(food.spawnWeight).toBeGreaterThan(0);
      });
    });
  });
});
