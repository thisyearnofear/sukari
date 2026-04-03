import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
import { GameMode } from '@/types/game';
import { Ionicons } from '@expo/vector-icons';
import { BREAKFAST_MEALS, LUNCH_MEALS, DINNER_MEALS, Meal } from '@/constants/mealDatabase';

interface SlowMoModeProps {
  onStartGame: (mode: GameMode) => void;
  onBack: () => void;
  onComplete?: () => void;
}

export const SlowMoMode: React.FC<SlowMoModeProps> = ({ onStartGame, onBack, onComplete }) => {
  const { recordSlowMoSession } = usePlayerProgressContext();
  const [phase, setPhase] = useState<'morning' | 'simulation' | 'evening'>('morning');
  const [plannedMeals, setPlannedMeals] = useState<Meal[]>([]);
  const [actualMeals, setActualMeals] = useState<Meal[]>([]);
  const [simulationResults, setSimulationResults] = useState<any>(null);

  const handlePlanMeal = (mealType: string, mealId: string) => {
    // Find meal across all meal types
    const allMeals = [...BREAKFAST_MEALS, ...LUNCH_MEALS, ...DINNER_MEALS];
    const meal = allMeals.find(m => m.id === mealId);
    if (meal) {
      setPlannedMeals((prev: Meal[]) => [
        ...prev.filter(m => m.mealType !== (mealType as any)),
        meal
      ]);
    }
  };

  const handleActualMeal = (mealType: string, mealId: string) => {
    const allMeals = [...BREAKFAST_MEALS, ...LUNCH_MEALS, ...DINNER_MEALS];
    const meal = allMeals.find(m => m.id === mealId);
    if (meal) {
      setActualMeals((prev: Meal[]) => [
        ...prev.filter(m => m.mealType !== (mealType as any)),
        meal
      ]);
    }
    // Trigger comparison when all meals are entered
    if (actualMeals.length === 2) {
      compareWithReality();
    }
  };

  const simulateGlucoseImpact = () => {
    // Calculate total predicted glucose impact
    const totalImpact = plannedMeals.reduce((sum: number, meal: any) => sum + meal.glucoseImpact, 0);
    const averageImpact = totalImpact / plannedMeals.length;
    
    // Generate simulation data
    const simulation = {
      predictedCurve: generateGlucoseCurve(plannedMeals),
      totalImpact,
      averageImpact,
      insights: getEducationalInsights(plannedMeals),
    };
    
    setSimulationResults(simulation);
    setPhase('simulation');
  };

  const compareWithReality = () => {
    // Calculate actual vs predicted
    const predictedImpact = plannedMeals.reduce((sum, meal) => sum + meal.glucoseImpact, 0);
    const actualImpact = actualMeals.reduce((sum, meal) => sum + meal.glucoseImpact, 0);
    
    const comparison = {
      predictedImpact,
      actualImpact,
      difference: actualImpact - predictedImpact,
      actualCurve: generateGlucoseCurve(actualMeals),
      insights: getComparisonInsights(plannedMeals, actualMeals),
    };
    
    setSimulationResults((prev: any) => ({ ...prev, comparison }));
    setPhase('evening');
  };

  const generateGlucoseCurve = (meals: any[]) => {
    // Enhanced glucose curve simulation with realistic physiology
    const curve: any[] = [];
    let currentGlucose = 80; // Starting fasting glucose
    let currentTime = 8; // Start at 8am

    // Add fasting baseline
    curve.push({
      time: currentTime,
      glucoseLevel: currentGlucose,
      meal: 'Fasting',
      note: 'Baseline fasting glucose'
    });

    // Process each meal with realistic timing
    meals.forEach((meal, index) => {
      // Time between meals (2-3 hours)
      const hoursSinceLast = index === 0 ? 0 : (index * 2 + Math.random());
      currentTime += hoursSinceLast;
      
      // Glucose rise based on meal type and impact
      const glucoseRise = meal.glucoseImpact * (0.7 + Math.random() * 0.3);
      currentGlucose += glucoseRise;
      
      // Add meal point
      curve.push({
        time: Math.round(currentTime),
        glucoseLevel: Math.round(currentGlucose),
        meal: meal.name,
        type: meal.type,
        impact: glucoseRise
      });
      
      // Natural glucose decrease over time (simulate insulin effect)
      if (index < meals.length - 1) {
        currentTime += 1; // 1 hour later
        currentGlucose -= glucoseRise * 0.3; // Natural decrease
        curve.push({
          time: Math.round(currentTime),
          glucoseLevel: Math.round(Math.max(70, currentGlucose)), // Don't go below 70
          meal: 'Natural decrease',
          note: 'Insulin effect'
        });
      }
    });

    // Add evening baseline
    currentTime = 22;
    currentGlucose = Math.max(70, currentGlucose - 20);
    curve.push({
      time: currentTime,
      glucoseLevel: Math.round(currentGlucose),
      meal: 'Evening',
      note: 'End of day baseline'
    });

    return curve;
  };

  const getEducationalInsights = (meals: any[]) => {
    const healthyCount = meals.filter(m => m.type === 'healthy').length;
    const total = meals.length;
    const totalImpact = meals.reduce((sum, meal) => sum + meal.glucoseImpact, 0);
    const avgImpact = totalImpact / total;
    
    // Calculate glucose variability score (0-100, lower is better)
    const variabilityScore = Math.min(100, Math.round(avgImpact / 2));
    
    if (healthyCount === total) {
      return [
        `🌟 Excellent! Your meal plan has a variability score of ${variabilityScore}/100, indicating very stable glucose control.`,
        'This balanced approach with minimal processed carbohydrates helps maintain steady glucose levels throughout the day.',
        `Your predicted peak glucose is around ${Math.round(totalImpact * 0.8)} mg/dL, which is in the ideal range for most people.`,
        'Consider adding 15-30 minutes of light exercise (like walking) after meals to further enhance insulin sensitivity.'
      ];
    } else if (healthyCount >= total / 2) {
      return [
        `📊 Your meal plan has a variability score of ${variabilityScore}/100, showing good balance with room for improvement.`,
        'You have some healthier choices mixed with higher-impact meals. This balance is common and manageable.',
        `Your highest predicted spike is around ${Math.round(Math.max(...meals.map(m => m.glucoseImpact)) * 0.8)} mg/dL.`,
        'To improve stability, try replacing one higher-impact meal with a lower-glycemic alternative (e.g., swap pancakes for oatmeal).'
      ];
    } else {
      return [
        `⚠️ Your meal plan has a variability score of ${variabilityScore}/100, indicating potential for significant glucose fluctuations.`,
        'Several high-impact meals may cause glucose spikes above 180 mg/dL, which can lead to fatigue and long-term complications.',
        `Consider these strategies:
        • Add protein/fiber to meals (e.g., nuts to pasta, veggies to burgers)
        • Try the "plate method": ½ veggies, ¼ protein, ¼ carbs
        • Space out carbohydrates throughout the day rather than all at once`,
        'Small, consistent changes can significantly improve glucose stability over time.'
      ];
    }
  };

  const getComparisonInsights = (planned: any[], actual: any[]) => {
    const plannedHealthy = planned.filter(m => m.type === 'healthy').length;
    const actualHealthy = actual.filter(m => m.type === 'healthy').length;
    const plannedImpact = planned.reduce((sum, m) => sum + m.glucoseImpact, 0);
    const actualImpact = actual.reduce((sum, m) => sum + m.glucoseImpact, 0);
    const difference = actualImpact - plannedImpact;
    
    if (actualHealthy > plannedHealthy) {
      return [
        `🌟 Excellent adaptation! You made ${actualHealthy - plannedHealthy} healthier choice(s) than planned.`,
        `This reduced your glucose impact by ${Math.abs(difference)} mg/dL compared to your plan.`,
        'This demonstrates great real-world decision making and flexibility!',
        `Consider what helped you make these better choices and try to replicate it:
         • Were you more mindful of hunger cues?
         • Did you have healthier options available?
         • Were you in a less stressful environment?`
      ];
    } else if (actualHealthy === plannedHealthy) {
      return [
        `✅ Perfect consistency! You maintained your planned ${plannedHealthy} healthy meal(s).`,
        'This predictability is excellent for glucose management and planning.',
        `Your actual impact (${actualImpact} mg/dL) closely matched your prediction (${plannedImpact} mg/dL).`,
        `For your next challenge, try experimenting with:
         • Adding a short walk after one meal
         • Drinking water before meals to help with portion control
         • Trying one new healthy recipe`
      ];
    } else {
      return [
        `📚 Learning opportunity! Your actual choices had ${Math.abs(difference)} mg/dL higher impact than planned.`,
        'This is completely normal and part of the learning process. Let\'s analyze what happened:',
        `You had ${plannedHealthy} healthy meals planned but ${actualHealthy} in reality.`,
        `Reflection questions to consider:
         • What unexpected situations arose?
         • Were healthier options not available?
         • How were you feeling emotionally at meal times?
         • What could make it easier to stick to your plan next time?`
      ];
    }
  };

  const handleAddExercise = () => {
    // Exercise reduces glucose impact by ~15%
    const adjusted = simulationResults.predictedCurve.map((point: any) => {
      if (point.meal && point.meal !== 'Fasting' && point.meal !== 'Evening' && point.meal !== 'Natural decrease') {
        return {
          ...point,
          glucoseLevel: Math.max(70, Math.round(point.glucoseLevel * 0.85)),
          note: 'With 15min exercise'
        };
      }
      return point;
    });
    setSimulationResults((prev: any) => ({
      ...prev,
      predictedCurve: adjusted,
      adjustmentNote: '✨ Added 15-minute walk effect'
    }));
  };

  const handleReplaceMeal = () => {
    // Suggest replacing highest-impact meal with healthy alternative
    const highest = plannedMeals.reduce((max: Meal, m: Meal) => m.glucoseImpact > max.glucoseImpact ? m : max);
    const allMeals = [...BREAKFAST_MEALS, ...LUNCH_MEALS, ...DINNER_MEALS];
    const healthyAlternative = allMeals.find(m => m.type === 'healthy' && m.mealType === highest.mealType);
    if (healthyAlternative) {
      const newMeals = plannedMeals.map((m: Meal) => m.mealType === highest.mealType ? healthyAlternative : m);
      setPlannedMeals(newMeals);
      simulateGlucoseImpact();
      setSimulationResults((prev: any) => ({
        ...prev,
        adjustmentNote: `✨ Replaced ${highest.name} with ${healthyAlternative.name}`
      }));
    }
  };

  const handleAdjustPortion = () => {
    // Reduce portion sizes by 20%
    const adjusted = plannedMeals.map((m: any) => ({
      ...m,
      glucoseImpact: Math.round(m.glucoseImpact * 0.8)
    }));
    setAdjustedMeals(adjusted);
    setPlannedMeals(adjusted);
    simulateGlucoseImpact();
  };

  const setAdjustedMeals = (meals: Meal[]) => {
    // Placeholder to satisfy existing calls if any
  };

  return (
    <View className="flex-1 bg-[#0a0a12]">
      {/* Header */}
      <View className="w-full flex-row items-center justify-between p-4 absolute top-0 z-10">
        <TouchableOpacity onPress={onBack} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#fbbf24" />
        </TouchableOpacity>
        <Text className="text-amber-400 text-lg font-bold">SLOW MO MODE</Text>
        <View className="w-8" /> {/* Spacer for symmetry */}
      </View>

      {/* Phase Content */}
      <ScrollView className="flex-1 pt-16 pb-20">
        {/* Morning Planning Phase */}
        {phase === 'morning' && (
          <View className="items-center px-4">
            <Text className="text-5xl mb-4">☀️</Text>
            <Text className="text-amber-400 text-3xl font-bold mb-2">MORNING PLANNING</Text>
            <Text className="text-white text-xl text-center mb-6">
              Plan your meals for today
            </Text>

            {/* Meal Planning */}
            <View className="w-full max-w-[350px] mb-6">
              {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                const planned = plannedMeals.find(m => m.mealType === mealType);
                const meals = mealType === 'breakfast' ? BREAKFAST_MEALS : mealType === 'lunch' ? LUNCH_MEALS : DINNER_MEALS;
                return (
                  <View key={mealType} className="mb-4">
                    <Text className="text-purple-300 text-sm font-bold mb-2">
                      {mealType.toUpperCase()}
                    </Text>
                    <View className="flex-row gap-2">
                      {meals.slice(0, 2).map((option) => (
                        <TouchableOpacity
                          key={option.id}
                          onPress={() => handlePlanMeal(mealType, option.id)}
                          className={`flex-1 p-3 rounded-lg border ${
                            planned?.id === option.id
                              ? 'bg-green-600/30 border-green-400'
                              : 'bg-black/40 border-purple-700'
                          }`}
                        >
                          <Text className="text-white text-xs text-center mb-1" numberOfLines={2}>
                            {option.name}
                          </Text>
                          <Text className={`text-xs text-center ${
                            option.type === 'healthy' ? 'text-green-400' : option.type === 'moderate' ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {option.glucoseImpact} mg/dL
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Educational Content */}
            <View className="bg-black/60 p-4 rounded-xl border border-cyan-700 mb-6 w-full max-w-[350px]">
              <Text className="text-cyan-400 text-xs font-bold mb-2">📚 LEARNING TIP</Text>
              <Text className="text-white text-sm">
                Planning meals helps you anticipate glucose impacts and make informed decisions throughout the day.
              </Text>
            </View>

            {/* Simulation Button */}
            {plannedMeals.length === 3 && (
              <TouchableOpacity
                onPress={simulateGlucoseImpact}
                className="px-8 py-4 rounded-2xl border-4 bg-amber-600 border-amber-400 w-full max-w-[300px]"
                style={{
                  shadowColor: '#f59e0b',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 20,
                  elevation: 10,
                }}
              >
                <Text className="text-white text-base font-bold text-center">
                  SIMULATE GLUCOSE IMPACT
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Simulation Phase */}
        {phase === 'simulation' && simulationResults && (
          <View className="items-center px-4">
            <Text className="text-5xl mb-4">🧪</Text>
            <Text className="text-amber-400 text-3xl font-bold mb-2">SIMULATION</Text>
            <Text className="text-white text-xl text-center mb-6">
              Predicted glucose impact
            </Text>

            {/* Glucose Curve Visualization */}
            <View className="bg-black/60 p-4 rounded-xl border border-purple-700 mb-6 w-full max-w-[350px]">
              <Text className="text-purple-300 text-xs font-bold mb-3">PREDICTED GLUCOSE CURVE</Text>
              {simulationResults.predictedCurve.map((point: any, index: number) => (
                <View key={index} className="flex-row items-center mb-2">
                  <Text className="text-gray-400 text-xs w-16">{point.time}:00</Text>
                  <View className="flex-1 h-2 bg-gray-700 rounded mr-2">
                    <View 
                      className={`h-2 rounded ${
                        point.meal === 'Fasting' || point.meal === 'Evening' || point.meal === 'Natural decrease' 
                          ? 'bg-green-400' 
                          : point.type === 'healthy' 
                          ? 'bg-amber-400' 
                          : 'bg-red-400'
                      }`}
                      style={{ width: `${Math.min(100, (point.glucoseLevel - 70) * 1.5)}%` }}
                    />
                  </View>
                  <Text className={`text-xs w-12 ${
                    point.glucoseLevel > 180 ? 'text-red-400' : 
                    point.glucoseLevel > 140 ? 'text-amber-400' : 
                    'text-green-400'
                  }`}>
                    {point.glucoseLevel} mg/dL
                  </Text>
                </View>
              ))}
              <View className="mt-3 pt-2 border-t border-gray-700">
                <Text className="text-green-300 text-xs mb-1">
                  📊 Average predicted impact: {simulationResults.averageImpact.toFixed(1)} mg/dL
                </Text>
                <Text className="text-cyan-300 text-xs">
                  📈 Peak predicted: {Math.max(...simulationResults.predictedCurve.map((p: any) => p.glucoseLevel))} mg/dL
                </Text>
              </View>
            </View>

            {/* Educational Insights */}
            <View className="bg-black/60 p-4 rounded-xl border border-cyan-700 mb-6 w-full max-w-[350px]">
              <Text className="text-cyan-400 text-xs font-bold mb-2">🎓 EDUCATIONAL INSIGHTS</Text>
              {simulationResults.insights.map((insight: string, index: number) => (
                <View key={index} className="flex-row items-start mb-2">
                  <Text className="text-cyan-300 mr-2">•</Text>
                  <Text className="text-white text-xs flex-1">{insight}</Text>
                </View>
              ))}
            </View>

            {/* Interactive Adjustments */}
            <View className="bg-black/60 p-4 rounded-xl border border-amber-700 mb-6 w-full max-w-[350px]">
              <Text className="text-amber-400 text-xs font-bold mb-3">🔄 WHAT IF SCENARIOS</Text>
              {simulationResults?.adjustmentNote && (
                <Text className="text-amber-300 text-xs mb-3 text-center">{simulationResults.adjustmentNote}</Text>
              )}
              <View className="space-y-2">
                <TouchableOpacity onPress={handleAddExercise} className="p-2 bg-black/40 rounded border border-amber-600 active:bg-amber-600/20">
                  <Text className="text-amber-300 text-xs text-center">+ Add 15min Exercise</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleReplaceMeal} className="p-2 bg-black/40 rounded border border-green-600 active:bg-green-600/20">
                  <Text className="text-green-300 text-xs text-center">+ Replace One Meal</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAdjustPortion} className="p-2 bg-black/40 rounded border border-blue-600 active:bg-blue-600/20">
                  <Text className="text-blue-300 text-xs text-center">+ Adjust Portion Size</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Evening Reflection Button */}
            <TouchableOpacity
              onPress={() => setPhase('evening')}
              className="px-8 py-4 rounded-2xl border-4 bg-purple-600 border-purple-400 w-full max-w-[300px]"
              style={{
                shadowColor: '#a855f7',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              <Text className="text-white text-base font-bold text-center">
                PROCEED TO EVENING REFLECTION
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Evening Reflection Phase */}
        {phase === 'evening' && simulationResults && (
          <View className="items-center px-4">
            <Text className="text-5xl mb-4">🌙</Text>
            <Text className="text-amber-400 text-3xl font-bold mb-2">EVENING REFLECTION</Text>
            <Text className="text-white text-xl text-center mb-6">
              Compare prediction with reality
            </Text>

            {/* Comparison Summary */}
            {simulationResults?.comparison && (
              <View className="bg-black/60 p-4 rounded-xl border border-cyan-700 mb-6 w-full max-w-[350px]">
                <Text className="text-cyan-400 text-xs font-bold mb-3">COMPARISON SUMMARY</Text>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-400 text-xs">Predicted Impact:</Text>
                  <Text className="text-white text-xs">{simulationResults.comparison.predictedImpact} mg/dL</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-400 text-xs">Actual Impact:</Text>
                  <Text className="text-white text-xs">{simulationResults.comparison.actualImpact} mg/dL</Text>
                </View>
                <View className="flex-row justify-between mb-3">
                  <Text className="text-gray-400 text-xs">Difference:</Text>
                  <Text className={`text-xs ${
                    simulationResults.comparison.difference < 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {simulationResults.comparison.difference < 0 ? '↓' : '↑'} {Math.abs(simulationResults.comparison.difference)} mg/dL
                  </Text>
                </View>
                <Text className={`text-xs text-center ${
                  Math.abs(simulationResults.comparison.difference) < 20 ? 'text-green-400' : 'text-amber-400'
                }`}>
                  {Math.abs(simulationResults.comparison.difference) < 20 ? 
                    'Great consistency! ✅' : 
                    'Learning opportunity 📚'
                  }
                </Text>
              </View>
            )}

            {/* Actual Meal Input */}
            {actualMeals.length < 3 && (
              <View className="w-full max-w-[350px] mb-6">
                <Text className="text-purple-300 text-sm font-bold mb-3 text-center">
                  WHAT DID YOU ACTUALLY EAT?
                </Text>
                {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                  const actual = actualMeals.find(m => m.mealType === mealType);
                  const meals = mealType === 'breakfast' ? BREAKFAST_MEALS : mealType === 'lunch' ? LUNCH_MEALS : DINNER_MEALS;
                  return (
                    <View key={mealType} className="mb-3">
                      <Text className="text-white text-xs mb-1">
                        {mealType.toUpperCase()}:
                      </Text>
                      <View className="flex-row gap-1">
                        {meals.slice(0, 2).map((option) => (
                          <TouchableOpacity
                            key={option.id}
                            onPress={() => handleActualMeal(mealType, option.id)}
                            className={`flex-1 p-2 rounded border ${
                              actual?.id === option.id
                                ? 'bg-blue-600/30 border-blue-400'
                                : 'bg-black/40 border-gray-600'
                            }`}
                          >
                            <Text className="text-white text-xs text-center" numberOfLines={2}>
                              {option.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Comparison Insights */}
            {simulationResults?.comparison && (
              <View className="bg-black/60 p-4 rounded-xl border border-green-700 mb-6 w-full max-w-[350px]">
                <Text className="text-green-400 text-xs font-bold mb-2">🎓 REFLECTION INSIGHTS</Text>
                {simulationResults.comparison.insights.map((insight: string, index: number) => (
                  <View key={index} className="flex-row items-start mb-2">
                    <Text className="text-green-300 mr-2">•</Text>
                    <Text className="text-white text-xs flex-1">{insight}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Educational Takeaways */}
            <View className="bg-black/60 p-4 rounded-xl border border-amber-700 mb-6 w-full max-w-[350px]">
              <Text className="text-amber-400 text-xs font-bold mb-2">📚 KEY TAKEAWAYS</Text>
              <View className="flex-row items-start mb-2">
                <Text className="text-amber-300 mr-2">•</Text>
                <Text className="text-white text-xs flex-1">
                  Planning helps anticipate glucose impacts throughout the day
                </Text>
              </View>
              <View className="flex-row items-start mb-2">
                <Text className="text-amber-300 mr-2">•</Text>
                <Text className="text-white text-xs flex-1">
                  Real-world choices may differ from plans - that&apos;s okay!
                </Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-amber-300 mr-2">•</Text>
                <Text className="text-white text-xs flex-1">
                  Use these insights to make better choices tomorrow
                </Text>
              </View>
            </View>

            {/* Complete Button */}
            <TouchableOpacity
              onPress={() => {
                // Record session with results
                recordSlowMoSession({
                  plannedMeals: plannedMeals.map(m => ({
                    mealType: m.mealType,
                    name: m.name,
                    glucoseImpact: m.glucoseImpact
                  })),
                  actualMeals: actualMeals.length > 0 ? actualMeals.map(m => ({
                    mealType: m.mealType,
                    name: m.name,
                    glucoseImpact: m.glucoseImpact
                  })) : undefined,
                });
                // Trigger completion callback if provided
                onComplete?.();
              }}
              className="px-8 py-4 rounded-2xl border-4 bg-green-600 border-green-400 w-full max-w-[300px]"
              style={{
                shadowColor: '#10b981',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              <Text className="text-white text-base font-bold text-center">
                COMPLETE SLOW MO MODE
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};