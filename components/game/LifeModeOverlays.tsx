/**
 * LifeModeOverlays — Extracted from LifeModeHUD.tsx for MODULAR decomposition.
 * Contains: LifeModePauseOverlay, SavedFoodsPanel, SocialMeterDisplay
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, useWindowDimensions } from 'react-native';
import { SavedFoodSlot, SocialStats } from '@/types/game';

// Re-export from here so existing imports still work
export { LifeModePauseOverlay, SavedFoodsPanel, SocialMeterDisplay };

const LifeModePauseOverlay: React.FC<{
  isPaused: boolean;
  onResume?: () => void;
  onRestart?: () => void;
  onExit?: () => void;
  controlMode?: 'swipe' | 'tap';
  onToggleControlMode?: () => void;
}> = ({ isPaused, onResume, onRestart, onExit, controlMode = 'swipe', onToggleControlMode }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (isPaused) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 100, useNativeDriver: true }),
      ]).start();
    }
  }, [isPaused, fadeAnim, scaleAnim]);

  if (!isPaused) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute', top: -100, left: 0,
        width: screenWidth, height: screenHeight + 200,
        backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1000,
        justifyContent: 'center', alignItems: 'center', opacity: fadeAnim,
      }}
    >
      <Animated.View
        style={{
          backgroundColor: 'rgba(10,10,18,0.98)', padding: 24, borderRadius: 20,
          borderWidth: 3, borderColor: '#fbbf24', alignItems: 'center',
          shadowColor: '#fbbf24', shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8, shadowRadius: 30, transform: [{ scale: scaleAnim }],
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 16 }}>🏰</Text>
          <View style={{ width: 40, height: 2, backgroundColor: '#fbbf24', marginHorizontal: 8 }} />
          <Text style={{ fontSize: 36 }}>⏸️</Text>
          <View style={{ width: 40, height: 2, backgroundColor: '#fbbf24', marginHorizontal: 8 }} />
          <Text style={{ fontSize: 16 }}>🏰</Text>
        </View>

        <Text style={{ color: '#fbbf24', fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>KINGDOM RESTS</Text>
        <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 20 }}>The realm awaits your command, my liege...</Text>

        <PauseButton onPress={onResume} color="#22c55e" label="⚔️ CONTINUE BATTLE" />
        {onToggleControlMode && (
          <TouchableOpacity
            onPress={onToggleControlMode}
            accessibilityLabel={`Switch to ${controlMode === 'swipe' ? 'tap' : 'swipe'} controls`}
            accessibilityRole="button"
            style={{ ...pauseBtnStyle, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.2)' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 16, marginRight: 8 }}>{controlMode === 'swipe' ? '👆👇' : '🖱️'}</Text>
              <View>
                <Text style={{ color: '#93c5fd', textAlign: 'center', fontWeight: 'bold', fontSize: 10 }}>CONTROL MODE</Text>
                <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 14 }}>{controlMode === 'swipe' ? 'SWIPE' : 'TAP'}</Text>
              </View>
              <Text style={{ fontSize: 16, marginLeft: 8, color: '#60a5fa' }}>🔄</Text>
            </View>
          </TouchableOpacity>
        )}
        <PauseButton onPress={onRestart} color="#fbbf24" label="🔄 NEW DAY" />
        <PauseButton onPress={onExit} color="#6b7280" label="🚪 LEAVE KINGDOM" />
      </Animated.View>
    </Animated.View>
  );
};

const pauseBtnStyle = {
  paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14,
  marginBottom: 12, width: 200, borderWidth: 2,
};

const PauseButton: React.FC<{ onPress?: () => void; color: string; label: string }> = ({ onPress, color, label }) => (
  <TouchableOpacity
    onPress={onPress}
    accessibilityLabel={label} accessibilityRole="button"
    style={{ ...pauseBtnStyle, borderColor: color, backgroundColor: `${color}4D` }}
  >
    <Text style={{ color: `${color}CC`, textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>{label}</Text>
  </TouchableOpacity>
);

const SavedFoodsPanel: React.FC<{
  savedFoods: SavedFoodSlot[];
  onConsumeSaved: (index: number) => void;
}> = ({ savedFoods, onConsumeSaved }) => {
  const { width: screenWidth } = useWindowDimensions();
  return (
    <View style={{
      position: 'absolute', bottom: 80, left: (screenWidth - 200) / 2,
      flexDirection: 'row', gap: 8, zIndex: 50,
    }}>
      {savedFoods.map((slot, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => slot.food && onConsumeSaved(i)}
          disabled={!slot.food}
          accessibilityLabel={slot.food ? `Use saved ${slot.food.name}` : `Empty pantry slot ${i + 1}`}
          accessibilityRole="button"
          style={{
            width: 56, height: 56, borderRadius: 12,
            backgroundColor: slot.food ? 'rgba(34,197,94,0.2)' : 'rgba(75,85,99,0.2)',
            borderWidth: 2, borderColor: slot.food ? '#22c55e' : '#374151',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: slot.food ? 24 : 16 }}>{slot.food ? slot.food.sprite : '📦'}</Text>
          {slot.food && <Text style={{ color: '#86efac', fontSize: 8, fontWeight: 'bold' }}>TAP</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const SocialMeterDisplay: React.FC<{
  socialStats: SocialStats;
}> = ({ socialStats }) => {
  const isHighSocial = socialStats.socialMeter >= 70;
  return (
    <View
      accessible accessibilityLabel={`Social meter at ${socialStats.socialMeter} percent`}
      style={{
        position: 'absolute', top: 150, right: 90,
        backgroundColor: 'rgba(10,10,18,0.95)', borderRadius: 10,
        borderWidth: 2, borderColor: isHighSocial ? '#f59e0b' : '#6b7280',
        padding: 8, zIndex: 100,
      }}
    >
      <Text style={{ color: '#fcd34d', fontSize: 10, fontWeight: 'bold', textAlign: 'center' }}>👑 ALLIES</Text>
      <View style={{ width: 60, height: 8, backgroundColor: 'rgba(75,85,99,0.5)', borderRadius: 4, marginTop: 4, overflow: 'hidden' }}>
        <View style={{ width: `${socialStats.socialMeter}%`, height: '100%', backgroundColor: isHighSocial ? '#f59e0b' : '#fcd34d', borderRadius: 4 }} />
      </View>
      {socialStats.shareStreak > 1 && (
        <Text style={{ color: '#fbbf24', fontSize: 9, textAlign: 'center', marginTop: 2 }}>🤝 {socialStats.shareStreak}x gifts</Text>
      )}
    </View>
  );
};
