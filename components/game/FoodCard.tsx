import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Animated, PanResponder, useWindowDimensions, TouchableOpacity } from 'react-native';
import { FoodUnit, ControlMode, SwipeDirection, SwipeAction } from '@/types/game';
import { SWIPE_THRESHOLD } from '@/constants/gameConfig';
import { useAccessibility } from '@/hooks/useAccessibility';

// const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

interface FoodCardProps {
  food: FoodUnit;
  onSwipe: (foodId: string, direction: SwipeDirection, action: SwipeAction) => void;
  controlMode: ControlMode;
  showOptimalHint?: boolean; // Show which direction is optimal
  gameMode?: 'classic' | 'life' | 'slowmo';
}

// Particle explosion component
const ExplosionParticle: React.FC<{
  x: number;
  y: number;
  color: string;
  type: 'spark' | 'ring' | 'star' | 'droplet' | 'ember';
  delay?: number;
  angle: number;
  distance: number;
}> = ({ x, y, color, type, delay = 0, angle, distance }) => {
  const anim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [anim, delay]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.cos(angle) * distance],
  });

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.sin(angle) * distance],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: [0, 1, 0.8, 0],
  });

  const scale = anim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.3, 1.5, 0.2],
  });

  const rotation = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${360 * (type === 'star' ? 2 : 1)}deg`],
  });

  const getParticleContent = () => {
    switch (type) {
      case 'spark': return '⚡';
      case 'ring': return '💫';
      case 'star': return '✨';
      case 'droplet': return '💧';
      case 'ember': return '🔥';
    }
  };

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: [
          { translateX },
          { translateY },
          { scale },
          { rotate: rotation },
        ],
        opacity,
      }}
    >
      <Text style={{ fontSize: 14, color }}>{getParticleContent()}</Text>
    </Animated.View>
  );
};

// Shockwave ring effect
const ShockwaveRing: React.FC<{
  color: string;
  delay?: number;
}> = ({ color, delay = 0 }) => {
  const anim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [anim, delay]);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 3],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.8, 0.5, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 3,
        borderColor: color,
        transform: [{ scale }],
        opacity,
        left: -30,
        top: -30,
      }}
    />
  );
};

// Trail effect for swipe - supports all 4 directions
const SwipeTrail: React.FC<{
  direction: SwipeDirection;
  color: string;
}> = ({ direction, color }) => {
  const anim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [anim]);

  const isVertical = direction === 'up' || direction === 'down';
  const isPositive = direction === 'down' || direction === 'right';
  
  const translateValue = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, isPositive ? 100 : -100],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 0.4, 0],
  });

  const scaleValue = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 3],
  });

  // Position based on direction
  const getPosition = () => {
    switch (direction) {
      case 'up': return { left: 22, top: -20 };
      case 'down': return { left: 22, top: 40 };
      case 'left': return { left: -20, top: 12 };
      case 'right': return { left: 60, top: 12 };
    }
  };

  const position = getPosition();

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: isVertical ? 20 : 40,
        height: isVertical ? 40 : 20,
        backgroundColor: color,
        borderRadius: 10,
        transform: isVertical 
          ? [{ translateY: translateValue }, { scaleY: scaleValue }]
          : [{ translateX: translateValue }, { scaleX: scaleValue }],
        opacity,
        ...position,
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
      }}
    />
  );
};

// Electric arc effect
const ElectricArc: React.FC<{ color: string }> = ({ color }) => {
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
        position: 'absolute',
        top: -10,
        left: -10,
        right: -10,
        bottom: -10,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: color,
        opacity: anim,
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
      }}
    />
  );
};

export const FoodCard: React.FC<FoodCardProps> = ({ food, onSwipe, controlMode, showOptimalHint = false, gameMode = 'classic' }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { getFoodCardLabel } = useAccessibility();
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowIntensity = useRef(new Animated.Value(0.3)).current;
  
  const [showExplosion, setShowExplosion] = useState(false);
  const [explosionType, setExplosionType] = useState<'rally' | 'banish' | 'save' | 'share' | null>(null);
  const [showTrail, setShowTrail] = useState(false);
  const [trailDirection, setTrailDirection] = useState<SwipeDirection>('up');
  const [activeDirection, setActiveDirection] = useState<SwipeDirection | null>(null);
  
  // Accessibility label for screen readers
  const a11yLabel = getFoodCardLabel(food.name, (food.faction === 'ally' || food.faction === 'contextual') ? 'ally' : 'enemy', gameMode === 'life' ? 'up' : undefined);

  // Determine visual appearance based on faction and contextual state
  const isAlly = food.faction === 'ally' || (food.faction === 'contextual' && food.isContextuallyGood);
  const isContextual = food.faction === 'contextual';
  const borderColor = isContextual 
    ? (food.isContextuallyGood ? '#a855f7' : '#f97316') // Purple for good contextual, orange for bad
    : (isAlly ? '#22c55e' : '#ef4444');
  const glowColor = isContextual
    ? (food.isContextuallyGood ? 'rgba(168, 85, 247, 0.4)' : 'rgba(249, 115, 22, 0.4)')
    : (isAlly ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)');

  // Get direction color for hints
  const getDirectionColor = (dir: SwipeDirection) => {
    switch (dir) {
      case 'up': return '#22c55e';
      case 'down': return '#ef4444';
      case 'left': return '#3b82f6';
      case 'right': return '#f59e0b';
    }
  };

  // Determine swipe direction from gesture
  const getSwipeDirection = (dx: number, dy: number): SwipeDirection => {
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    
    if (absX > absY) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  };

  // Get action from direction
  const getActionFromDirection = (dir: SwipeDirection): SwipeAction => {
    switch (dir) {
      case 'up': return 'consume';
      case 'down': return 'reject';
      case 'left': return 'save';
      case 'right': return 'share';
    }
  };

  // Spawn animation
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 100,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle pulse
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();

    // Glow pulse
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowIntensity, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(glowIntensity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    glow.start();

    return () => {
      pulse.stop();
      glow.stop();
    };
  }, [glowIntensity, opacity, pulseAnim, scale]);

  const triggerExplosion = (type: 'rally' | 'banish' | 'save' | 'share') => {
    setExplosionType(type);
    setShowExplosion(true);
  };

  const animateOut = (direction: SwipeDirection, dx: number = 0, dy: number = 0) => {
    let targetX = 0;
    let targetY = 0;
    
    switch (direction) {
      case 'up':
        targetY = -screenHeight;
        targetX = dx * 2;
        break;
      case 'down':
        targetY = screenHeight;
        targetX = dx * 2;
        break;
      case 'left':
        targetX = -screenWidth;
        targetY = dy * 2;
        break;
      case 'right':
        targetX = screenWidth;
        targetY = dy * 2;
        break;
    }
    
    // Show trail effect
    setTrailDirection(direction);
    setShowTrail(true);
    
    // Trigger explosion based on action
    const explosionMap: Record<SwipeDirection, 'rally' | 'banish' | 'save' | 'share'> = {
      up: 'rally',
      down: 'banish',
      left: 'save',
      right: 'share',
    };
    triggerExplosion(explosionMap[direction]);
    
    const action = getActionFromDirection(direction);
    
    Animated.parallel([
      Animated.timing(pan, {
        toValue: { x: targetX, y: targetY },
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.3,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onSwipe(food.id, direction, action);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => controlMode === 'swipe',
      onMoveShouldSetPanResponder: () => controlMode === 'swipe',
      onPanResponderGrant: () => {
        Animated.spring(scale, {
          toValue: 1.15,
          useNativeDriver: true,
          friction: 5,
        }).start();
      },
      onPanResponderMove: (_, gesture) => {
        pan.setValue({ x: gesture.dx * 0.5, y: gesture.dy * 0.5 });
        rotation.setValue(gesture.dx * 0.02);
        
        // Update active direction indicator
        if (Math.abs(gesture.dx) > 20 || Math.abs(gesture.dy) > 20) {
          setActiveDirection(getSwipeDirection(gesture.dx, gesture.dy));
        } else {
          setActiveDirection(null);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        const swipeDistance = Math.max(Math.abs(gesture.dx), Math.abs(gesture.dy));
        
        if (swipeDistance > SWIPE_THRESHOLD) {
          const direction = getSwipeDirection(gesture.dx, gesture.dy);
          
          // In classic mode, only allow up/down
          if (gameMode === 'classic' && (direction === 'left' || direction === 'right')) {
            // Snap back
            Animated.parallel([
              Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true, friction: 5 }),
              Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }),
              Animated.spring(rotation, { toValue: 0, useNativeDriver: true, friction: 5 }),
            ]).start();
            setActiveDirection(null);
            return;
          }
          
          animateOut(direction, gesture.dx, gesture.dy);
        } else {
          Animated.parallel([
            Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true, friction: 5 }),
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }),
            Animated.spring(rotation, { toValue: 0, useNativeDriver: true, friction: 5 }),
          ]).start();
        }
        setActiveDirection(null);
      },
    })
  ).current;

  // Handle tap actions - supports all 4 directions in Life Mode
  const handleTapAction = (action: 'rally' | 'banish' | 'save' | 'share') => {
    let direction: SwipeDirection;
    
    switch (action) {
      case 'rally':
        direction = 'up';
        break;
      case 'banish':
        direction = 'down';
        break;
      case 'save':
        direction = 'left';
        break;
      case 'share':
        direction = 'right';
        break;
    }
    
    animateOut(direction, 0, 0);
  };

  const rotateInterpolate = rotation.interpolate({
    inputRange: [-30, 30],
    outputRange: ['-12deg', '12deg'],
  });

  // Generate explosion particles
  const renderExplosionParticles = () => {
    if (!showExplosion || !explosionType) return null;
    
    const particles = [];
    const particleCount = 12;
    
    // Different particle types based on action
    const particleConfig: Record<string, { types: ('spark' | 'ring' | 'star' | 'droplet' | 'ember')[]; color: string; secondaryColor: string }> = {
      rally: { types: ['star', 'spark', 'ring'], color: '#22c55e', secondaryColor: '#86efac' },
      banish: { types: ['ember', 'spark', 'droplet'], color: '#ef4444', secondaryColor: '#fca5a5' },
      save: { types: ['star', 'ring', 'spark'], color: '#3b82f6', secondaryColor: '#93c5fd' },
      share: { types: ['star', 'ring', 'spark'], color: '#f59e0b', secondaryColor: '#fcd34d' },
    };
    
    const config = particleConfig[explosionType] || particleConfig.rally;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = 40 + Math.random() * 30;
      const type = config.types[i % config.types.length];
      
      particles.push(
        <ExplosionParticle
          key={i}
          x={32}
          y={32}
          color={config.color}
          type={type}
          angle={angle}
          distance={distance}
          delay={i * 20}
        />
      );
    }
    
    // Add shockwave rings
    particles.push(
      <View key="shockwave-container" style={{ position: 'absolute', left: 32, top: 32 }}>
        <ShockwaveRing color={config.color} delay={0} />
        <ShockwaveRing color={config.secondaryColor} delay={100} />
      </View>
    );
    
    return particles;
  };

  // Render direction indicators for Life Mode
  const renderDirectionIndicators = () => {
    if (gameMode !== 'life') return null;
    
    const indicators = [
      { dir: 'up' as SwipeDirection, icon: '👆', label: 'EAT', y: -35, x: 22 },
      { dir: 'down' as SwipeDirection, icon: '👇', label: 'NO', y: 65, x: 22 },
      { dir: 'left' as SwipeDirection, icon: '👈', label: 'SAVE', y: 15, x: -30 },
      { dir: 'right' as SwipeDirection, icon: '👉', label: 'SHARE', y: 15, x: 70 },
    ];
    
    return indicators.map(({ dir, icon, label, x, y }) => {
      const isActive = activeDirection === dir;
      const isOptimal = food.optimalSwipe?.direction === dir;
      const color = getDirectionColor(dir);
      
      // Horizontal actions (Save/Share) get a ghost icon hint if not active
      const isHorizontal = dir === 'left' || dir === 'right';
      
      return (
        <View
          key={dir}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            alignItems: 'center',
            opacity: isActive ? 1 : (showOptimalHint && isOptimal ? 0.8 : (isHorizontal ? 0.3 : 0.4)),
            transform: [{ scale: isActive ? 1.2 : (isHorizontal && !isActive ? 0.9 : 1) }],
          }}
        >
          <View
            style={{
              backgroundColor: isActive ? color : 'rgba(0,0,0,0.6)',
              paddingHorizontal: isHorizontal && !isActive ? 6 : 4,
              paddingVertical: 2,
              borderRadius: 8,
              borderWidth: isOptimal ? 2 : (isHorizontal && !isActive ? 1 : 0),
              borderColor: isHorizontal && !isActive ? 'rgba(255,255,255,0.2)' : color,
              shadowColor: isActive ? color : 'transparent',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 4,
            }}
          >
            <Text style={{ fontSize: isHorizontal && !isActive ? 12 : 10, color: 'white', fontWeight: 'bold' }}>{icon}</Text>
          </View>
          {isHorizontal && !isActive && (
            <Text style={{ fontSize: 6, color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', marginTop: 1 }}>{label}</Text>
          )}
        </View>
      );
    });
  };

  return (
    <Animated.View
      {...(controlMode === 'swipe' ? panResponder.panHandlers : {})}
      accessible={true}
      accessibilityLabel={a11yLabel}
      accessibilityRole="button"
      accessibilityHint={controlMode === 'swipe' ? 'Swipe to interact with this food' : 'Tap to interact with this food'}
      style={{
        position: 'absolute',
        left: food.x - 32,
        top: food.y - 32,
        transform: [
          { translateX: pan.x },
          { translateY: pan.y },
          { scale: Animated.multiply(scale, pulseAnim) },
          { rotate: rotateInterpolate },
        ],
        opacity,
      }}
    >
      {/* Direction indicators for Life Mode */}
      {renderDirectionIndicators()}
      
      {/* Explosion particles */}
      {renderExplosionParticles()}
      
      {/* Trail effect */}
      {showTrail && (
        <SwipeTrail direction={trailDirection} color={borderColor} />
      )}
      
      {/* Electric arc effect */}
      <ElectricArc color={borderColor} />
      
      {/* Animated glow effect */}
      <Animated.View
        style={{
          position: 'absolute',
          top: -8,
          left: -8,
          right: -8,
          bottom: -8,
          borderRadius: 22,
          backgroundColor: glowColor,
          opacity: glowIntensity,
        }}
      />
      
      {/* Secondary glow ring */}
      <View
        style={{
          position: 'absolute',
          top: -4,
          left: -4,
          right: -4,
          bottom: -4,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: borderColor,
          opacity: 0.5,
        }}
      />
      
      {/* Main card */}
      <View
        style={{
          width: 64,
          backgroundColor: '#0f0f1a',
          borderWidth: 3,
          borderColor: borderColor,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 8,
          shadowColor: borderColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 12,
          elevation: 10,
        }}
      >
        {/* Faction badge with glow */}
        <View
          style={{
            position: 'absolute',
            top: -12,
            right: -12,
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: borderColor,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: borderColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 10,
            borderWidth: 2.5,
            borderColor: '#fff',
          }}
        >
          <Text style={{ fontSize: 16, color: 'white', fontWeight: 'bold' }}>
            {isAlly ? '✓' : '✗'}
          </Text>
        </View>
        
        {/* Food sprite with shadow */}
        <View style={{ 
          shadowColor: borderColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.5,
          shadowRadius: 4,
        }}>
          <Text style={{ fontSize: 32 }}>{food.sprite}</Text>
        </View>
        
        {/* Swipe hint (swipe mode) */}
        {controlMode === 'swipe' && (
          <View 
            style={{
              position: 'absolute',
              bottom: -18,
              left: 0,
              right: 0,
              alignItems: 'center',
            }}
          >
            <View 
              style={{
                backgroundColor: borderColor,
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 10,
                shadowColor: borderColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 6,
              }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                {isAlly ? '👆' : '👇'}
              </Text>
            </View>
          </View>
        )}

        {/* Tap buttons (tap mode) - 4 directions for Life Mode */}
         {controlMode === 'tap' && gameMode === 'life' && (
           <View style={{ marginTop: 6 }}>
            {/* Top row - Consume */}
            <View style={{ alignItems: 'center', marginBottom: 4 }}>
              <TouchableOpacity
                onPress={() => handleTapAction('rally')}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: '#22c55e',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#22c55e',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 6,
                }}
              >
                <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>👆</Text>
              </TouchableOpacity>
            </View>
            {/* Middle row - Save & Share */}
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
              <TouchableOpacity
                onPress={() => handleTapAction('save')}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: '#3b82f6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                  shadowColor: '#3b82f6',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 6,
                }}
              >
                <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>👈</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleTapAction('share')}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: '#f59e0b',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#f59e0b',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 6,
                }}
              >
                <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>👉</Text>
              </TouchableOpacity>
            </View>
            {/* Bottom row - Reject */}
            <View style={{ alignItems: 'center', marginTop: 4 }}>
              <TouchableOpacity
                onPress={() => handleTapAction('banish')}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: '#ef4444',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#ef4444',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 6,
                }}
              >
                <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>👇</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tap buttons (tap mode) - Classic 2 buttons */}
        {controlMode === 'tap' && gameMode === 'classic' && (
          <View style={{ flexDirection: 'row', marginTop: 6 }}>
            <TouchableOpacity
              onPress={() => handleTapAction('rally')}
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: isAlly ? '#22c55e' : '#374151',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 6,
                opacity: isAlly ? 1 : 0.4,
                shadowColor: isAlly ? '#22c55e' : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 6,
              }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleTapAction('banish')}
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: !isAlly ? '#ef4444' : '#374151',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: !isAlly ? 1 : 0.4,
                shadowColor: !isAlly ? '#ef4444' : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 6,
              }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>✗</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  );
};
