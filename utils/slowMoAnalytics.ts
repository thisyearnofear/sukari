/**
 * Slow Mo Mode Analytics - Pattern recognition & personalized insights
 * Analyzes player behavior across sessions to identify trends and provide recommendations
 */

import { SlowMoModeSession } from '@/hooks/usePlayerProgress';
import { Meal } from '@/constants/mealDatabase';

export interface MealFrequency {
  id: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  count: number;
  totalGlucoseImpact: number;
  averageImpact: number;
  healthLevel: 'healthy' | 'moderate' | 'unhealthy';
}

export interface MealTypeStats {
  mealType: 'breakfast' | 'lunch' | 'dinner';
  totalSessions: number;
  averageGlucoseImpact: number;
  healthyMealRate: number; // percentage
  mostCommonMeal: MealFrequency | null;
  lowestImpactMeal: MealFrequency | null;
}

export interface PlayerAnalytics {
  totalSessions: number;
  averageAdherence: number; // 0-100
  completionRate: number; // sessions with actual meals / total sessions
  favoriteBreakfast: MealFrequency | null;
  favoriteLunch: MealFrequency | null;
  favoriteDinner: MealFrequency | null;
  breakfastStats: MealTypeStats;
  lunchStats: MealTypeStats;
  dinnerStats: MealTypeStats;
  overallHealthyMealRate: number; // percentage
  averageDailyGlucoseImpact: number; // sum of all 3 meals average
  streak: {
    current: number; // consecutive days with sessions
    best: number; // longest streak ever
  };
  recommendations: string[];
}

/**
 * Analyze all sessions and generate comprehensive analytics
 */
export function analyzePlayerSessions(
  sessions: SlowMoModeSession[],
  lastPlayedDates?: number[],
): PlayerAnalytics {
  if (!sessions || sessions.length === 0) {
    return getEmptyAnalytics();
  }

  // Calculate meal frequencies
  const mealFrequencies = calculateMealFrequencies(sessions);

  // Get stats by meal type
  const breakfastStats = getMealTypeStats('breakfast', mealFrequencies);
  const lunchStats = getMealTypeStats('lunch', mealFrequencies);
  const dinnerStats = getMealTypeStats('dinner', mealFrequencies);

  // Calculate adherence rates
  const completedSessions = sessions.filter(s => s.actualMeals?.length).length;
  const completionRate = (completedSessions / sessions.length) * 100;
  const averageAdherence = calculateAverageAdherence(sessions);

  // Calculate average glucose impact
  const avgDailyGlucoseImpact = calculateAverageDailyImpact(sessions);

  // Calculate streaks
  const streakData = calculateStreaks(sessions, lastPlayedDates);

  // Generate personalized recommendations
  const recommendations = generateRecommendations(
    mealFrequencies,
    breakfastStats,
    lunchStats,
    dinnerStats,
    averageAdherence,
  );

  return {
    totalSessions: sessions.length,
    averageAdherence,
    completionRate,
    favoriteBreakfast: mealFrequencies.find(m => m.mealType === 'breakfast') || null,
    favoriteLunch: mealFrequencies.find(m => m.mealType === 'lunch') || null,
    favoriteDinner: mealFrequencies.find(m => m.mealType === 'dinner') || null,
    breakfastStats,
    lunchStats,
    dinnerStats,
    overallHealthyMealRate: calculateOverallHealthRate(mealFrequencies),
    averageDailyGlucoseImpact: avgDailyGlucoseImpact,
    streak: streakData,
    recommendations,
  };
}

/**
 * Calculate how many times each meal was chosen
 */
function calculateMealFrequencies(sessions: SlowMoModeSession[]): MealFrequency[] {
  const mealMap = new Map<string, MealFrequency>();

  sessions.forEach(session => {
    // Count planned meals
    session.plannedMeals?.forEach(meal => {
      const key = meal.name;
      if (mealMap.has(key)) {
        const existing = mealMap.get(key)!;
        existing.count++;
        existing.totalGlucoseImpact += meal.glucoseImpact;
      } else {
        mealMap.set(key, {
          id: key.toLowerCase().replace(/\s+/g, '_'),
          name: meal.name,
          mealType: meal.mealType as any,
          count: 1,
          totalGlucoseImpact: meal.glucoseImpact,
          averageImpact: meal.glucoseImpact,
          healthLevel: 'moderate', // Will be updated when meal DB is integrated
        });
      }
    });
  });

  // Calculate averages and sort by frequency
  return Array.from(mealMap.values())
    .map(m => ({
      ...m,
      averageImpact: Math.round(m.totalGlucoseImpact / m.count),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get statistics for a specific meal type
 */
function getMealTypeStats(
  mealType: 'breakfast' | 'lunch' | 'dinner',
  frequencies: MealFrequency[],
): MealTypeStats {
  const mealsOfType = frequencies.filter(m => m.mealType === mealType);

  if (mealsOfType.length === 0) {
    return {
      mealType,
      totalSessions: 0,
      averageGlucoseImpact: 0,
      healthyMealRate: 0,
      mostCommonMeal: null,
      lowestImpactMeal: null,
    };
  }

  const totalImpact = mealsOfType.reduce((sum, m) => sum + m.averageImpact, 0);
  const avgImpact = Math.round(totalImpact / mealsOfType.length);
  const healthyCount = mealsOfType.filter(m => m.healthLevel === 'healthy').length;

  return {
    mealType,
    totalSessions: mealsOfType.reduce((sum, m) => sum + m.count, 0),
    averageGlucoseImpact: avgImpact,
    healthyMealRate: (healthyCount / mealsOfType.length) * 100,
    mostCommonMeal: mealsOfType[0] || null,
    lowestImpactMeal: [...mealsOfType].sort((a, b) => a.averageImpact - b.averageImpact)[0] || null,
  };
}

/**
 * Calculate player's adherence rate (how well they stick to plans)
 */
function calculateAverageAdherence(sessions: SlowMoModeSession[]): number {
  let totalAdherence = 0;

  sessions.forEach(session => {
    if (!session.plannedMeals?.length) return;

    const plannedCount = session.plannedMeals.length;
    const actualCount = session.actualMeals?.length || 0;

    // Count matches
    let matches = 0;
    session.actualMeals?.forEach(actual => {
      const planned = session.plannedMeals?.find(p => p.mealType === actual.mealType);
      if (planned && planned.name === actual.name) {
        matches++;
      }
    });

    // Adherence = (actual meals / planned meals) * (matches / actual meals)
    const completionRate = (actualCount / plannedCount) * 100;
    const accuracy = actualCount > 0 ? (matches / actualCount) * 100 : 0;
    const sessionAdherence = (completionRate + accuracy) / 2; // Average of completion & accuracy

    totalAdherence += sessionAdherence;
  });

  return Math.round(totalAdherence / sessions.length);
}

/**
 * Calculate average total glucose impact per day across all sessions
 */
function calculateAverageDailyImpact(sessions: SlowMoModeSession[]): number {
  let totalImpact = 0;
  let sessionCount = 0;

  sessions.forEach(session => {
    const dailyImpact = session.plannedMeals?.reduce((sum, meal) => sum + meal.glucoseImpact, 0) || 0;
    if (dailyImpact > 0) {
      totalImpact += dailyImpact;
      sessionCount++;
    }
  });

  return sessionCount > 0 ? Math.round(totalImpact / sessionCount) : 0;
}

/**
 * Calculate current and best streaks
 */
function calculateStreaks(
  sessions: SlowMoModeSession[],
  lastPlayedDates?: number[],
): { current: number; best: number } {
  // Sort sessions by date (most recent first)
  const sortedSessions = [...sessions].sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

  if (sortedSessions.length === 0) {
    return { current: 0, best: 0 };
  }

  // Calculate current streak
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  let lastDate: number | null = null;

  sortedSessions.forEach(session => {
    const sessionDate = session.completedAt || 0;
    const daysSinceNow = Math.floor((now - sessionDate) / DAY_MS);

    if (lastDate === null) {
      // First session
      if (daysSinceNow === 0) {
        currentStreak = 1;
        tempStreak = 1;
      } else {
        currentStreak = 0;
        tempStreak = 1;
      }
      lastDate = sessionDate;
    } else {
      const daysBetween = Math.floor((lastDate - sessionDate) / DAY_MS);

      if (daysBetween === 1) {
        // Consecutive day
        tempStreak++;
        if (daysSinceNow === 0) {
          currentStreak = tempStreak;
        }
      } else if (daysBetween > 1) {
        // Streak broken
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 1;
      }

      lastDate = sessionDate;
    }
  });

  bestStreak = Math.max(bestStreak, tempStreak);
  return { current: currentStreak, best: bestStreak };
}

/**
 * Calculate percentage of healthy meals chosen
 */
function calculateOverallHealthRate(frequencies: MealFrequency[]): number {
  const totalMeals = frequencies.reduce((sum, m) => sum + m.count, 0);
  if (totalMeals === 0) return 0;

  const healthyMeals = frequencies
    .filter(m => m.healthLevel === 'healthy')
    .reduce((sum, m) => sum + m.count, 0);

  return Math.round((healthyMeals / totalMeals) * 100);
}

/**
 * Generate personalized recommendations based on player data
 */
function generateRecommendations(
  frequencies: MealFrequency[],
  breakfast: MealTypeStats,
  lunch: MealTypeStats,
  dinner: MealTypeStats,
  adherence: number,
): string[] {
  const recommendations: string[] = [];

  // Adherence-based recommendations
  if (adherence < 50) {
    recommendations.push(
      'Focus on planning meals you actually want to eat - planning should be realistic, not perfect.',
    );
  } else if (adherence >= 80) {
    recommendations.push('Excellent consistency! You are very good at sticking to your plans.');
  }

  // Health-based recommendations
  if (breakfast.healthyMealRate < 50) {
    recommendations.push(
      'Try swapping one breakfast choice to something healthier - even one change can impact glucose stability.',
    );
  }
  if (lunch.healthyMealRate < 50) {
    recommendations.push('Lunch often has high glucose impact - consider lower-carb alternatives.');
  }
  if (dinner.healthyMealRate < 50) {
    recommendations.push('Evening meals impact overnight glucose - try planning lighter dinners.');
  }

  // Repetition-based recommendations
  if (frequencies.length < 5) {
    recommendations.push('Try exploring different meals - variety helps you find what works best for you.');
  }

  // High-impact meal recommendations
  const highImpactMeals = frequencies.filter(m => m.averageImpact > 60);
  if (highImpactMeals.length > 0) {
    recommendations.push(
      `"${highImpactMeals[0].name}" has high glucose impact - consider pairing it with protein or exercise.`,
    );
  }

  // Low-impact meal recommendations
  const lowImpactMeals = frequencies.filter(m => m.averageImpact < 30);
  if (lowImpactMeals.length > 0) {
    recommendations.push(
      `Great choice with "${lowImpactMeals[0].name}" - low glucose impact foods like this support stable blood sugar.`,
    );
  }

  // Streak-based motivation
  if (frequencies.length > 0) {
    recommendations.push(
      `You've planned ${frequencies.length} different meals - keep exploring to find your perfect options.`,
    );
  }

  // Always include a forward-looking recommendation
  recommendations.push('Each session teaches your body how to manage glucose - keep experimenting!');

  return recommendations.slice(0, 5); // Return top 5 recommendations
}

/**
 * Get empty analytics for new players
 */
function getEmptyAnalytics(): PlayerAnalytics {
  return {
    totalSessions: 0,
    averageAdherence: 0,
    completionRate: 0,
    favoriteBreakfast: null,
    favoriteLunch: null,
    favoriteDinner: null,
    breakfastStats: {
      mealType: 'breakfast',
      totalSessions: 0,
      averageGlucoseImpact: 0,
      healthyMealRate: 0,
      mostCommonMeal: null,
      lowestImpactMeal: null,
    },
    lunchStats: {
      mealType: 'lunch',
      totalSessions: 0,
      averageGlucoseImpact: 0,
      healthyMealRate: 0,
      mostCommonMeal: null,
      lowestImpactMeal: null,
    },
    dinnerStats: {
      mealType: 'dinner',
      totalSessions: 0,
      averageGlucoseImpact: 0,
      healthyMealRate: 0,
      mostCommonMeal: null,
      lowestImpactMeal: null,
    },
    overallHealthyMealRate: 0,
    averageDailyGlucoseImpact: 0,
    streak: { current: 0, best: 0 },
    recommendations: ['Start your first Slow Mo Mode session to get personalized insights!'],
  };
}
