import React from 'react';
import { View, Text } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { FoodUnit } from '@/types/game';
import { FoodSprite } from './FoodSprite';
import { getStabilityZone } from '@/utils/gameLogic';

interface BattleArenaProps {
  foodUnits: FoodUnit[];
  stability: number;
  onSwipe: (foodId: string, direction: 'up' | 'down') => void;
}

export const BattleArena: React.FC<BattleArenaProps> = ({
  foodUnits,
  stability,
  onSwipe,
}) => {
  const zone = getStabilityZone(stability);
  
  const getBackgroundGradient = () => {
    switch (zone) {
      case 'balanced':
        return 'from-green-900 to-green-700';
      case 'critical-high':
        return 'from-red-900 to-orange-700';
      case 'critical-low':
        return 'from-cyan-900 to-blue-700';
      default:
        return 'from-amber-900 to-yellow-700';
    }
  };
  
  const handleSwipe = (foodId: string, velocityY: number) => {
    const direction = velocityY < 0 ? 'up' : 'down';
    onSwipe(foodId, direction);
  };
  
  return (
    <View className={`flex-1 bg-gradient-to-b ${getBackgroundGradient()}`}>
      {/* Castle backdrop */}
      <View className="absolute inset-0 items-center justify-center opacity-20">
        <Text className="text-9xl">🏰</Text>
      </View>
      
      {/* Weather effects based on stability */}
      {zone === 'critical-high' && (
        <View className="absolute inset-0 bg-red-500/10" />
      )}
      {zone === 'critical-low' && (
        <View className="absolute inset-0 bg-cyan-500/10" />
      )}
      
      {/* Food units */}
      {foodUnits.map((food) => {
        const pan = Gesture.Pan()
          .onEnd((event) => {
            handleSwipe(food.id, event.velocityY);
          });
        
        return (
          <GestureDetector key={food.id} gesture={pan}>
            <View>
              <FoodSprite food={food} />
            </View>
          </GestureDetector>
        );
      })}
      
      {/* Castle gates at bottom */}
      <View className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent items-center justify-end pb-2">
        <Text className="text-6xl">🏰</Text>
        <Text className="text-amber-200 text-xs font-bold">CASTLE GATES</Text>
      </View>
    </View>
  );
};
