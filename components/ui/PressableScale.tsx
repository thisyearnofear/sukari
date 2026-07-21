import React, { useRef, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { ANIMATIONS } from '@/constants/designSystem';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Default 0.97 — Emil press feedback */
  pressedScale?: number;
};

/**
 * Instant press scale with strong ease-out. No hover theatre.
 */
export function PressableScale({
  children,
  style,
  pressedScale = 0.97,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const { duration, bezier } = ANIMATIONS.MOTION.press;

  const animateTo = (toValue: number) => {
    Animated.timing(scale, {
      toValue,
      duration,
      easing: Easing.bezier(bezier[0], bezier[1], bezier[2], bezier[3]),
      useNativeDriver: true,
    }).start();
  };

  return (
    <AnimatedPressable
      disabled={disabled}
      style={[style, { transform: [{ scale }] }]}
      onPressIn={(e) => {
        if (!disabled) animateTo(pressedScale);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animateTo(1);
        onPressOut?.(e);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
