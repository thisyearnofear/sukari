/**
 * PressableScale — TouchableOpacity replacement with scale-down press effect.
 * #16: Tactile button press feel across the app.
 */
import React, { useRef } from 'react';
import { Animated, TouchableWithoutFeedback, ViewStyle } from 'react-native';

interface Props {
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'radio';
  children: React.ReactNode;
}

export const PressableScale: React.FC<Props> = ({ onPress, style, disabled, accessibilityLabel, accessibilityRole = 'button', children }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, friction: 8, tension: 200, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};
