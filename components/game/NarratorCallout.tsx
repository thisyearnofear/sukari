import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface NarratorCalloutProps {
  message: string;
  type?: 'announcement' | 'warning' | 'combo' | 'reflection' | 'fact';
  visible: boolean;
  science?: string; // Optional educational fact
}

export const NarratorCallout: React.FC<NarratorCalloutProps> = ({
  message,
  type = 'announcement',
  visible,
  science,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    if (visible) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 10 })
      );
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(1, { duration: science ? 2500 : 1500 }), // Longer for educational messages
        withTiming(0, { duration: 300 })
      );
    }
  }, [visible, science, opacity, scale]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  if (!visible) return null;
  
  const getColors = () => {
    switch (type) {
      case 'warning':
        return 'bg-red-900 border-red-500';
      case 'combo':
        return 'bg-purple-900 border-purple-500';
      case 'reflection':
        return 'bg-cyan-900 border-cyan-500';
      case 'fact':
        return 'bg-blue-900 border-blue-500';
      default:
        return 'bg-amber-900 border-amber-500';
    }
  };
  
  return (
    <View className="absolute inset-0 items-center justify-center pointer-events-none z-50">
      <Animated.View 
        style={animatedStyle}
        className={`px-6 py-4 rounded-xl border-2 ${getColors()} shadow-2xl max-w-xs`}
      >
        <Text className="text-white text-lg font-bold text-center tracking-wider mb-1">
          {message}
        </Text>
        {science && (
          <Text className="text-gray-200 text-xs text-center italic leading-4 mt-2">
            💡 {science}
          </Text>
        )}
      </Animated.View>
    </View>
  );
};
