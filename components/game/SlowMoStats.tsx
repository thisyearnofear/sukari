import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlayerAnalytics } from '@/utils/slowMoAnalytics';

interface SlowMoStatsProps {
  analytics: PlayerAnalytics;
  onClose: () => void;
}

const { width } = Dimensions.get('window');
const maxWidth = Math.min(width * 0.9, 450);

export const SlowMoStats: React.FC<SlowMoStatsProps> = ({ analytics, onClose }) => {
  if (analytics.totalSessions === 0) {
    return (
      <View className="flex-1 bg-[#0a0a12]">
        {/* Header */}
        <View className="w-full flex-row items-center justify-between p-4 absolute top-0 z-10">
          <TouchableOpacity onPress={onClose} className="p-2">
            <Ionicons name="close" size={24} color="#fbbf24" />
          </TouchableOpacity>
          <Text className="text-amber-400 text-lg font-bold">YOUR STATS</Text>
          <View className="w-8" />
        </View>

        {/* Empty State */}
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-6xl mb-4">🎯</Text>
          <Text className="text-white text-xl font-bold mb-2 text-center">
            No Sessions Yet
          </Text>
          <Text className="text-gray-400 text-center">
            Complete your first Slow Mo Mode session to see personalized analytics and recommendations.
          </Text>
          <TouchableOpacity
            onPress={onClose}
            className="mt-8 px-6 py-3 rounded-lg border border-amber-400 bg-amber-600/20"
          >
            <Text className="text-amber-400 font-bold">Start Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0a0a12]">
      {/* Header */}
      <View className="w-full flex-row items-center justify-between p-4 absolute top-0 z-10">
        <TouchableOpacity onPress={onClose} className="p-2">
          <Ionicons name="close" size={24} color="#fbbf24" />
        </TouchableOpacity>
        <Text className="text-amber-400 text-lg font-bold">YOUR STATS</Text>
        <View className="w-8" />
      </View>

      <ScrollView className="flex-1 pt-20 pb-10 px-4">
        {/* Streak Card */}
        <View style={{ width: maxWidth, alignSelf: 'center' }} className="mb-6">
          <View className="bg-gradient-to-r from-purple-900/60 to-blue-900/60 p-6 rounded-xl border border-purple-500">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-purple-300 text-xs font-bold">🔥 STREAK</Text>
              <Text className="text-purple-300 text-xs font-bold">🏆 BEST</Text>
            </View>
            <View className="flex-row items-end justify-between">
              <View className="items-center">
                <Text className="text-5xl font-bold text-amber-400">{analytics.streak.current}</Text>
                <Text className="text-gray-300 text-xs mt-1">Days</Text>
              </View>
              <View className="items-center">
                <Text className="text-3xl font-bold text-cyan-400">{analytics.streak.best}</Text>
                <Text className="text-gray-300 text-xs mt-1">Days</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Key Metrics */}
        <View style={{ width: maxWidth, alignSelf: 'center' }} className="mb-6">
          <Text className="text-amber-400 text-xs font-bold mb-3">📊 KEY METRICS</Text>

          <View className="grid grid-cols-2 gap-3 mb-3">
            {/* Total Sessions */}
            <View className="bg-black/60 p-4 rounded-lg border border-cyan-700">
              <Text className="text-cyan-400 text-xs font-bold mb-1">Sessions</Text>
              <Text className="text-white text-2xl font-bold">{analytics.totalSessions}</Text>
              <Text className="text-gray-400 text-xs mt-1">completed</Text>
            </View>

            {/* Adherence */}
            <View className="bg-black/60 p-4 rounded-lg border border-green-700">
              <Text className="text-green-400 text-xs font-bold mb-1">Adherence</Text>
              <Text className="text-white text-2xl font-bold">{analytics.averageAdherence}%</Text>
              <Text className="text-gray-400 text-xs mt-1">average</Text>
            </View>

            {/* Completion Rate */}
            <View className="bg-black/60 p-4 rounded-lg border border-blue-700">
              <Text className="text-blue-400 text-xs font-bold mb-1">Completion</Text>
              <Text className="text-white text-2xl font-bold">
                {Math.round(analytics.completionRate)}%
              </Text>
              <Text className="text-gray-400 text-xs mt-1">with actual meals</Text>
            </View>

            {/* Health Rate */}
            <View className="bg-black/60 p-4 rounded-lg border border-emerald-700">
              <Text className="text-emerald-400 text-xs font-bold mb-1">Healthy Meals</Text>
              <Text className="text-white text-2xl font-bold">{analytics.overallHealthyMealRate}%</Text>
              <Text className="text-gray-400 text-xs mt-1">of choices</Text>
            </View>
          </View>
        </View>

        {/* Glucose Impact Summary */}
        <View style={{ width: maxWidth, alignSelf: 'center' }} className="mb-6">
          <Text className="text-amber-400 text-xs font-bold mb-3">📈 GLUCOSE IMPACT</Text>

          <View className="bg-black/60 p-4 rounded-lg border border-amber-700 mb-3">
            <View className="flex-row items-end justify-between mb-3">
              <Text className="text-white text-sm font-bold">Average Daily Impact</Text>
              <Text className="text-amber-400 text-2xl font-bold">
                {analytics.averageDailyGlucoseImpact}
              </Text>
            </View>
            <Text className="text-gray-400 text-xs">
              Your typical daily glucose impact from planned meals (mg/dL)
            </Text>
          </View>

          {/* By Meal Type */}
          <View className="space-y-2">
            {[analytics.breakfastStats, analytics.lunchStats, analytics.dinnerStats].map((stat) => (
              <View key={stat.mealType} className="bg-black/40 p-3 rounded-lg border border-gray-700">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white text-sm font-bold capitalize">{stat.mealType}</Text>
                  <Text
                    className={`text-xs font-bold ${
                      stat.averageGlucoseImpact < 40
                        ? 'text-green-400'
                        : stat.averageGlucoseImpact < 60
                          ? 'text-amber-400'
                          : 'text-red-400'
                    }`}
                  >
                    {stat.averageGlucoseImpact} mg/dL
                  </Text>
                </View>
                {stat.lowestImpactMeal && (
                  <Text className="text-gray-400 text-xs">
                    Best choice: {stat.lowestImpactMeal.name}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Favorites */}
        {(analytics.favoriteBreakfast || analytics.favoriteLunch || analytics.favoriteDinner) && (
          <View style={{ width: maxWidth, alignSelf: 'center' }} className="mb-6">
            <Text className="text-amber-400 text-xs font-bold mb-3">⭐ YOUR FAVORITES</Text>

            {analytics.favoriteBreakfast && (
              <View className="bg-gradient-to-r from-orange-900/40 to-yellow-900/40 p-3 rounded-lg border border-orange-600 mb-2">
                <Text className="text-orange-300 text-xs font-bold">Breakfast</Text>
                <Text className="text-white text-sm font-bold">{analytics.favoriteBreakfast.name}</Text>
                <Text className="text-gray-400 text-xs">
                  Chosen {analytics.favoriteBreakfast.count}x • {analytics.favoriteBreakfast.averageImpact} mg/dL
                </Text>
              </View>
            )}

            {analytics.favoriteLunch && (
              <View className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 p-3 rounded-lg border border-green-600 mb-2">
                <Text className="text-green-300 text-xs font-bold">Lunch</Text>
                <Text className="text-white text-sm font-bold">{analytics.favoriteLunch.name}</Text>
                <Text className="text-gray-400 text-xs">
                  Chosen {analytics.favoriteLunch.count}x • {analytics.favoriteLunch.averageImpact} mg/dL
                </Text>
              </View>
            )}

            {analytics.favoriteDinner && (
              <View className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 p-3 rounded-lg border border-blue-600">
                <Text className="text-blue-300 text-xs font-bold">Dinner</Text>
                <Text className="text-white text-sm font-bold">{analytics.favoriteDinner.name}</Text>
                <Text className="text-gray-400 text-xs">
                  Chosen {analytics.favoriteDinner.count}x • {analytics.favoriteDinner.averageImpact} mg/dL
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Recommendations */}
        {analytics.recommendations.length > 0 && (
          <View style={{ width: maxWidth, alignSelf: 'center' }} className="mb-6">
            <Text className="text-amber-400 text-xs font-bold mb-3">💡 PERSONALIZED INSIGHTS</Text>

            {analytics.recommendations.map((rec, idx) => (
              <View key={idx} className="bg-black/60 p-3 rounded-lg border border-purple-700 mb-2">
                <View className="flex-row items-start">
                  <Text className="text-purple-400 mr-2 text-sm">•</Text>
                  <Text className="text-white text-xs flex-1">{rec}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Progress Indicator */}
        <View style={{ width: maxWidth, alignSelf: 'center' }} className="mb-8 p-4 rounded-lg bg-black/40 border border-gray-700">
          <Text className="text-gray-400 text-xs text-center">
            Keep playing! Each session builds your understanding of how different foods affect your glucose levels.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};
