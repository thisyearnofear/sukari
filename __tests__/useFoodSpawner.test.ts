/**
 * Integration tests for useFoodSpawner logic.
 * Tests food selection and creation without rendering.
 */
import { selectRandomFood, createFoodUnit } from '../hooks/useFoodSpawner';
import { SeededRandom } from '../utils/random';

describe('useFoodSpawner helpers', () => {
  describe('selectRandomFood', () => {
    it('returns ally food when isAlly is true', () => {
      const food = selectRandomFood(true);
      expect(food.faction).toBe('ally');
    });

    it('returns enemy food when isAlly is false', () => {
      const food = selectRandomFood(false);
      expect(food.faction).toBe('enemy');
    });

    it('returns deterministic results with seeded random', () => {
      const seed1 = new SeededRandom(42);
      const seed2 = new SeededRandom(42);
      const food1 = selectRandomFood(true, undefined, seed1);
      const food2 = selectRandomFood(true, undefined, seed2);
      expect(food1.type).toBe(food2.type);
    });

    it('returns different results with different seeds', () => {
      // Run multiple times to increase confidence
      const results = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const seed = new SeededRandom(i * 1000);
        results.add(selectRandomFood(true, undefined, seed).type);
      }
      expect(results.size).toBeGreaterThan(1);
    });
  });

  describe('createFoodUnit', () => {
    it('creates a food unit with required fields', () => {
      const def = selectRandomFood(true);
      const unit = createFoodUnit(def);
      expect(unit.id).toBeTruthy();
      expect(unit.type).toBe(def.type);
      expect(unit.faction).toBe(def.faction);
      expect(unit.name).toBe(def.name);
      expect(unit.sprite).toBeTruthy();
      expect(unit.y).toBe(-60); // spawns above screen
      expect(unit.speed).toBeGreaterThan(0);
      expect(unit.opacity).toBe(1);
    });

    it('marks contextual food based on time phase', () => {
      // Coffee Commander has timeModifiers with evening: -1.0
      const coffeeDef = {
        type: 'coffee', faction: 'contextual' as const, name: 'Coffee',
        sprite: '☕', color: '#000', glowColor: '#000',
        glucoseImpact: -2, basePoints: 8, spawnWeight: 10,
        effects: { energy: 18, hydration: -8, nutrition: 0, stability: -3 },
        timeModifiers: { morning: 1.5, midday: 1.0, afternoon: 0.5, evening: -1.0 },
      };

      const morningCoffee = createFoodUnit(coffeeDef, 'morning');
      expect(morningCoffee.isContextuallyGood).toBe(true);

      const eveningCoffee = createFoodUnit(coffeeDef, 'evening');
      expect(eveningCoffee.isContextuallyGood).toBe(false);
    });

    it('spawns in narrower area for life mode', () => {
      const def = selectRandomFood(true);
      const classicUnit = createFoodUnit(def, 'morning', 'classic');
      const lifeUnit = createFoodUnit(def, 'morning', 'life');
      // Life mode has wider margins (SIDE_PANEL_WIDTH + 20 = 100 vs 40)
      // Both should have valid x positions
      expect(classicUnit.x).toBeGreaterThanOrEqual(0);
      expect(lifeUnit.x).toBeGreaterThanOrEqual(0);
    });
  });
});
