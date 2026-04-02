import React, { useEffect } from 'react';
import { View, Text, Animated, Modal, TouchableOpacity } from 'react-native';
import { FoodDefinition } from '@/types/game';

interface BattleTutorialModalProps {
  visible: boolean;
  food?: FoodDefinition;
  onDismiss: () => void;
  controlMode: 'swipe' | 'tap';
}

export const BattleTutorialModal: React.FC<BattleTutorialModalProps> = ({
  visible,
  food,
  onDismiss,
  controlMode,
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
          tension: 40,
        }),
      ]).start();

      // Optional: Auto-dismiss after 6 seconds (increased from 4s) 
      // but let the user tap to continue
      const timer = setTimeout(onDismiss, 6000);
      return () => {
        clearTimeout(timer);
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.8);
      };
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible, onDismiss]);

  if (!food) return null;

  const isAlly = food.faction === 'ally';
  const direction = isAlly ? '👆' : '👇';
  const buttonText = isAlly ? 'RALLY' : 'BANISH';
  const color = isAlly ? '#22c55e' : '#ef4444';

  return (
    <Modal visible={visible} transparent animationType="none">
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.7)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            alignItems: 'center',
            backgroundColor: '#0f0f1a',
            borderRadius: 20,
            borderWidth: 2,
            borderColor: color,
            padding: 24,
            maxWidth: 320,
          }}
        >
          {/* Food preview */}
          <Text style={{ fontSize: 60, marginBottom: 16 }}>{food.sprite}</Text>

          {/* Instruction */}
          <Text style={{ fontSize: 16, color: '#d1d5db', textAlign: 'center', marginBottom: 24, fontWeight: '600' }}>
            {isAlly
              ? `🥗 This is HEALTHY\nSwipe or tap ${direction} to RALLY it!`
              : `🍩 This is JUNK FOOD\nSwipe or tap ${direction} to BANISH it!`}
          </Text>

          {/* Action button - always show as "Tap to Continue" or primary action */}
          <TouchableOpacity
            onPress={onDismiss}
            style={{
              backgroundColor: color,
              paddingHorizontal: 40,
              paddingVertical: 14,
              borderRadius: 14,
              marginBottom: 8,
              shadowColor: color,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }}>
              {buttonText.toUpperCase()}
            </Text>
          </TouchableOpacity>

          {/* Dismiss hint */}
          <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>
            Tap anywhere to continue
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};
