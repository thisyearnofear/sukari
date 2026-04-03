import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { StabilityZone, TimePhase } from '@/types/game';

// const { width, height } = Dimensions.get('window');

interface AnimatedBackgroundProps {
  zone: StabilityZone;
  comboCount: number;
  timer: number;
  timePhase?: TimePhase;
  gameMode?: 'classic' | 'life' | 'slowmo';
}

// Get time of day colors and atmosphere
const getTimeOfDayTheme = (timePhase: TimePhase) => {
  switch (timePhase) {
    case 'morning':
      return {
        skyGradient: ['#fef3c7', '#fde68a', '#fbbf24'],
        sunColor: '#fbbf24',
        sunGlow: 'rgba(251, 191, 36, 0.4)',
        cloudColor: 'rgba(255, 255, 255, 0.8)',
        castleColor: '#78716c',
        groundColor: '#84cc16',
        icon: '🌅',
        label: 'DAWN BREAKS',
      };
    case 'midday':
      return {
        skyGradient: ['#7dd3fc', '#38bdf8', '#0ea5e9'],
        sunColor: '#fef08a',
        sunGlow: 'rgba(254, 240, 138, 0.5)',
        cloudColor: 'rgba(255, 255, 255, 0.9)',
        castleColor: '#a8a29e',
        groundColor: '#22c55e',
        icon: '☀️',
        label: 'HIGH NOON',
      };
    case 'afternoon':
      return {
        skyGradient: ['#fdba74', '#fb923c', '#f97316'],
        sunColor: '#fb923c',
        sunGlow: 'rgba(251, 146, 60, 0.5)',
        cloudColor: 'rgba(255, 237, 213, 0.7)',
        castleColor: '#78716c',
        groundColor: '#65a30d',
        icon: '🌆',
        label: 'DUSK APPROACHES',
      };
    case 'evening':
      return {
        skyGradient: ['#1e1b4b', '#312e81', '#4338ca'],
        sunColor: '#c4b5fd',
        sunGlow: 'rgba(196, 181, 253, 0.3)',
        cloudColor: 'rgba(99, 102, 241, 0.4)',
        castleColor: '#44403c',
        groundColor: '#166534',
        icon: '🌙',
        label: 'NIGHT FALLS',
      };
  }
};

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  zone,
  comboCount,
  timer,
  timePhase = 'morning',
  gameMode = 'classic',
}) => {
  const { width, height } = useWindowDimensions();
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Continuous background animation
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    );

    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    );

    const waveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(waveAnim, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    );

    pulseLoop.start();
    rotateLoop.start();
    waveLoop.start();

    return () => {
      pulseLoop.stop();
      rotateLoop.stop();
      waveLoop.stop();
    };
  }, [pulseAnim, rotateAnim, waveAnim]);

  // Combo-triggered glow effect
  useEffect(() => {
    if (comboCount >= 3) {
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [comboCount, glowAnim]);

  // Scale pulse on low timer
  useEffect(() => {
    if (timer <= 10) {
      const scaleLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.02, duration: 500, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      scaleLoop.start();
      return () => scaleLoop.stop();
    }
  }, [timer, scaleAnim]);

  const getZoneColors = () => {
    switch (zone) {
      case 'balanced':
        return {
          primary: '#10b981',
          secondary: '#059669',
          bg: '#0f2027',
          accent: '#34d399',
        };
      case 'warning-low':
      case 'warning-high':
        return {
          primary: '#f59e0b',
          secondary: '#d97706',
          bg: '#1a1a0f',
          accent: '#fbbf24',
        };
      case 'critical-low':
        return {
          primary: '#06b6d4',
          secondary: '#0891b2',
          bg: '#0f1a2a',
          accent: '#22d3ee',
        };
      case 'critical-high':
        return {
          primary: '#ef4444',
          secondary: '#dc2626',
          bg: '#2a0f0f',
          accent: '#f87171',
        };
    }
  };

  const colors = getZoneColors();
  const timeTheme = getTimeOfDayTheme(timePhase);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.25],
  });

  const waveTranslate = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 30],
  });

  const comboGlow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  // For Life Mode, use kingdom-themed background
  if (gameMode === 'life') {
    return (
      <View style={[styles.container, { backgroundColor: timeTheme.skyGradient[2] }]}>
        {/* Sky gradient layers */}
        <View style={[styles.skyLayer, { backgroundColor: timeTheme.skyGradient[0], opacity: 0.3, top: 0, height: '30%' }]} />
        <View style={[styles.skyLayer, { backgroundColor: timeTheme.skyGradient[1], opacity: 0.4, top: '20%', height: '30%' }]} />
        
        {/* Sun/Moon */}
        <Animated.View
          style={[
            styles.celestialBody,
            {
              backgroundColor: timeTheme.sunColor,
              shadowColor: timeTheme.sunColor,
              shadowOpacity: 0.8,
              shadowRadius: 30,
              top: timePhase === 'evening' ? '15%' : '8%',
              right: timePhase === 'morning' ? '15%' : timePhase === 'evening' ? '20%' : '40%',
              transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }],
            },
          ]}
        >
          <Text style={{ fontSize: 32 }}>{timePhase === 'evening' ? '🌙' : '☀️'}</Text>
        </Animated.View>
        
        {/* Clouds */}
        {[...Array(4)].map((_, i) => (
          <Animated.View
            key={`cloud-${i}`}
            style={[
              styles.cloud,
              {
                top: 60 + i * 40,
                left: (i * 100) % width,
                opacity: timePhase === 'evening' ? 0.3 : 0.7,
                transform: [{
                  translateX: waveAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 20 + i * 5],
                  }),
                }],
              },
            ]}
          >
            <Text style={{ fontSize: 28 + i * 4 }}>☁️</Text>
          </Animated.View>
        ))}
        
        {/* Castle silhouette */}
        <View style={[styles.castleContainer]}>
          {/* Castle towers */}
          <View style={[styles.castleTower, { left: '20%', height: 120, backgroundColor: timeTheme.castleColor }]}>
            <View style={[styles.towerTop, { borderBottomColor: timeTheme.castleColor }]} />
            <Text style={styles.towerFlag}>🏴</Text>
          </View>
          <View style={[styles.castleTower, { left: '35%', height: 100, backgroundColor: timeTheme.castleColor }]} />
          <View style={[styles.castleMain, { backgroundColor: timeTheme.castleColor }]}>
            <View style={[styles.castleGate]}>
              <Text style={{ fontSize: 24 }}>🏰</Text>
            </View>
            {/* Castle windows */}
            {[...Array(4)].map((_, i) => (
              <View key={i} style={[styles.castleWindow, { left: 20 + i * 35 }]}>
                <Animated.View
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: timePhase === 'evening' ? '#fbbf24' : '#0f172a',
                    opacity: timePhase === 'evening' ? pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) : 0.8,
                  }}
                />
              </View>
            ))}
          </View>
          <View style={[styles.castleTower, { right: '35%', height: 100, backgroundColor: timeTheme.castleColor }]} />
          <View style={[styles.castleTower, { right: '20%', height: 120, backgroundColor: timeTheme.castleColor }]}>
            <View style={[styles.towerTop, { borderBottomColor: timeTheme.castleColor }]} />
            <Text style={styles.towerFlag}>🚩</Text>
          </View>
        </View>
        
        {/* Ground/grass */}
        <View style={[styles.ground, { backgroundColor: timeTheme.groundColor }]}>
          {/* Grass texture */}
          {[...Array(20)].map((_, i) => (
            <Text key={i} style={[styles.grassBlade, { left: i * (width / 20) }]}>🌿</Text>
          ))}
        </View>
        
        {/* Kingdom walls */}
        <View style={styles.wallContainer}>
          <View style={[styles.wall, { backgroundColor: '#78716c' }]} />
          {[...Array(8)].map((_, i) => (
            <View key={i} style={[styles.battlement, { left: i * 50, backgroundColor: '#78716c' }]} />
          ))}
        </View>
        
        {/* Weather effects based on stability zone */}
        {zone === 'critical-high' && (
          <>
            {/* Fire/heat effects */}
            {[...Array(6)].map((_, i) => (
              <Animated.View
                key={`ember-${i}`}
                style={[
                  styles.weatherParticle,
                  {
                    left: (i * 70) % width,
                    bottom: 100 + (i * 50),
                    opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.8] }),
                    transform: [{
                      translateY: waveAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -30] }),
                    }],
                  },
                ]}
              >
                <Text style={{ fontSize: 20 }}>🔥</Text>
              </Animated.View>
            ))}
            <Animated.View style={[styles.criticalOverlay, { backgroundColor: '#ef4444', opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.15] }) }]} />
          </>
        )}
        
        {zone === 'critical-low' && (
          <>
            {/* Ice/cold effects */}
            {[...Array(8)].map((_, i) => (
              <Animated.View
                key={`snow-${i}`}
                style={[
                  styles.weatherParticle,
                  {
                    left: (i * 50) % width,
                    top: 100 + (i * 30),
                    opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.9] }),
                    transform: [{
                      translateY: waveAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 40] }),
                    }],
                  },
                ]}
              >
                <Text style={{ fontSize: 16 }}>❄️</Text>
              </Animated.View>
            ))}
            <Animated.View style={[styles.criticalOverlay, { backgroundColor: '#06b6d4', opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.15] }) }]} />
          </>
        )}
        
        {(zone === 'warning-low' || zone === 'warning-high') && (
          <>
            {/* Storm clouds */}
            {[...Array(3)].map((_, i) => (
              <Animated.View
                key={`storm-${i}`}
                style={[
                  styles.stormCloud,
                  {
                    left: (i * 120) % width,
                    top: 40 + i * 20,
                    opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0.9] }),
                  },
                ]}
              >
                <Text style={{ fontSize: 40 }}>⛈️</Text>
              </Animated.View>
            ))}
          </>
        )}
        
        {/* Combo glow overlay */}
        {comboCount >= 3 && (
          <Animated.View style={[styles.comboGlow, { backgroundColor: '#fbbf24', opacity: comboGlow }]} />
        )}
        
        {/* Time of day indicator */}
        <View style={styles.timeIndicator}>
          <Text style={styles.timeIcon}>{timeTheme.icon}</Text>
          <Text style={styles.timeLabel}>{timeTheme.label}</Text>
        </View>
      </View>
    );
  }

  // Classic mode - original abstract background
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Base gradient layer */}
      <View 
        style={[
          styles.gradientLayer,
          { backgroundColor: colors.primary, opacity: 0.05 }
        ]} 
      />

      {/* Animated rotating pattern */}
      <Animated.View
        style={[
          styles.rotatingPattern,
          {
            transform: [
              { rotate: rotateInterpolate },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        {/* Concentric circles */}
        {[...Array(6)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.circle,
              {
                width: 100 + i * 80,
                height: 100 + i * 80,
                borderColor: colors.primary,
                opacity: pulseOpacity,
                borderWidth: i % 2 === 0 ? 1 : 2,
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Diagonal lines pattern */}
      <View style={styles.diagonalContainer}>
        {[...Array(12)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.diagonalLine,
              {
                left: i * 40 - 100,
                backgroundColor: colors.secondary,
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.03, 0.08],
                }),
                transform: [
                  { translateY: waveTranslate },
                ],
              },
            ]}
          />
        ))}
      </View>

      {/* Corner accents */}
      <Animated.View
        style={[
          styles.cornerAccent,
          styles.topLeft,
          {
            borderColor: colors.accent,
            opacity: pulseOpacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.cornerAccent,
          styles.topRight,
          {
            borderColor: colors.accent,
            opacity: pulseOpacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.cornerAccent,
          styles.bottomLeft,
          {
            borderColor: colors.accent,
            opacity: pulseOpacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.cornerAccent,
          styles.bottomRight,
          {
            borderColor: colors.accent,
            opacity: pulseOpacity,
          },
        ]}
      />

      {/* Combo glow overlay */}
      {comboCount >= 3 && (
        <Animated.View
          style={[
            styles.comboGlow,
            {
              backgroundColor: colors.accent,
              opacity: comboGlow,
            },
          ]}
        />
      )}

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              left: (i * 50) % width,
              top: (i * 100) % height,
              backgroundColor: colors.accent,
              opacity: pulseAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.1, 0.3, 0.1],
              }),
              transform: [
                {
                  translateY: waveAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, i % 2 === 0 ? -20 : 20],
                  }),
                },
              ],
            },
          ]}
        />
      ))}

      {/* Grid overlay */}
      <View style={styles.gridContainer}>
        {[...Array(10)].map((_, row) => (
          <View key={row} style={styles.gridRow}>
            {[...Array(8)].map((_, col) => (
              <View
                key={col}
                style={[
                  styles.gridCell,
                  {
                    borderColor: colors.primary,
                  },
                ]}
              />
            ))}
          </View>
        ))}
      </View>

      {/* Critical zone effects */}
      {zone === 'critical-high' && (
        <Animated.View
          style={[
            styles.criticalOverlay,
            {
              backgroundColor: '#ef4444',
              opacity: pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.05, 0.15],
              }),
            },
          ]}
        />
      )}
      {zone === 'critical-low' && (
        <Animated.View
          style={[
            styles.criticalOverlay,
            {
              backgroundColor: '#06b6d4',
              opacity: pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.05, 0.15],
              }),
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 0,
  },
  gradientLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  rotatingPattern: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    borderStyle: 'solid',
    marginLeft: -50,
    marginTop: -50,
  },
  diagonalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  diagonalLine: {
    position: 'absolute',
    width: 2,
    height: 1600,
    transform: [{ rotate: '45deg' }],
    top: -400,
  },
  cornerAccent: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderWidth: 2,
  },
  topLeft: {
    top: 100,
    left: 20,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 100,
    right: 20,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 140,
    left: 20,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 140,
    right: 20,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  comboGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.03,
  },
  gridRow: {
    flexDirection: 'row',
    flex: 1,
  },
  gridCell: {
    flex: 1,
    borderWidth: 0.5,
  },
  criticalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Life Mode Kingdom styles
  skyLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  celestialBody: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cloud: {
    position: 'absolute',
  },
  castleContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    height: 150,
    alignItems: 'center',
  },
  castleTower: {
    position: 'absolute',
    width: 40,
    bottom: 0,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  towerTop: {
    position: 'absolute',
    top: -15,
    left: -5,
    width: 0,
    height: 0,
    borderLeftWidth: 25,
    borderRightWidth: 25,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  towerFlag: {
    position: 'absolute',
    top: -30,
    left: 12,
    fontSize: 16,
  },
  castleMain: {
    position: 'absolute',
    bottom: 0,
    width: 180,
    height: 80,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  castleGate: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 50,
    backgroundColor: '#1f2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  castleWindow: {
    position: 'absolute',
    top: 15,
    width: 15,
    height: 20,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    overflow: 'hidden',
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  grassBlade: {
    position: 'absolute',
    bottom: 60,
    fontSize: 12,
  },
  wallContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    height: 30,
  },
  wall: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
  },
  battlement: {
    position: 'absolute',
    bottom: 20,
    width: 30,
    height: 15,
  },
  weatherParticle: {
    position: 'absolute',
  },
  stormCloud: {
    position: 'absolute',
  },
  timeIndicator: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  timeLabel: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
