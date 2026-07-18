import React, { useEffect } from 'react';
import { Text, Animated, Easing, Modal, Pressable, StyleSheet, View } from 'react-native';
import { FoodDefinition } from '@/types/game';
import { COLORS, FONTS, ANIMATIONS } from '@/constants/designSystem';

const P = COLORS.PROGRAMME;

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
  const slideAnim = React.useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (visible) {
      const { duration, bezier } = ANIMATIONS.MOTION.enter;
      const ease = Easing.bezier(bezier[0], bezier[1], bezier[2], bezier[3]);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration,
          easing: ease,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration,
          easing: ease,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(onDismiss, 6000);
      return () => {
        clearTimeout(timer);
        fadeAnim.setValue(0);
        slideAnim.setValue(12);
      };
    }
    fadeAnim.setValue(0);
    slideAnim.setValue(12);
  }, [visible, onDismiss, fadeAnim, slideAnim]);

  if (!food) return null;

  const isAlly = food.faction === 'ally';
  const accent = isAlly ? P.accent : P.danger;
  const gesture =
    controlMode === 'swipe'
      ? isAlly
        ? 'Swipe up'
        : 'Swipe down'
      : isAlly
        ? 'Tap Steady'
        : 'Tap Refuse';

  return (
    <Modal visible={visible} transparent animationType="none">
      <Pressable
        style={styles.backdrop}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss tutorial"
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              borderColor: accent,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.brand}>Sukari</Text>
          <Text style={styles.sprite}>{food.sprite}</Text>
          <Text style={[styles.foodName, { color: accent }]}>{food.name}</Text>

          <Text style={styles.instruction}>
            {isAlly
              ? `This steadies the field.\n${gesture} to take it.`
              : `This risks a spike or crash.\n${gesture} to refuse it.`}
          </Text>

          <View style={[styles.cta, { backgroundColor: accent }]}>
            <Text style={styles.ctaText}>{isAlly ? 'Steady' : 'Refuse'}</Text>
          </View>

          <Text style={styles.hint}>Tap anywhere to continue</Text>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    alignItems: 'center',
    backgroundColor: P.inkElevated,
    borderRadius: 2,
    borderWidth: 1,
    paddingVertical: 28,
    paddingHorizontal: 24,
    maxWidth: 340,
    width: '100%',
  },
  brand: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 18,
    marginBottom: 16,
  },
  sprite: {
    fontSize: 52,
    marginBottom: 8,
  },
  foodName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    marginBottom: 14,
  },
  instruction: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: P.textSoft,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 22,
  },
  cta: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 2,
    marginBottom: 12,
  },
  ctaText: {
    fontFamily: FONTS.bodyBold,
    color: P.ink,
    fontSize: 14,
  },
  hint: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: P.textMuted,
  },
});
