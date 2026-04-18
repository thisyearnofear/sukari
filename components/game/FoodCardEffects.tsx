/**
 * FoodCardEffects — Visual effect sub-components extracted from FoodCard.tsx.
 * Contains: ExplosionParticle, ShockwaveRing, SwipeTrail, ElectricArc
 */
import React, { useRef, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { SwipeDirection } from '@/types/game';

export const ExplosionParticle: React.FC<{
  x: number; y: number; color: string;
  type: 'spark' | 'ring' | 'star' | 'droplet' | 'ember';
  delay?: number; angle: number; distance: number;
}> = ({ x, y, color, type, delay = 0, angle, distance }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [anim, delay]);

  const emojis = { spark: '⚡', ring: '💫', star: '✨', droplet: '💧', ember: '🔥' };

  return (
    <Animated.View
      style={{
        position: 'absolute', left: x, top: y,
        transform: [
          { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * distance] }) },
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * distance] }) },
          { scale: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.3, 1.5, 0.2] }) },
          { rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${360 * (type === 'star' ? 2 : 1)}deg`] }) },
        ],
        opacity: anim.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [0, 1, 0.8, 0] }),
      }}
    >
      <Text style={{ fontSize: 14, color }}>{emojis[type]}</Text>
    </Animated.View>
  );
};

export const ShockwaveRing: React.FC<{ color: string; delay?: number }> = ({ color, delay = 0 }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [anim, delay]);

  return (
    <Animated.View
      style={{
        position: 'absolute', width: 60, height: 60, borderRadius: 30,
        borderWidth: 3, borderColor: color, left: -30, top: -30,
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 3] }) }],
        opacity: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.8, 0.5, 0] }),
      }}
    />
  );
};

export const SwipeTrail: React.FC<{ direction: SwipeDirection; color: string }> = ({ direction, color }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [anim]);

  const isVertical = direction === 'up' || direction === 'down';
  const isPositive = direction === 'down' || direction === 'right';

  const translate = anim.interpolate({ inputRange: [0, 1], outputRange: [0, isPositive ? 100 : -100] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 3] });
  const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.8, 0.4, 0] });

  const positions = { up: { left: 22, top: -20 }, down: { left: 22, top: 40 }, left: { left: -20, top: 12 }, right: { left: 60, top: 12 } };

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: isVertical ? 20 : 40, height: isVertical ? 40 : 20,
        backgroundColor: color, borderRadius: 10,
        transform: isVertical ? [{ translateY: translate }, { scaleY: scale }] : [{ translateX: translate }, { scaleX: scale }],
        opacity, ...positions[direction],
        shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 15,
      }}
    />
  );
};

export const ElectricArc: React.FC<{ color: string }> = ({ color }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 50, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [anim]);

  return (
    <Animated.View
      style={{
        position: 'absolute', top: -10, left: -10, right: -10, bottom: -10,
        borderRadius: 20, borderWidth: 2, borderColor: color, opacity: anim,
        shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10,
      }}
    />
  );
};
