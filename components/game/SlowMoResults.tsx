import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SlowMoModeSession } from '@/hooks/usePlayerProgress';

interface SlowMoResultsProps {
  session: SlowMoModeSession;
  sessionNumber: number;
  onContinue: () => void;
}

const { width } = Dimensions.get('window');
const maxWidth = Math.min(width * 0.9, 400);

export const SlowMoResults: React.FC<SlowMoResultsProps> = ({ session, sessionNumber, onContinue }) => {
  if (!session.plannedMeals) return null;

  const plannedImpact = session.plannedMeals.reduce((sum: number, m: any) => sum + (m.glucoseImpact || 0), 0);
  const actualImpact = session.actualMeals?.reduce((sum: number, m: any) => sum + (m.glucoseImpact || 0), 0) || 0;
  const difference = actualImpact - plannedImpact;
  const adherenceRate = session.actualMeals?.length ? (session.actualMeals.length / session.plannedMeals.length) * 100 : 0;

  const getAdhereanceEmoji = () => {
    if (adherenceRate >= 100) return '🌟';
    if (adherenceRate >= 80) return '✅';
    if (adherenceRate >= 60) return '📚';
    return '💪';
  };

  return (
    <View className="flex-1 bg-[#0a0a12]">
      {/* Header */}
      <View className="w-full flex-row items-center justify-between p-4 absolute top-0 z-10">
        <View className="w-8" />
        <Text className="text-amber-400 text-lg font-bold">SESSION SUMMARY</Text>
        <View className="w-8" />
      </View>

      {/* Main Content */}
      <ScrollView className="flex-1 pt-20 pb-20 items-center px-4">
        {/* Session Number */}
        <View className="mb-6">
          <Text className="text-6xl text-center">{getAdhereanceEmoji()}</Text>
          <Text className="text-white text-center text-xl font-bold mt-2">
            Session #{sessionNumber}
          </Text>
        </View>

        {/* Summary Card */}
        <View style={{ width: maxWidth }} className="bg-black/60 p-6 rounded-xl border border-purple-700 mb-6">
          
          <Text className="text-purple-400 text-xs font-bold mb-4">📊 RESULTS</Text>

          {/* Adherence Rate */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white text-sm font-bold">Adherence Rate</Text>
              <Text className={`text-sm font-bold ${
                adherenceRate >= 80 ? 'text-green-400' :
                adherenceRate >= 60 ? 'text-amber-400' : 'text-cyan-400'
              }`}>
                {Math.round(adherenceRate)}%
              </Text>
            </View>
            <View className="h-2 bg-gray-700 rounded overflow-hidden">
              <View 
                className={`h-2 rounded ${
                  adherenceRate >= 80 ? 'bg-green-400' :
                  adherenceRate >= 60 ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${Math.min(100, adherenceRate)}%` }}
              />
            </View>
          </View>

          {/* Glucose Impact Comparison */}
          <View className="space-y-2 border-t border-gray-700 pt-4">
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-400 text-xs">📋 Planned Impact:</Text>
              <Text className="text-amber-300 text-sm font-bold">{plannedImpact} mg/dL</Text>
            </View>
            {session.actualMeals && session.actualMeals.length > 0 && (
              <>
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-400 text-xs">🍽️ Actual Impact:</Text>
                  <Text className="text-blue-300 text-sm font-bold">{actualImpact} mg/dL</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-400 text-xs">📈 Difference:</Text>
                  <Text className={`text-sm font-bold ${
                    difference <= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {difference > 0 ? '+' : ''}{difference} mg/dL
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Insight Based on Performance */}
        {difference !== null && (
          <View style={{ width: maxWidth }} className="bg-black/60 p-4 rounded-xl border border-cyan-700 mb-6">
            <Text className="text-cyan-400 text-xs font-bold mb-2">💡 KEY INSIGHT</Text>
            {difference <= 0 ? (
              <>
                <Text className="text-white text-sm mb-2">
                  You stayed on track or made healthier choices than planned! This shows great real-world decision-making.
                </Text>
                <Text className="text-cyan-300 text-xs">
                  Continue this pattern for consistent glucose management.
                </Text>
              </>
            ) : difference <= 20 ? (
              <>
                <Text className="text-white text-sm mb-2">
                  Small variance from plan - completely normal. You were close to expectations.
                </Text>
                <Text className="text-cyan-300 text-xs">
                  Identify what caused the difference for next time.
                </Text>
              </>
            ) : (
              <>
                <Text className="text-white text-sm mb-2">
                  Larger deviation from plan. This is a learning opportunity!
                </Text>
                <Text className="text-cyan-300 text-xs">
                  Consider what challenges arose and plan strategies to overcome them.
                </Text>
              </>
            )}
          </View>
        )}

        {/* Meal Summary */}
        {session.plannedMeals && (
          <View style={{ width: maxWidth }} className="bg-black/60 p-4 rounded-xl border border-green-700 mb-6">
            <Text className="text-green-400 text-xs font-bold mb-3">🍴 MEALS TRACKED</Text>
            {session.plannedMeals.map((meal: any, idx: number) => {
              const actual = session.actualMeals?.find((m: any) => m.mealType === meal.mealType);
              const matched = actual && actual.name === meal.name;
              
              return (
                <View key={idx} className="flex-row items-start mb-3">
                  <Text className="text-green-400 mr-2">{matched ? '✅' : '📝'}</Text>
                  <View className="flex-1">
                    <Text className="text-white text-xs font-bold capitalize mb-1">
                      {meal.mealType}
                    </Text>
                    <Text className="text-gray-400 text-xs mb-1">
                      Plan: {meal.name}
                    </Text>
                    {actual && (
                      <Text className={`text-xs ${matched ? 'text-green-300' : 'text-cyan-300'}`}>
                        Actual: {actual.name}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Continue Button */}
        <TouchableOpacity
          onPress={onContinue}
          className="px-8 py-4 rounded-2xl border-4 bg-amber-600 border-amber-400 w-full max-w-[300px]"
          style={{
            shadowColor: '#f59e0b',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          <View className="flex-row items-center justify-center">
            <Text className="text-white text-base font-bold mr-2">CONTINUE</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};
