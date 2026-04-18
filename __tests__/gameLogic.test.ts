import { getStabilityZone, clampStability, calculateFinalScore } from '../utils/gameLogic';

describe('getStabilityZone', () => {
  it('returns balanced for values in default range', () => {
    expect(getStabilityZone(50)).toBe('balanced');
    expect(getStabilityZone(40)).toBe('balanced');
    expect(getStabilityZone(60)).toBe('balanced');
  });

  it('returns warning zones', () => {
    expect(getStabilityZone(30)).toBe('warning-low');
    expect(getStabilityZone(70)).toBe('warning-high');
  });

  it('returns critical zones', () => {
    expect(getStabilityZone(10)).toBe('critical-low');
    expect(getStabilityZone(0)).toBe('critical-low');
    expect(getStabilityZone(90)).toBe('critical-high');
    expect(getStabilityZone(100)).toBe('critical-high');
  });

  it('respects custom balanced range for challenges', () => {
    const narrow = { min: 45, max: 55 };
    expect(getStabilityZone(50, narrow)).toBe('balanced');
    expect(getStabilityZone(42, narrow)).toBe('warning-low');
    expect(getStabilityZone(58, narrow)).toBe('warning-high');
  });

  it('handles boundary values correctly', () => {
    expect(getStabilityZone(24)).toBe('critical-low');
    expect(getStabilityZone(25)).toBe('warning-low');
    expect(getStabilityZone(39)).toBe('warning-low');
    expect(getStabilityZone(75)).toBe('warning-high');
    expect(getStabilityZone(76)).toBe('critical-high');
  });
});

describe('clampStability', () => {
  it('clamps to 0-100 range', () => {
    expect(clampStability(-10)).toBe(0);
    expect(clampStability(150)).toBe(100);
    expect(clampStability(50)).toBe(50);
  });
});

describe('calculateFinalScore', () => {
  it('returns higher grade for balanced stability', () => {
    const balanced = calculateFinalScore(300, 50, 30, 20, 5);
    const unbalanced = calculateFinalScore(300, 80, 30, 20, 5);
    expect(balanced.score).toBeGreaterThan(unbalanced.score);
  });

  it('scales grade thresholds by tier duration', () => {
    // Tier1 (30s) — S grade should be achievable
    const tier1 = calculateFinalScore(200, 50, 25, 18, 2, 30);
    // With 30s tier, threshold scales to 500*(30/90) = ~167
    // 200 points with good accuracy should get S
    expect(tier1.grade).toBe('S');
  });

  it('uses 90s baseline when no duration provided', () => {
    const result = calculateFinalScore(100, 50, 20, 10, 5);
    expect(result.grade).not.toBe('S'); // 100 points not enough for S at 90s scale
  });

  it('factors accuracy into grade', () => {
    const highAcc = calculateFinalScore(400, 50, 30, 19, 1, 90);
    const lowAcc = calculateFinalScore(400, 50, 30, 10, 10, 90);
    expect(highAcc.grade).not.toBe(lowAcc.grade);
  });

  it('returns D for very low scores', () => {
    const result = calculateFinalScore(10, 80, 5, 2, 8);
    expect(result.grade).toBe('D');
  });
});
