import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, Dimensions, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StabilityZone } from '@/types/game';
import { COMBO_TIERS } from '@/constants/gameConfig';
import { COLORS } from '@/constants/designSystem';
import { useAccessibility } from '@/hooks/useAccessibility';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface BattleHUDProps {
  score: number;
  stability: number;
  timer: number;
  comboCount: number;
  exerciseCharges: number;
  rationCharges: number;
  announcement: string | null;
  announcementType: 'info' | 'success' | 'warning' | 'error' | 'plot_twist' | 'joke' | 'fact' | 'special_mode' | 'reflection';
  onExercise: () => void;
  onRations: () => void;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onRestart?: () => void;
  showComboCounter?: boolean;
  controlMode?: 'swipe' | 'tap';
  onToggleControlMode?: () => void;
}

const getStabilityZone = (stability: number): StabilityZone => {
  if (stability >= 40 && stability <= 60) return 'balanced';
  if (stability >= 25 && stability < 40) return 'warning-low';
  if (stability > 60 && stability <= 75) return 'warning-high';
  if (stability < 25) return 'critical-low';
  return 'critical-high';
};

const getStabilityColor = (zone: StabilityZone): string => {
  switch (zone) {
    case 'balanced': return COLORS.ZONES.balanced;
    case 'warning-low':
    case 'warning-high': return COLORS.ZONES.warningHigh;
    case 'critical-low': return COLORS.ZONES.criticalLow;
    case 'critical-high': return COLORS.ZONES.criticalHigh;
  }
};

const getZoneLabel = (zone: StabilityZone): string => {
  switch (zone) {
    case 'balanced': return '⚖️ BALANCED';
    case 'warning-low': return '❄️ LOW';
    case 'warning-high': return '🔥 HIGH';
    case 'critical-low': return '💀 CRITICAL';
    case 'critical-high': return '💀 CRITICAL';
  }
};

// Particle component for effects
const Particle: React.FC<{
  x: number;
  y: number;
  color: string;
  type: 'spark' | 'ember' | 'droplet' | 'star';
  delay?: number;
}> = ({ x, y, color, type, delay = 0 }) => {
  const anim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: type === 'ember' ? 2000 : 1500,
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
  }, [anim, delay, type]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, type === 'ember' ? -40 : -25],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: [0, 1, 1, 0],
  });

  const scale = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1.2, 0.3],
  });

  const getParticleContent = () => {
    switch (type) {
      case 'spark': return '⚡';
      case 'ember': return '🔥';
      case 'droplet': return '💧';
      case 'star': return '✨';
    }
  };

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: [{ translateY }, { scale }],
        opacity,
      }}
    >
      <Text style={{ fontSize: 10, color }}>{getParticleContent()}</Text>
    </Animated.View>
  );
};

// Animated border glow component
const AnimatedBorderGlow: React.FC<{
  color: string;
  intensity: 'low' | 'medium' | 'high';
}> = ({ color, intensity }) => {
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const duration = intensity === 'high' ? 500 : intensity === 'medium' ? 800 : 1200;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [glowAnim, intensity]);

  const opacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, intensity === 'high' ? 1 : 0.7],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: -3,
        left: -3,
        right: -3,
        bottom: -3,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: color,
        opacity,
      }}
    />
  );
};

// Electric arc effect
const ElectricArc: React.FC<{ color: string; active: boolean }> = ({ color, active }) => {
  const arcAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (active) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(arcAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(arcAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [active, arcAnim]);

  if (!active) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: arcAnim,
      }}
    >
      <View style={[styles.electricArc, { backgroundColor: color }]} />
    </Animated.View>
  );
};

const BattleHUDComponent: React.FC<BattleHUDProps> = React.memo(({
  score,
  stability,
  timer,
  comboCount,
  exerciseCharges,
  rationCharges,
  announcement,
  announcementType,
  onExercise,
  onRations,
  isPaused = false,
  onPause,
  onResume,
  onRestart,
  showComboCounter = true,
  controlMode = 'swipe',
  onToggleControlMode,
}) => {
  const { getButtonLabel } = useAccessibility();
  const zone = getStabilityZone(stability);
  const stabilityColor = getStabilityColor(zone);
  const isLowTimer = timer <= 10;
  const isCritical = zone === 'critical-low' || zone === 'critical-high';
  const insets = useSafeAreaInsets();

  // Animation refs
  const patternAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scoreFlashAnim = useRef(new Animated.Value(0)).current;
  const timerShakeAnim = useRef(new Animated.Value(0)).current;
  const borderFlowAnim = useRef(new Animated.Value(0)).current;
  
  // Track previous score for flash effect
  const prevScoreRef = useRef(score);
  
  // Score flash effect
  useEffect(() => {
    if (score !== prevScoreRef.current) {
      Animated.sequence([
        Animated.timing(scoreFlashAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scoreFlashAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      prevScoreRef.current = score;
    }
  }, [score, scoreFlashAnim]);

  // Continuous border flow animation
  useEffect(() => {
    if (!isPaused) {
      const animation = Animated.loop(
        Animated.timing(borderFlowAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isPaused, borderFlowAnim]);

  // Pattern animation
  useEffect(() => {
    if (!isPaused) {
      const patternAnimation = Animated.loop(
        Animated.timing(patternAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      patternAnimation.start();
      return () => patternAnimation.stop();
    }
  }, [isPaused, patternAnim]);

  // Pulse animation for critical zones
  useEffect(() => {
    if (isCritical && !isPaused) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [isCritical, isPaused, pulseAnim]);

  // Timer shake for low time
  useEffect(() => {
    if (isLowTimer && !isPaused) {
      const shakeAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(timerShakeAnim, {
            toValue: 3,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(timerShakeAnim, {
            toValue: -3,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(timerShakeAnim, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ])
      );
      shakeAnimation.start();
      return () => shakeAnimation.stop();
    }
  }, [isLowTimer, isPaused, timerShakeAnim]);

  const currentTier = [...COMBO_TIERS].reverse().find(t => comboCount >= t.count);

  const getAnnouncementStyle = () => {
    switch (announcementType) {
      case 'success': return { bg: '#16a34a', border: '#22c55e', icon: '✅' };
      case 'warning': return { bg: '#d97706', border: '#f59e0b', icon: '⚠️' };
      case 'error': return { bg: '#dc2626', border: '#ef4444', icon: '❌' };
      case 'plot_twist': return { bg: '#7c3aed', border: '#a78bfa', icon: '🎭' };
      default: return { bg: '#7c3aed', border: '#a78bfa', icon: '📢' };
    }
  };

  // Generate particles based on zone
  const renderParticles = () => {
    const particles = [];
    const particleType = zone === 'critical-high' ? 'ember' : 
                         zone === 'critical-low' ? 'droplet' : 
                         zone === 'balanced' ? 'star' : 'spark';
    
    for (let i = 0; i < 8; i++) {
      particles.push(
        <Particle
          key={i}
          x={20 + (i * 40)}
          y={-5}
          color={stabilityColor}
          type={particleType}
          delay={i * 200}
        />
      );
    }
    return particles;
  };

  const scoreScale = scoreFlashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════════════
          TOP HUD - MEDIEVAL FANTASY HEADER
          ═══════════════════════════════════════════════════════════════════════════ */}
      <View 
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          paddingTop: 44,
          paddingHorizontal: 8,
          zIndex: 50,
        }}
      >
        {/* Ornate frame container */}
        <Animated.View 
          style={[
            styles.topHudContainer,
            { 
              borderColor: stabilityColor,
              shadowColor: stabilityColor,
              transform: [{ scale: pulseAnim }],
            }
          ]}
        >
          {/* Animated border glow */}
          <AnimatedBorderGlow 
            color={stabilityColor} 
            intensity={isCritical ? 'high' : zone === 'balanced' ? 'low' : 'medium'} 
          />
          
          {/* Electric arcs for critical zones */}
          <ElectricArc color={stabilityColor} active={isCritical} />
          
          {/* Particle effects */}
          <View style={styles.particleContainer}>
            {renderParticles()}
          </View>

          {/* Corner ornaments */}
          <View style={[styles.cornerOrnament, styles.topLeft]}>
            <Text style={{ color: stabilityColor, fontSize: 16 }}>⚜️</Text>
          </View>
          <View style={[styles.cornerOrnament, styles.topRight]}>
            <Text style={{ color: stabilityColor, fontSize: 16 }}>⚜️</Text>
          </View>

          {/* Main content */}
          <View style={styles.topHudContent}>
            {/* Score section with crown */}
            <View style={styles.scoreSection}>
              <Text style={styles.crownIcon}>👑</Text>
              <Animated.View style={{ transform: [{ scale: scoreScale }] }}>
                <Text style={styles.scoreText}>{score.toLocaleString()}</Text>
              </Animated.View>
              <Text style={styles.scoreLabel}>GLORY</Text>
            </View>

            {/* Center - Timer with dramatic styling */}
            <View style={styles.timerSection}>
              <Animated.View 
                style={[
                  styles.timerContainer,
                  { 
                    borderColor: isLowTimer ? '#ef4444' : stabilityColor,
                    backgroundColor: isLowTimer ? 'rgba(239,68,68,0.3)' : 'rgba(0,0,0,0.6)',
                    transform: [{ translateX: timerShakeAnim }],
                  }
                ]}
              >
                <Text style={styles.timerIcon}>{isLowTimer ? '⏰' : '⌛'}</Text>
                <Text style={[
                  styles.timerText,
                  { color: isLowTimer ? '#ef4444' : '#fbbf24' }
                ]}>
                  {timer}
                </Text>
              </Animated.View>
              {isLowTimer && (
                <Text style={styles.urgentText}>FINAL WAVE!</Text>
              )}
            </View>

            {/* Control Mode & Pause buttons */}
            <View style={styles.pauseSection}>
              {onToggleControlMode && (
                <TouchableOpacity
                  onPress={onToggleControlMode}
                  style={styles.controlModeButton}
                  accessibilityLabel={`Switch to ${controlMode === 'swipe' ? 'tap' : 'swipe'} controls`}
                  accessibilityRole="button"
                >
                  <Text style={styles.controlModeIcon}>
                    {controlMode === 'swipe' ? '👆' : '🖱️'}
                  </Text>
                </TouchableOpacity>
              )}
              {onPause && !isPaused && (
                <TouchableOpacity
                  onPress={onPause}
                  style={styles.pauseButton}
                >
                  <Text style={styles.pauseIcon}>⏸️</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Stability meter - Epic styled */}
          <View style={styles.stabilitySection}>
            <View style={styles.stabilityLabelContainer}>
              <Text style={[styles.stabilityLabel, { color: stabilityColor }]}>
                {getZoneLabel(zone)}
              </Text>
            </View>
            
            <View style={[styles.stabilityBarOuter, { borderColor: stabilityColor }]}>
              {/* Zone color backgrounds */}
              <View style={styles.zoneBackgrounds}>
                <View style={[styles.zoneSegment, { flex: 25, backgroundColor: 'rgba(6,182,212,0.4)' }]} />
                <View style={[styles.zoneSegment, { flex: 15, backgroundColor: 'rgba(245,158,11,0.3)' }]} />
                <View style={[styles.zoneSegment, { flex: 20, backgroundColor: 'rgba(16,185,129,0.5)' }]} />
                <View style={[styles.zoneSegment, { flex: 15, backgroundColor: 'rgba(245,158,11,0.3)' }]} />
                <View style={[styles.zoneSegment, { flex: 25, backgroundColor: 'rgba(239,68,68,0.4)' }]} />
              </View>
              
              {/* Animated fill */}
              <Animated.View 
                style={[
                  styles.stabilityFill,
                  { 
                    width: `${Math.min(100, Math.max(0, stability))}%`,
                    backgroundColor: stabilityColor,
                  }
                ]}
              >
                {/* Animated shine */}
                <Animated.View 
                  style={[
                    styles.stabilityShine,
                    {
                      transform: [{
                        translateX: patternAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-50, 200],
                        })
                      }],
                    }
                  ]}
                />
              </Animated.View>
              
              {/* Indicator marker */}
              <View 
                style={[
                  styles.stabilityIndicator,
                  { left: `${Math.min(98, Math.max(2, stability))}%` }
                ]}
              />
            </View>
            
            <Text style={[styles.stabilityPercent, { color: stabilityColor }]}>
              {Math.round(stability)}%
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* ═══════════════════════════════════════════════════════════════════════════
          PAUSE OVERLAY
          ═══════════════════════════════════════════════════════════════════════════ */}
      {isPaused && (
        <View style={styles.pauseOverlay}>
          <View style={styles.pauseModal}>
            <View style={styles.pauseOrnament}>
              <Text style={{ fontSize: 40 }}>⚔️</Text>
            </View>
            <Text style={styles.pauseTitle}>BATTLE PAUSED</Text>
            <Text style={styles.pauseSubtitle}>The realm awaits your command...</Text>
            
            {/* Timer Display */}
            <View style={styles.pauseTimerContainer}>
              <Text style={styles.pauseTimerLabel}>TIME REMAINING</Text>
              <Text style={styles.pauseTimerValue}>{timer}s</Text>
            </View>
            
            <TouchableOpacity
              onPress={onResume}
              style={styles.resumeButton}
            >
              <Text style={styles.resumeButtonText}>▶️ RESUME BATTLE</Text>
            </TouchableOpacity>
           
            {/* Control Mode Toggle */}
            {onToggleControlMode && (
              <TouchableOpacity
                onPress={onToggleControlMode}
                style={styles.controlToggleButton}
              >
                <View style={styles.controlToggleContent}>
                  <Text style={styles.controlToggleIcon}>{controlMode === 'swipe' ? '👆👇' : '🖱️'}</Text>
                  <View style={styles.controlToggleInfo}>
                    <Text style={styles.controlToggleLabel}>CONTROL MODE</Text>
                    <Text style={styles.controlToggleValue}>{controlMode === 'swipe' ? 'SWIPE' : 'TAP'}</Text>
                  </View>
                  <Text style={styles.controlToggleSwitch}>🔄</Text>
                </View>
              </TouchableOpacity>
            )}
          
            <View style={styles.pauseButtonRow}>
              <TouchableOpacity
                onPress={onRestart}
                style={styles.restartButtonSmall}
              >
                <Text style={styles.restartButtonText}>🔄 RESTART</Text>
              </TouchableOpacity>
              
              {onPause && (
                <TouchableOpacity
                  onPress={onPause}
                  style={styles.exitButtonSmall}
                >
                  <Text style={styles.exitButtonText}>🚪 EXIT</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          COMBO INDICATOR - FLOATING BANNER
          ═══════════════════════════════════════════════════════════════════════════ */}
      {(showComboCounter !== false) && comboCount >= 3 && (
        <View style={styles.comboContainer}>
          <Animated.View 
            style={[
              styles.comboBanner,
              { 
                borderColor: currentTier?.color || '#fbbf24',
                shadowColor: currentTier?.color || '#fbbf24',
              }
            ]}
          >
            <Text style={styles.comboIcon}>⚡</Text>
            <Text style={[styles.comboCount, { color: currentTier?.color || '#fbbf24' }]}>
              {comboCount}x
            </Text>
            <Text style={[styles.comboTitle, { color: currentTier?.color || '#fbbf24' }]}>
              {currentTier?.title || 'COMBO'}
            </Text>
            <Text style={styles.comboIcon}>⚡</Text>
          </Animated.View>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          ANNOUNCEMENT BANNER
          ═══════════════════════════════════════════════════════════════════════════ */}
      {announcement && (
        <View style={styles.announcementContainer}>
          <View 
            style={[
              styles.announcementBanner,
              { 
                backgroundColor: getAnnouncementStyle().bg,
                borderColor: getAnnouncementStyle().border,
              }
            ]}
          >
            <Text style={styles.announcementIcon}>{getAnnouncementStyle().icon}</Text>
            <Text style={styles.announcementText}>{announcement}</Text>
          </View>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          BOTTOM HUD - MEDIEVAL POWER-UP BAR
          ═══════════════════════════════════════════════════════════════════════════ */}
      <View 
        style={[
          styles.bottomHudWrapper,
          { bottom: insets.bottom }
        ]}
      >
        <View style={styles.bottomHudContainer}>
          {/* Decorative top border with ornaments */}
          <View style={styles.bottomBorderDecoration}>
            <View style={[styles.borderLine, { backgroundColor: stabilityColor }]} />
            <View style={styles.centerOrnament}>
              <Text style={{ color: stabilityColor, fontSize: 20 }}>⚔️</Text>
            </View>
            <View style={[styles.borderLine, { backgroundColor: stabilityColor }]} />
          </View>

          {/* Status banner */}
          <View style={styles.statusBanner}>
            {announcement ? (
              <View 
                style={[
                  styles.statusContent,
                  { backgroundColor: getAnnouncementStyle().bg + '40' }
                ]}
              >
                <Text style={[styles.statusText, { color: getAnnouncementStyle().border }]}>
                  {getAnnouncementStyle().icon} {announcement}
                </Text>
              </View>
            ) : (
              <View style={styles.statusContent}>
                <Text style={styles.kingdomText}>⚔️ DEFEND THE REALM ⚔️</Text>
              </View>
            )}
          </View>

          {/* Power-up buttons */}
          <View style={styles.powerUpRow}>
            {/* Exercise Power-up */}
            <TouchableOpacity
              onPress={onExercise}
              disabled={exerciseCharges <= 0}
              accessible={true}
              accessibilityLabel={getButtonLabel('exercise', exerciseCharges)}
              accessibilityRole="button"
              accessibilityHint="Double tap to call exercise action"
              style={[
                styles.powerUpButton,
                exerciseCharges > 0 ? styles.powerUpActive : styles.powerUpDisabled,
                { borderColor: exerciseCharges > 0 ? '#3b82f6' : '#4b5563' }
              ]}
            >
              <View style={styles.powerUpIconContainer}>
                <Text style={styles.powerUpEmoji}>⚔️</Text>
                {exerciseCharges > 0 && (
                  <View style={[styles.powerUpGlow, { backgroundColor: '#3b82f6' }]} />
                )}
              </View>
              <View style={styles.powerUpInfo}>
                <Text style={[
                  styles.powerUpName,
                  { color: exerciseCharges > 0 ? '#93c5fd' : '#6b7280' }
                ]}>
                  EXERCISE
                </Text>
                <Text style={[
                  styles.powerUpDesc,
                  { color: exerciseCharges > 0 ? '#60a5fa' : '#4b5563' }
                ]}>
                  -50 Stability
                </Text>
              </View>
              <View style={[
                styles.chargeIndicator,
                { backgroundColor: exerciseCharges > 0 ? 'rgba(59,130,246,0.3)' : 'rgba(75,85,99,0.3)' }
              ]}>
                {[...Array(3)].map((_, i) => (
                  <View 
                    key={i}
                    style={[
                      styles.chargeDot,
                      { 
                        backgroundColor: i < exerciseCharges ? '#3b82f6' : '#374151',
                        shadowColor: i < exerciseCharges ? '#3b82f6' : 'transparent',
                      }
                    ]}
                  />
                ))}
              </View>
            </TouchableOpacity>

            {/* Rations Power-up */}
            <TouchableOpacity
              onPress={onRations}
              disabled={rationCharges <= 0}
              accessible={true}
              accessibilityLabel={getButtonLabel('rations', rationCharges)}
              accessibilityRole="button"
              accessibilityHint="Double tap to consume emergency rations"
              style={[
                styles.powerUpButton,
                rationCharges > 0 ? styles.powerUpActive : styles.powerUpDisabled,
                { borderColor: rationCharges > 0 ? '#fbbf24' : '#4b5563' }
              ]}
            >
              <View style={styles.powerUpIconContainer}>
                <Text style={styles.powerUpEmoji}>🍖</Text>
                {rationCharges > 0 && (
                  <View style={[styles.powerUpGlow, { backgroundColor: '#fbbf24' }]} />
                )}
              </View>
              <View style={styles.powerUpInfo}>
                <Text style={[
                  styles.powerUpName,
                  { color: rationCharges > 0 ? '#fde68a' : '#6b7280' }
                ]}>
                  RATIONS
                </Text>
                <Text style={[
                  styles.powerUpDesc,
                  { color: rationCharges > 0 ? '#fbbf24' : '#4b5563' }
                ]}>
                  +25 Stability
                </Text>
              </View>
              <View style={[
                styles.chargeIndicator,
                { backgroundColor: rationCharges > 0 ? 'rgba(251,191,36,0.3)' : 'rgba(75,85,99,0.3)' }
              ]}>
                {[...Array(3)].map((_, i) => (
                  <View 
                    key={i}
                    style={[
                      styles.chargeDot,
                      { 
                        backgroundColor: i < rationCharges ? '#fbbf24' : '#374151',
                        shadowColor: i < rationCharges ? '#fbbf24' : 'transparent',
                      }
                    ]}
                  />
                ))}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );
});

BattleHUDComponent.displayName = 'BattleHUD';
export const BattleHUD = BattleHUDComponent;

const styles = StyleSheet.create({
  // Top HUD styles
  topHudContainer: {
    backgroundColor: 'rgba(10,10,18,0.95)',
    borderRadius: 16,
    borderWidth: 3,
    padding: 12,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
    overflow: 'hidden',
  },
  particleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    overflow: 'visible',
  },
  cornerOrnament: {
    position: 'absolute',
    zIndex: 10,
  },
  topLeft: {
    top: -8,
    left: -8,
  },
  topRight: {
    top: -8,
    right: -8,
  },
  topHudContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  crownIcon: {
    fontSize: 18,
    marginRight: 4,
  },
  scoreText: {
    color: '#fbbf24',
    fontSize: 22,
    fontWeight: 'bold',
    textShadowColor: '#fbbf24',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  scoreLabel: {
    color: '#92400e',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  timerSection: {
    alignItems: 'center',
    flex: 1,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
  },
  timerIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  urgentText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
    textShadowColor: '#ef4444',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  pauseSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  pauseButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginLeft: 8,
  },
  pauseIcon: {
    fontSize: 18,
  },
  controlModeButton: {
    padding: 8,
    backgroundColor: 'rgba(59,130,246,0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.5)',
  },
  controlModeIcon: {
    fontSize: 16,
  },
  stabilitySection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stabilityLabelContainer: {
    width: 80,
  },
  stabilityLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  stabilityBarOuter: {
    flex: 1,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  zoneBackgrounds: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  zoneSegment: {
    height: '100%',
  },
  stabilityFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 7,
    overflow: 'hidden',
  },
  stabilityShine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 30,
    backgroundColor: 'rgba(255,255,255,0.4)',
    transform: [{ skewX: '-20deg' }],
  },
  stabilityIndicator: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    width: 4,
    backgroundColor: '#fff',
    borderRadius: 2,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  stabilityPercent: {
    width: 45,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  electricArc: {
    position: 'absolute',
    top: 0,
    left: '10%',
    right: '10%',
    height: 2,
    opacity: 0.8,
  },

  // Pause overlay styles
  pauseOverlay: {
    position: 'absolute',
    top: -100,
    left: 0,
    width: screenWidth,
    height: screenHeight + 200,
    backgroundColor: 'rgba(0,0,0,0.9)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseModal: {
    backgroundColor: 'rgba(20,20,30,0.98)',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#fbbf24',
    padding: 30,
    alignItems: 'center',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    minWidth: 280,
  },
  pauseOrnament: {
    marginBottom: 10,
  },
  pauseTitle: {
    color: '#fbbf24',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: '#fbbf24',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  pauseSubtitle: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  pauseTimerContainer: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#fbbf24',
    alignItems: 'center',
  },
  pauseTimerLabel: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pauseTimerValue: {
    color: '#fbbf24',
    fontSize: 28,
    fontWeight: 'bold',
  },
  pauseButtonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  restartButtonSmall: {
    flex: 1,
    backgroundColor: 'rgba(251,191,36,0.2)',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  exitButtonSmall: {
    flex: 1,
    backgroundColor: 'rgba(239,68,68,0.2)',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  exitButtonText: {
    color: '#fca5a5',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resumeButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#22c55e',
    marginBottom: 12,
    width: '100%',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  resumeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  restartButton: {
    backgroundColor: 'rgba(251,191,36,0.2)',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fbbf24',
    width: '100%',
  },
  restartButtonText: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  controlToggleButton: {
    backgroundColor: 'rgba(59,130,246,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
    marginBottom: 12,
    width: '100%',
  },
  controlToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlToggleIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  controlToggleInfo: {
    flex: 1,
  },
  controlToggleLabel: {
    color: '#93c5fd',
    fontSize: 10,
    fontWeight: 'bold',
  },
  controlToggleValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  controlToggleSwitch: {
    fontSize: 16,
    color: '#60a5fa',
  },

  // Combo styles
  comboContainer: {
    position: 'absolute',
    top: 140,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 40,
  },
  comboBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  comboIcon: {
    fontSize: 18,
  },
  comboCount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  comboTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },

  // Announcement styles
  announcementContainer: {
    position: 'absolute',
    top: 190,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 35,
  },
  announcementBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  announcementIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  announcementText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Bottom HUD styles
  bottomHudWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
  },
  bottomHudContainer: {
    backgroundColor: 'rgba(10,10,18,0.98)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  bottomBorderDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  borderLine: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  centerOrnament: {
    paddingHorizontal: 12,
  },
  statusBanner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusContent: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  kingdomText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: 'bold',
    textShadowColor: '#fbbf24',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  powerUpRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 10,
  },
  powerUpButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
  },
  powerUpActive: {
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  powerUpDisabled: {
    backgroundColor: 'rgba(30,30,40,0.6)',
    opacity: 0.6,
  },
  powerUpIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  powerUpEmoji: {
    fontSize: 24,
    zIndex: 1,
  },
  powerUpGlow: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    opacity: 0.3,
  },
  powerUpInfo: {
    flex: 1,
    marginLeft: 8,
  },
  powerUpName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  powerUpDesc: {
    fontSize: 10,
  },
  chargeIndicator: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: 8,
    gap: 4,
  },
  chargeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
  },
});
