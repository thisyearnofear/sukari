import { GAME_TIERS, getTierConfig, GameTier } from '../constants/gameTiers';

describe('Game Tiers', () => {
  const tiers: GameTier[] = ['tier1', 'tier2', 'tier3', 'slowmo', 'weekly'];

  it('all tiers should be defined', () => {
    tiers.forEach(tier => {
      expect(GAME_TIERS[tier]).toBeDefined();
    });
  });

  it('getTierConfig returns correct config', () => {
    expect(getTierConfig('tier1').name).toBe('Warm-up');
    expect(getTierConfig('tier2').name).toBe('Day in the field');
  });

  it('tier durations should increase progressively (excluding slowmo)', () => {
    const battleTiers = ['tier1', 'tier2', 'tier3'] as const;
    for (let i = 1; i < battleTiers.length; i++) {
      expect(GAME_TIERS[battleTiers[i]].duration).toBeGreaterThan(GAME_TIERS[battleTiers[i - 1]].duration);
    }
  });

  it('tier1 should be tutorial mode', () => {
    expect(GAME_TIERS.tier1.tutorialMode).toBe(true);
    expect(GAME_TIERS.tier1.gameMode).toBe('classic');
  });

  it('tier1 should only have 2 swipe directions', () => {
    expect(GAME_TIERS.tier1.swipeDirections).toHaveLength(2);
  });

  it('tier2+ should have 4 swipe directions', () => {
    expect(GAME_TIERS.tier2.swipeDirections).toHaveLength(4);
    expect(GAME_TIERS.tier3.swipeDirections).toHaveLength(4);
  });

  it('maxConcurrentFoods should increase with tier', () => {
    expect(GAME_TIERS.tier2.maxConcurrentFoods).toBeGreaterThan(GAME_TIERS.tier1.maxConcurrentFoods);
    expect(GAME_TIERS.tier3.maxConcurrentFoods).toBeGreaterThan(GAME_TIERS.tier2.maxConcurrentFoods);
  });

  it('slowmo should have no time limit', () => {
    expect(GAME_TIERS.slowmo.duration).toBe(0);
    expect(GAME_TIERS.slowmo.educationalFocus).toBe(true);
  });
});
