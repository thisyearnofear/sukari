/**
 * Seeded Random Number Generator
 * 
 * Implements a simple LCG (Linear Congruential Generator) or similar
 * to provide reproducible random sequences based on a seed.
 * 
 * ✅ Align with PERFORMANT and DRY principles.
 */

export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    // Basic LCG parameters (Mersenne Twister would be better but LCG is lighter for mobile)
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  /**
   * Returns a pseudo-random number between 0 and 1 (exclusive)
   */
  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  /**
   * Returns a pseudo-random integer between min (inclusive) and max (exclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min) + min);
  }

  /**
   * Returns a boolean with a given probability
   */
  nextBool(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  /**
   * Selects a random item from an array
   */
  nextItem<T>(array: T[]): T {
    return array[this.nextInt(0, array.length)];
  }
}

/**
 * Returns a seed based on the current week number.
 * Useful for "Weekly Challenges" that are the same for everyone.
 */
export const getWeeklySeed = (): number => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - startOfYear.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const weekNum = Math.floor(diff / oneWeek);
  
  // Combine year and week for a unique annual/weekly seed
  return now.getFullYear() * 100 + weekNum;
};
