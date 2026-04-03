import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, useWindowDimensions } from 'react-native';
import { BodyMetrics, TimePhase, MorningCondition, PlotTwist, SavedFoodSlot, SocialStats } from '@/types/game';
import { TIME_PHASES, MORNING_CONDITIONS, METRIC_LABELS } from '@/constants/gameConfig';

const SIDE_PANEL_WIDTH = 80;

interface LifeModeHUDProps {
  metrics: BodyMetrics;
  timePhase: TimePhase;
  timer: number;
  score: number;
  comboCount: number;
  comboTitle?: string;
  morningCondition: MorningCondition;
  activePlotTwist: PlotTwist | null;
  plotTwistTimer: number;
  exerciseCharges: number;
  rationCharges: number;
  onExercise: () => void;
  onRations: () => void;
}

// Animated particle for side panels
const MetricParticle: React.FC<{
  color: string;
  delay: number;
}> = ({ color, delay }) => {
  const anim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [anim, delay]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: [0, 0.8, 0.5, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: color,
        transform: [{ translateY }],
        opacity,
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 4,
      }}
    />
  );
};

// Enhanced metric panel with animations
const MetricPanel: React.FC<{
  icon: string;
  label: string;
  value: number;
  color: string;
  criticalColor: string;
}> = ({ icon, label, value, color, criticalColor }) => {
  const isCritical = value <= 20;
  const isWarning = value > 20 && value <= 35;
  const barColor = isCritical ? criticalColor : isWarning ? '#f59e0b' : color;
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;
  const prevValue = useRef(value);
  
  useEffect(() => {
    if (isCritical) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 300, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isCritical, pulseAnim]);

  useEffect(() => {
    // Increase opacity when value changes significantly or is critical
    const diff = Math.abs(value - prevValue.current);
    if (isCritical || diff >= 5) {
      Animated.sequence([
        Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(opacityAnim, { toValue: isCritical ? 1 : 0.6, duration: 1000, useNativeDriver: true }),
      ]).start();
    }
    prevValue.current = value;
  }, [value, isCritical]);

  useEffect(() => {
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    );
    glow.start();
    return () => glow.stop();
  }, []);
  
  return (
    <Animated.View 
      style={{ 
        alignItems: 'center', 
        marginBottom: 16,
        transform: [{ scale: pulseAnim }],
        opacity: opacityAnim,
      }}
    >
      {/* Icon with glow */}
      <View style={{ position: 'relative' }}>
        <Animated.View
          style={{
            position: 'absolute',
            top: -4,
            left: -4,
            right: -4,
            bottom: -4,
            borderRadius: 12,
            backgroundColor: barColor,
            opacity: glowAnim,
          }}
        />
        <Text style={{ fontSize: 22 }}>{icon}</Text>
      </View>
      
      {/* Value */}
      <Text 
        style={{ 
          fontSize: 14, 
          fontWeight: 'bold',
          color: barColor,
          marginTop: 4,
          textShadowColor: barColor,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: isCritical ? 8 : 4,
        }}
      >
        {Math.round(value)}%
      </Text>
      
      {/* Bar container */}
      <View 
        style={{ 
          width: 28, 
          height: 80, 
          borderRadius: 14,
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderWidth: 2,
          borderColor: barColor,
          marginTop: 4,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Particles */}
        {[...Array(3)].map((_, i) => (
          <View key={i} style={{ position: 'absolute', left: 8 + i * 4, bottom: `${value}%` }}>
            <MetricParticle color={barColor} delay={i * 400} />
          </View>
        ))}
        
        {/* Fill */}
        <View 
          style={{ 
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${value}%`,
            backgroundColor: barColor,
            borderRadius: 12,
            shadowColor: barColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: isCritical ? 1 : 0.6,
            shadowRadius: isCritical ? 12 : 6,
          }}
        >
          {/* Shine effect */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 2,
              width: 4,
              height: '100%',
              backgroundColor: 'rgba(255,255,255,0.3)',
              borderRadius: 2,
            }}
          />
        </View>
      </View>
      
      {/* Label */}
      <Text style={{ color: '#9ca3af', fontSize: 9, marginTop: 6, fontWeight: 'bold' }}>
        {label}
      </Text>
    </Animated.View>
  );
};

export { SIDE_PANEL_WIDTH };

// Top Header Component - Kingdom themed with day progression
const LifeModeHeaderComponent: React.FC<{
  score: number;
  timer: number;
  timePhase: TimePhase;
  comboCount: number;
  comboTitle?: string;
  morningCondition: MorningCondition;
  activePlotTwist: PlotTwist | null;
  plotTwistTimer: number;
  isPaused?: boolean;
  onPause?: () => void;
  savedFoods?: SavedFoodSlot[];
  onConsumeSaved?: (index: number) => void;
}> = React.memo(({ score, timer, timePhase, comboCount, comboTitle, morningCondition, activePlotTwist, plotTwistTimer, isPaused, onPause, savedFoods, onConsumeSaved }) => {
  const phaseConfig = TIME_PHASES[timePhase];
  const conditionConfig = MORNING_CONDITIONS.find(c => c.id === morningCondition);
  const isLowTime = timer <= 10;
  
  const timerShakeAnim = useRef(new Animated.Value(0)).current;
  const scoreFlashAnim = useRef(new Animated.Value(1)).current;
  const comboGlowAnim = useRef(new Animated.Value(0.5)).current;
  
  // Get time-based theme colors
  const getTimeTheme = () => {
    switch (timePhase) {
      case 'morning': return { bg: '#fef3c7', accent: '#f59e0b', icon: '🌅', label: 'DAWN' };
      case 'midday': return { bg: '#7dd3fc', accent: '#0ea5e9', icon: '☀️', label: 'NOON' };
      case 'afternoon': return { bg: '#fdba74', accent: '#f97316', icon: '🌆', label: 'DUSK' };
      case 'evening': return { bg: '#312e81', accent: '#6366f1', icon: '🌙', label: 'NIGHT' };
    }
  };
  const timeTheme = getTimeTheme();
  
  useEffect(() => {
    if (isLowTime) {
      const shake = Animated.loop(
        Animated.sequence([
          Animated.timing(timerShakeAnim, { toValue: 2, duration: 50, useNativeDriver: true }),
          Animated.timing(timerShakeAnim, { toValue: -2, duration: 50, useNativeDriver: true }),
          Animated.timing(timerShakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ])
      );
      shake.start();
      return () => shake.stop();
    }
  }, [isLowTime]);

  useEffect(() => {
    if (comboCount > 0) {
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(comboGlowAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(comboGlowAnim, { toValue: 0.5, duration: 400, useNativeDriver: true }),
        ])
      );
      glow.start();
      return () => glow.stop();
    }
  }, [comboCount]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate day progress (0-100%)
  const dayProgress = ((60 - timer) / 60) * 100;
  
  return (
    <View 
      style={{
        backgroundColor: 'rgba(0,0,0,0.95)',
        borderBottomWidth: 3,
        borderBottomColor: timeTheme.accent,
        shadowColor: timeTheme.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
      }}
    >
      {/* Day Progress Bar */}
      <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.1)' }}>
        <View 
          style={{ 
            height: '100%', 
            width: `${dayProgress}%`, 
            backgroundColor: timeTheme.accent,
            borderRadius: 2,
          }} 
        />
        {/* Time phase markers */}
        <View style={{ position: 'absolute', left: '25%', top: -2, width: 2, height: 8, backgroundColor: '#fbbf24' }} />
        <View style={{ position: 'absolute', left: '50%', top: -2, width: 2, height: 8, backgroundColor: '#0ea5e9' }} />
        <View style={{ position: 'absolute', left: '75%', top: -2, width: 2, height: 8, backgroundColor: '#f97316' }} />
      </View>
      
      {/* Decorative top border */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}>
        <View style={{ flex: 1, height: 2, backgroundColor: timeTheme.accent, marginHorizontal: 8, borderRadius: 1 }} />
        <Text style={{ fontSize: 14 }}>{timeTheme.icon}</Text>
        <Text style={{ color: timeTheme.accent, fontSize: 10, fontWeight: 'bold', marginLeft: 4 }}>{timeTheme.label}</Text>
        <View style={{ flex: 1, height: 2, backgroundColor: timeTheme.accent, marginHorizontal: 8, borderRadius: 1 }} />
      </View>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }}>
        {/* Score - Kingdom Glory */}
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fbbf24', fontSize: 10, fontWeight: 'bold' }}>🏰 KINGDOM GLORY</Text>
          <Animated.Text 
            style={{ 
              color: '#fbbf24', 
              fontSize: 18, 
              fontWeight: 'bold',
              textShadowColor: '#fbbf24',
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 8,
              transform: [{ scale: scoreFlashAnim }],
            }}
          >
            {score.toLocaleString()}
          </Animated.Text>
        </View>
        
        {/* Time Phase & Timer - Kingdom Day Cycle */}
        <View style={{ alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {onPause && !isPaused && (
              <TouchableOpacity
                onPress={onPause}
                style={{ 
                  paddingHorizontal: 8, 
                  paddingVertical: 4, 
                  marginRight: 8, 
                  borderRadius: 8,
                  backgroundColor: `${timeTheme.accent}30`,
                  borderWidth: 1,
                  borderColor: timeTheme.accent,
                }}
              >
                <Text style={{ color: 'white', fontSize: 12 }}>⏸️</Text>
              </TouchableOpacity>
            )}
            <Text style={{ fontSize: 16 }}>{phaseConfig.icon}</Text>
            <Text style={{ color: timeTheme.accent, fontSize: 11, fontWeight: 'bold', marginLeft: 4 }}>{phaseConfig.name.toUpperCase()}</Text>
          </View>
          <Animated.View
            style={{
              backgroundColor: isLowTime ? 'rgba(239,68,68,0.3)' : `${timeTheme.accent}30`,
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
              marginTop: 4,
              borderWidth: 2,
              borderColor: isLowTime ? '#ef4444' : timeTheme.accent,
              transform: [{ translateX: timerShakeAnim }],
            }}
          >
            <Text 
              style={{ 
                fontSize: 20, 
                fontWeight: 'bold',
                color: isLowTime ? '#ef4444' : 'white',
                textShadowColor: isLowTime ? '#ef4444' : timeTheme.accent,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: isLowTime ? 10 : 4,
              }}
            >
              {isLowTime ? '⏰ ' : '⌛ '}{formatTime(timer)}
            </Text>
          </Animated.View>
        </View>
        
        {/* Combo / Condition - Defender Status + Royal Pantry */}
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          {comboCount > 0 ? (
            <Animated.View style={{ alignItems: 'flex-end', opacity: comboGlowAnim }}>
              <Text style={{ 
                color: '#fbbf24', 
                fontSize: 20, 
                fontWeight: 'bold',
                textShadowColor: '#fbbf24',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 10,
              }}>
                ⚔️{comboCount}x
              </Text>
              {comboTitle && (
                <Text style={{ color: '#c084fc', fontSize: 10, fontWeight: 'bold' }}>{comboTitle}</Text>
              )}
            </Animated.View>
          ) : savedFoods && onConsumeSaved ? (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: '#fbbf24', fontSize: 9, fontWeight: 'bold', marginBottom: 4 }}>
                🏺 PANTRY
              </Text>
              <View style={{ flexDirection: 'row' }}>
                {savedFoods.map((slot, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => slot.food && onConsumeSaved(index)}
                    disabled={!slot.food}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: slot.food ? 'rgba(251, 191, 36, 0.3)' : 'rgba(75, 85, 99, 0.3)',
                      borderWidth: 1.5,
                      borderColor: slot.food ? '#fbbf24' : '#4b5563',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: 3,
                    }}
                  >
                    {slot.food ? (
                      <Text style={{ fontSize: 18 }}>{slot.food.sprite}</Text>
                    ) : (
                      <Text style={{ fontSize: 12, color: '#6b7280' }}>🍽️</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 14 }}>{conditionConfig?.icon}</Text>
              <Text style={{ color: '#9ca3af', fontSize: 10, marginLeft: 4 }}>{conditionConfig?.name}</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Plot Twist Banner */}
      {activePlotTwist && (
        <View 
          style={{
            marginHorizontal: 8,
            marginBottom: 6,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(168, 85, 247, 0.4)',
            borderWidth: 2,
            borderColor: '#a855f7',
            shadowColor: '#a855f7',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
          }}
        >
          <Text style={{ fontSize: 14 }}>🎭</Text>
          <Text style={{ color: '#e9d5ff', fontSize: 12, fontWeight: 'bold', marginLeft: 6 }}>{activePlotTwist.name}</Text>
          <View 
            style={{ 
              marginLeft: 8, 
              paddingHorizontal: 8, 
              paddingVertical: 2, 
              borderRadius: 10,
              backgroundColor: 'rgba(168, 85, 247, 0.6)',
            }}
          >
            <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>{plotTwistTimer}s</Text>
          </View>
        </View>
      )}
    </View>
  );
});

LifeModeHeaderComponent.displayName = 'LifeModeHeader';
export const LifeModeHeader = LifeModeHeaderComponent;
const LeftSidePanelComponent: React.FC<{
  metrics: BodyMetrics;
}> = React.memo(({ metrics }) => {
  const { height: screenHeight } = useWindowDimensions();
  return (
    <View 
      style={{ 
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: SIDE_PANEL_WIDTH,
        backgroundColor: 'rgba(10,10,18,0.95)',
        borderRightWidth: 3,
        borderRightColor: '#9333ea',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        shadowColor: '#9333ea',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      }}
    >
      {/* Decorative top ornament */}
      <View style={{ position: 'absolute', top: 60, alignItems: 'center' }}>
        <Text style={{ color: '#9333ea', fontSize: 14 }}>⚜️</Text>
        <View style={{ width: 2, height: 20, backgroundColor: '#9333ea', marginTop: 4, borderRadius: 1 }} />
      </View>
      
      <MetricPanel
        icon="⚡"
        label={METRIC_LABELS.energy}
        value={metrics.energy}
        color="#facc15"
        criticalColor="#ef4444"
      />
      <MetricPanel
        icon="💧"
        label={METRIC_LABELS.hydration}
        value={metrics.hydration}
        color="#38bdf8"
        criticalColor="#ef4444"
      />
      
      {/* Decorative bottom ornament */}
      <View style={{ position: 'absolute', bottom: 60, alignItems: 'center' }}>
        <View style={{ width: 2, height: 20, backgroundColor: '#9333ea', marginBottom: 4, borderRadius: 1 }} />
        <Text style={{ color: '#9333ea', fontSize: 14 }}>⚜️</Text>
      </View>
    </View>
  );
});

LeftSidePanelComponent.displayName = 'LeftSidePanel';
export const LeftSidePanel = LeftSidePanelComponent;
const RightSidePanelComponent: React.FC<{
  metrics: BodyMetrics;
}> = React.memo(({ metrics }) => {
  const { height: screenHeight } = useWindowDimensions();
  return (
    <View 
      style={{ 
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: SIDE_PANEL_WIDTH,
        backgroundColor: 'rgba(10,10,18,0.95)',
        borderLeftWidth: 3,
        borderLeftColor: '#9333ea',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        shadowColor: '#9333ea',
        shadowOffset: { width: -4, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      }}
    >
      {/* Decorative top ornament */}
      <View style={{ position: 'absolute', top: 60, alignItems: 'center' }}>
        <Text style={{ color: '#9333ea', fontSize: 14 }}>⚜️</Text>
        <View style={{ width: 2, height: 20, backgroundColor: '#9333ea', marginTop: 4, borderRadius: 1 }} />
      </View>
      
      <MetricPanel
        icon="🥗"
        label={METRIC_LABELS.nutrition}
        value={metrics.nutrition}
        color="#4ade80"
        criticalColor="#ef4444"
      />
      <MetricPanel
        icon="💓"
        label={METRIC_LABELS.stability}
        value={metrics.stability}
        color="#f472b6"
        criticalColor="#ef4444"
      />
      
      {/* Decorative bottom ornament */}
      <View style={{ position: 'absolute', bottom: 60, alignItems: 'center' }}>
        <View style={{ width: 2, height: 20, backgroundColor: '#9333ea', marginBottom: 4, borderRadius: 1 }} />
        <Text style={{ color: '#9333ea', fontSize: 14 }}>⚜️</Text>
      </View>
    </View>
  );
});

RightSidePanelComponent.displayName = 'RightSidePanel';
export const RightSidePanel = RightSidePanelComponent;
export const SideMetrics: React.FC<{
  metrics: BodyMetrics;
  side: 'left' | 'right';
}> = ({ metrics, side }) => {
  if (side === 'left') {
    return <LeftSidePanel metrics={metrics} />;
  }
  return <RightSidePanel metrics={metrics} />;
};

// Bottom Footer Component - Kingdom themed with royal actions
export const LifeModeFooter: React.FC<{
  exerciseCharges: number;
  rationCharges: number;
  onExercise: () => void;
  onRations: () => void;
  morningCondition?: MorningCondition;
  announcement?: string | null;
  announcementType?: 'info' | 'success' | 'warning' | 'error' | 'plot_twist' | 'joke' | 'fact' | 'special_mode' | 'reflection';
}> = ({ exerciseCharges, rationCharges, onExercise, onRations, morningCondition, announcement, announcementType }) => {
  const conditionConfig = MORNING_CONDITIONS.find(c => c.id === morningCondition);
  const exerciseGlowAnim = useRef(new Animated.Value(0.3)).current;
  const rationsGlowAnim = useRef(new Animated.Value(0.3)).current;
  
  useEffect(() => {
    if (exerciseCharges > 0) {
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(exerciseGlowAnim, { toValue: 0.7, duration: 800, useNativeDriver: true }),
          Animated.timing(exerciseGlowAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ])
      );
      glow.start();
      return () => glow.stop();
    }
  }, [exerciseCharges]);

  useEffect(() => {
    if (rationCharges > 0) {
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(rationsGlowAnim, { toValue: 0.7, duration: 800, useNativeDriver: true }),
          Animated.timing(rationsGlowAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ])
      );
      glow.start();
      return () => glow.stop();
    }
  }, [rationCharges]);
  
  const getAnnouncementStyle = () => {
    switch (announcementType) {
      case 'success': return { bg: '#22c55e', border: '#4ade80', icon: '✅' };
      case 'warning': return { bg: '#f59e0b', border: '#fbbf24', icon: '⚠️' };
      case 'error': return { bg: '#ef4444', border: '#f87171', icon: '❌' };
      case 'plot_twist': return { bg: '#a855f7', border: '#c084fc', icon: '🎭' };
      case 'reflection': return { bg: '#06b6d4', border: '#22d3ee', icon: '💡' };
      case 'joke': return { bg: '#a78bfa', border: '#c4b5fd', icon: '😄' };
      case 'fact': return { bg: '#3b82f6', border: '#93c5fd', icon: '📚' };
      case 'special_mode': return { bg: '#ec4899', border: '#f472b6', icon: '✨' };
      default: return { bg: '#38bdf8', border: '#7dd3fc', icon: '📢' };
    }
  };
  
  return (
    <View 
      style={{
        backgroundColor: 'rgba(10,10,18,0.95)',
        borderTopWidth: 3,
        borderTopColor: '#9333ea',
        shadowColor: '#9333ea',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
      }}
    >
      {/* Decorative top border - Kingdom themed */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}>
        <View style={{ flex: 1, height: 2, backgroundColor: '#fbbf24', marginHorizontal: 8, borderRadius: 1 }} />
        <Text style={{ fontSize: 12 }}>🏰</Text>
        <Text style={{ color: '#fbbf24', fontSize: 10, fontWeight: 'bold', marginHorizontal: 4 }}>ROYAL ACTIONS</Text>
        <Text style={{ fontSize: 12 }}>🏰</Text>
        <View style={{ flex: 1, height: 2, backgroundColor: '#fbbf24', marginHorizontal: 8, borderRadius: 1 }} />
      </View>
      
      {/* Announcement/Condition Banner */}
      <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(251,191,36,0.3)' }}>
        {announcement ? (
          <View 
            style={{ 
              paddingHorizontal: 16, 
              paddingVertical: 8, 
              borderRadius: 12,
              backgroundColor: `${getAnnouncementStyle().bg}30`,
              borderWidth: 2,
              borderColor: getAnnouncementStyle().border,
              shadowColor: getAnnouncementStyle().border,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 8,
            }}
          >
            <Text 
              style={{ 
                textAlign: 'center', 
                fontSize: 12, 
                fontWeight: 'bold',
                color: getAnnouncementStyle().border,
              }}
            >
              {getAnnouncementStyle().icon} {announcement}
            </Text>
          </View>
        ) : conditionConfig ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 16, marginRight: 6 }}>{conditionConfig.icon}</Text>
            <Text style={{ color: '#fbbf24', fontSize: 11, fontWeight: 'bold' }}>{conditionConfig.name.toUpperCase()}</Text>
            <Text style={{ color: '#6b7280', fontSize: 10, marginLeft: 8 }}>• Royal Decree</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fbbf24', fontSize: 11 }}>🛡️ DEFEND THE REALM 🛡️</Text>
          </View>
        )}
      </View>
      
      {/* Power-up Buttons - Kingdom themed */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 }}>
        {/* Exercise Power-up - Train the Knights */}
        <TouchableOpacity
          onPress={onExercise}
          disabled={exerciseCharges <= 0}
          style={{
            flex: 1,
            marginRight: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: exerciseCharges > 0 ? 'rgba(34,197,94,0.2)' : 'rgba(75,85,99,0.2)',
            borderWidth: 2,
            borderColor: exerciseCharges > 0 ? '#22c55e' : '#4b5563',
            shadowColor: exerciseCharges > 0 ? '#22c55e' : 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
          }}
        >
          <Text style={{ fontSize: 18, marginRight: 6 }}>🏋️</Text>
          <View>
            <Text style={{ fontWeight: 'bold', fontSize: 12, color: exerciseCharges > 0 ? '#86efac' : '#6b7280' }}>
              TRAIN KNIGHTS
            </Text>
            <Text style={{ fontSize: 9, color: exerciseCharges > 0 ? '#4ade80' : '#4b5563' }}>
              -50 Stability
            </Text>
          </View>
          <View 
            style={{ 
              marginLeft: 8, 
              flexDirection: 'row',
              backgroundColor: exerciseCharges > 0 ? 'rgba(34,197,94,0.3)' : 'rgba(75,85,99,0.3)',
              paddingHorizontal: 6,
              paddingVertical: 4,
              borderRadius: 8,
            }}
          >
            {[...Array(3)].map((_, i) => (
              <View 
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  marginHorizontal: 2,
                  backgroundColor: i < exerciseCharges ? '#22c55e' : '#374151',
                  shadowColor: i < exerciseCharges ? '#22c55e' : 'transparent',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 1,
                  shadowRadius: 4,
                }}
              />
            ))}
          </View>
        </TouchableOpacity>
        
        {/* Rations Power-up - Royal Feast */}
        <TouchableOpacity
          onPress={onRations}
          disabled={rationCharges <= 0}
          style={{
            flex: 1,
            marginLeft: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: rationCharges > 0 ? 'rgba(251,191,36,0.2)' : 'rgba(75,85,99,0.2)',
            borderWidth: 2,
            borderColor: rationCharges > 0 ? '#fbbf24' : '#4b5563',
            shadowColor: rationCharges > 0 ? '#fbbf24' : 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
          }}
        >
          <Text style={{ fontSize: 18, marginRight: 6 }}>🍖</Text>
          <View>
            <Text style={{ fontWeight: 'bold', fontSize: 12, color: rationCharges > 0 ? '#fde68a' : '#6b7280' }}>
              ROYAL FEAST
            </Text>
            <Text style={{ fontSize: 9, color: rationCharges > 0 ? '#fbbf24' : '#4b5563' }}>
              +25 Stability
            </Text>
          </View>
          <View 
            style={{ 
              marginLeft: 8, 
              flexDirection: 'row',
              backgroundColor: rationCharges > 0 ? 'rgba(251,191,36,0.3)' : 'rgba(75,85,99,0.3)',
              paddingHorizontal: 6,
              paddingVertical: 4,
              borderRadius: 8,
            }}
          >
            {[...Array(3)].map((_, i) => (
              <View 
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  marginHorizontal: 2,
                  backgroundColor: i < rationCharges ? '#fbbf24' : '#374151',
                  shadowColor: i < rationCharges ? '#fbbf24' : 'transparent',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 1,
                  shadowRadius: 4,
                }}
              />
            ))}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Legacy export for backwards compatibility
export const LifeModeHUD: React.FC<LifeModeHUDProps> = (props) => {
  return <LifeModeHeader {...props} />;
};

// Pause Overlay for Life Mode - Kingdom themed
export const LifeModePauseOverlay: React.FC<{
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
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isPaused]);
  
  if (!isPaused) return null;
  
  return (
    <Animated.View 
      style={{ 
        position: 'absolute',
        top: -100,
        left: 0,
        width: screenWidth,
        height: screenHeight + 200,
        backgroundColor: 'rgba(0,0,0,0.9)',
        zIndex: 1000,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: fadeAnim,
      }}
    >
      <Animated.View 
        style={{
          backgroundColor: 'rgba(10,10,18,0.98)',
          padding: 24,
          borderRadius: 20,
          borderWidth: 3,
          borderColor: '#fbbf24',
          alignItems: 'center',
          shadowColor: '#fbbf24',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 30,
          transform: [{ scale: scaleAnim }],
        }}
      >
        {/* Decorative top - Kingdom themed */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 16 }}>🏰</Text>
          <View style={{ width: 40, height: 2, backgroundColor: '#fbbf24', marginHorizontal: 8 }} />
          <Text style={{ fontSize: 36 }}>⏸️</Text>
          <View style={{ width: 40, height: 2, backgroundColor: '#fbbf24', marginHorizontal: 8 }} />
          <Text style={{ fontSize: 16 }}>🏰</Text>
        </View>
        
        <Text style={{ 
          color: '#fbbf24', 
          fontSize: 28, 
          fontWeight: 'bold', 
          marginBottom: 8,
          textShadowColor: '#fbbf24',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 10,
        }}>
          KINGDOM RESTS
        </Text>
        <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 20 }}>
          The realm awaits your command, my liege...
        </Text>
        
        <TouchableOpacity
          onPress={onResume}
          style={{
            backgroundColor: 'rgba(34,197,94,0.3)',
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderRadius: 14,
            marginBottom: 12,
            width: 200,
            borderWidth: 2,
            borderColor: '#22c55e',
            shadowColor: '#22c55e',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 10,
          }}
        >
          <Text style={{ color: '#86efac', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>⚔️ CONTINUE BATTLE</Text>
        </TouchableOpacity>
        
        {/* Control Mode Toggle */}
        {onToggleControlMode && (
          <TouchableOpacity
            onPress={onToggleControlMode}
            style={{
              backgroundColor: 'rgba(59,130,246,0.2)',
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderRadius: 14,
              marginBottom: 12,
              width: 200,
              borderWidth: 2,
              borderColor: '#3b82f6',
              shadowColor: '#3b82f6',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 10,
            }}
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
        
        <TouchableOpacity
          onPress={onRestart}
          style={{ 
            backgroundColor: 'rgba(251,191,36,0.3)',
            paddingHorizontal: 24, 
            paddingVertical: 14, 
            borderRadius: 14, 
            marginBottom: 12,
            width: 200,
            borderWidth: 2,
            borderColor: '#fbbf24',
            shadowColor: '#fbbf24',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 10,
          }}
        >
          <Text style={{ color: '#fde68a', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>🔄 NEW DAY</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={onExit}
          style={{ 
            backgroundColor: 'rgba(107,114,128,0.3)',
            paddingHorizontal: 24, 
            paddingVertical: 14, 
            borderRadius: 14, 
            width: 200,
            borderWidth: 2,
            borderColor: '#6b7280',
            shadowColor: '#6b7280',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 10,
          }}
        >
          <Text style={{ color: '#9ca3af', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>🚪 LEAVE KINGDOM</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

// Saved Foods Panel - Kingdom Pantry
export const SavedFoodsPanel: React.FC<{
  savedFoods: SavedFoodSlot[];
  onConsumeSaved: (index: number) => void;
}> = ({ savedFoods, onConsumeSaved }) => {
  const { width: screenWidth } = useWindowDimensions();
  return (
    <View
      style={{
        position: 'absolute',
        top: 80,
        left: screenWidth / 2 - 140,
        width: 280,
        backgroundColor: 'rgba(10,10,18,0.95)',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#fbbf24',
        padding: 8,
        zIndex: 100,
        shadowColor: '#fbbf24',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
      }}
    >
      <Text style={{ color: '#fbbf24', fontSize: 10, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 }}>
        🏺 ROYAL PANTRY
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        {savedFoods.map((slot, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => slot.food && onConsumeSaved(index)}
            disabled={!slot.food}
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              backgroundColor: slot.food ? 'rgba(251, 191, 36, 0.3)' : 'rgba(75, 85, 99, 0.3)',
              borderWidth: 2,
              borderColor: slot.food ? '#fbbf24' : '#4b5563',
              alignItems: 'center',
              justifyContent: 'center',
              marginHorizontal: 4,
            }}
          >
            {slot.food ? (
              <Text style={{ fontSize: 24 }}>{slot.food.sprite}</Text>
            ) : (
              <Text style={{ fontSize: 16, color: '#6b7280' }}>🍽️</Text>
            )}
          </TouchableOpacity>
        ))}
        {/* Treasury Preview Slots */}
        {[...Array(2)].map((_, i) => (
          <View
            key={`treasury-${i}`}
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              backgroundColor: 'rgba(147, 51, 234, 0.15)',
              borderWidth: 1,
              borderColor: 'rgba(147, 51, 234, 0.4)',
              borderStyle: 'dashed',
              alignItems: 'center',
              justifyContent: 'center',
              marginHorizontal: 4,
              opacity: 0.6,
            }}
          >
            <Text style={{ fontSize: 18, opacity: 0.5 }}>💎</Text>
            <View style={{ position: 'absolute', bottom: -2, right: -2 }}>
              <Text style={{ fontSize: 10 }}>🔒</Text>
            </View>
          </View>
        ))}
      </View>
      <Text style={{ color: '#9ca3af', fontSize: 8, textAlign: 'center', marginTop: 6 }}>
        Tap to consume • <Text style={{ color: '#a78bfa' }}>Treasury Vault (Locked)</Text>
      </Text>
    </View>
  );
};

// Social Meter Display - Kingdom Allies
export const SocialMeterDisplay: React.FC<{
  socialStats: SocialStats;
}> = ({ socialStats }) => {
  const isHighSocial = socialStats.socialMeter >= 70;
  
  return (
    <View
      style={{
        position: 'absolute',
        top: 150,
        right: 90,
        backgroundColor: 'rgba(10,10,18,0.95)',
        borderRadius: 10,
        borderWidth: 2,
        borderColor: isHighSocial ? '#f59e0b' : '#6b7280',
        padding: 8,
        zIndex: 100,
        shadowColor: isHighSocial ? '#f59e0b' : 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
      }}
    >
      <Text style={{ color: '#fcd34d', fontSize: 10, fontWeight: 'bold', textAlign: 'center' }}>
        👑 ALLIES
      </Text>
      <View
        style={{
          width: 60,
          height: 8,
          backgroundColor: 'rgba(75, 85, 99, 0.5)',
          borderRadius: 4,
          marginTop: 4,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${socialStats.socialMeter}%`,
            height: '100%',
            backgroundColor: isHighSocial ? '#f59e0b' : '#fcd34d',
            borderRadius: 4,
          }}
        />
      </View>
      {socialStats.shareStreak > 1 && (
        <Text style={{ color: '#fbbf24', fontSize: 9, textAlign: 'center', marginTop: 2 }}>
          🤝 {socialStats.shareStreak}x gifts
        </Text>
      )}
    </View>
  );
};
