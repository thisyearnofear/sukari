import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { FoodUnit } from '@/types/game';
import { FOOD_DEFINITIONS } from '@/constants/gameConfig';

interface FoodSpriteProps {
  food: FoodUnit;
}

const FoodSpriteComponent: React.FC<FoodSpriteProps> = ({ food }) => {
  const definition = FOOD_DEFINITIONS.find(d => d.type === food.type);
  
  return (
    <View
      className="absolute items-center justify-center"
      style={{
        left: food.x,
        top: food.y,
        transform: [{ translateX: -25 }, { translateY: -25 }],
      }}
    >
      <View
        className="w-12 h-12 rounded-full items-center justify-center border-2 shadow-lg"
        style={{
          backgroundColor: definition?.color + '40',
          borderColor: definition?.color,
        }}
      >
        <Text className="text-3xl">{food.sprite}</Text>
      </View>
      <View 
        className="mt-1 px-2 py-0.5 rounded"
        style={{ backgroundColor: definition?.color + 'CC' }}
      >
        <Text className="text-white text-xs font-bold text-center">
          {food.name}
        </Text>
      </View>
    </View>
  );
};

// Optimization: Memoize FoodSprite to prevent unnecessary re-renders during the game loop.
// Only re-render if position (x, y) or key properties change.
// This follows the PERFORMANT Core Principle.
export const FoodSprite = memo(FoodSpriteComponent, (prevProps, nextProps) => {
  return (
    prevProps.food.id === nextProps.food.id &&
    prevProps.food.x === nextProps.food.x &&
    prevProps.food.y === nextProps.food.y &&
    prevProps.food.type === nextProps.food.type &&
    prevProps.food.opacity === nextProps.food.opacity &&
    prevProps.food.scale === nextProps.food.scale
  );
});
