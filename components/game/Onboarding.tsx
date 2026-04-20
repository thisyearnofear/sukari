import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { ControlMode, GameMode, UserMode } from '@/types/game';
import { HealthProfile } from '@/types/health';
import { USER_MODE_CONFIGS } from '@/constants/userModes';

interface OnboardingProps {
  onComplete: (controlMode: ControlMode) => void;
  onSkip: (controlMode: ControlMode) => void;
  defaultControlMode?: ControlMode;
  gameMode: GameMode;
  healthProfile?: HealthProfile;
  userMode?: UserMode;
}

interface OnboardingStep {
  title: string;
  subtitle: string;
  content: string;
  emoji: string;
  foods?: string[];
  isControlSelect?: boolean;
  allyFoods?: boolean;
  direction?: 'up' | 'down' | 'left' | 'right';
  directionColor?: string;
  directionLabel?: string;
}

// Get user mode intro step
function getModeIntroStep(userMode: UserMode | undefined): OnboardingStep {
  if (!userMode) {
    return {
      title: 'WARM-UP ROUND',
      subtitle: 'Practice your swipes...',
      content: 'This is a 30-second tutorial to get comfortable with the controls.\nFood armies march toward your castle. Rally allies. Banish invaders.',
      emoji: '🏰',
    };
  }

  const modeConfig = USER_MODE_CONFIGS[userMode];
  const introTexts: Record<UserMode, string> = {
    personal: "Understanding YOUR body's glucose response. Every choice teaches you something.",
    caregiver: 'See what THEY navigate daily. Empathy through experience.',
    curious: 'Glucose management is complex. This game shows you why.',
  };

  const emojis: Record<UserMode, string> = {
    personal: '💪',
    caregiver: '❤️',
    curious: '🧠',
  };

  return {
    title: modeConfig.name.toUpperCase(),
    subtitle: modeConfig.subtitle,
    content: introTexts[userMode],
    emoji: emojis[userMode],
  };
}

// Classic mode steps (2 directions) — minimal, get to gameplay fast
const CLASSIC_STEPS: OnboardingStep[] = [
  {
    title: 'DEFEND YOUR KINGDOM',
    subtitle: 'Rally allies. Banish invaders.',
    content: '👆 Swipe UP on healthy foods\n👇 Swipe DOWN on junk food\n💚 Keep the green bar balanced!',
    emoji: '🏰',
    foods: ['🥦', '🍩', '🐟'],
  },
  {
    title: 'CHOOSE CONTROLS',
    subtitle: 'How will you fight?',
    content: '',
    emoji: '🎮',
    isControlSelect: true,
  },
];

// Life mode steps (4 directions)
const LIFE_MODE_STEPS: OnboardingStep[] = [
  {
    title: 'A DAY IN THE KINGDOM',
    subtitle: 'Survive from dawn to dusk...',
    content: 'Manage your realm through morning, noon, afternoon, and evening. Balance is key.',
    emoji: '🏰',
  },
  {
    title: 'RESTORE VIGOR',
    subtitle: 'Swipe UP to consume',
    content: 'Consume Ally foods to boost Vigor, Purity, and Vitality',
    emoji: '🍽️',
    foods: ['🥦', '🥕', '🐟'],
    allyFoods: true,
    direction: 'up',
    directionColor: '#22c55e',
    directionLabel: '👆 SWIPE UP',
  },
  {
    title: 'REJECT THE HORDE',
    subtitle: 'Swipe DOWN to refuse',
    content: 'Reject the Sugar Horde to maintain your inner Harmony',
    emoji: '🚫',
    foods: ['🍩', '🍬', '🍔'],
    allyFoods: false,
    direction: 'down',
    directionColor: '#ef4444',
    directionLabel: '👇 SWIPE DOWN',
  },
  {
    title: 'SAVE FOR LATER',
    subtitle: 'Swipe LEFT to store',
    content: 'Save up to 3 foods in your Royal Pantry for strategic use',
    emoji: '🏺',
    foods: ['🍎', '🥜', '🥤'],
    direction: 'left',
    directionColor: '#3b82f6',
    directionLabel: '👈 SWIPE LEFT',
  },
  {
    title: 'SHARE WITH ALLIES',
    subtitle: 'Swipe RIGHT to gift',
    content: 'Share foods to build your social meter and earn bonuses',
    emoji: '🤝',
    foods: ['🍇', '🥗', '🍊'],
    direction: 'right',
    directionColor: '#f59e0b',
    directionLabel: '👉 SWIPE RIGHT',
  },
  {
    title: 'ROYAL ACTIONS',
    subtitle: 'Use your influence wisely',
    content: 'Train Knights (Exercise) to lower Harmony levels. Host Royal Feasts (Rations) to raise them.',
    emoji: '⚔️',
  },
  {
    title: 'CHOOSE CONTROLS',
    subtitle: 'How will you fight?',
    content: '',
    emoji: '🎮',
    isControlSelect: true,
  },
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onSkip, defaultControlMode = 'swipe', gameMode, userMode }) => {
  // Build steps array with mode-specific intro if available
  const baseSteps = gameMode === 'life' ? LIFE_MODE_STEPS : CLASSIC_STEPS;
  const ONBOARDING_STEPS = userMode ? [getModeIntroStep(userMode), ...baseSteps] : baseSteps;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedControlMode] = useState<ControlMode>(defaultControlMode);
  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;
  const emojiSlideAnim = useRef(new Animated.Value(0)).current;
  const directionArrowAnim = useRef(new Animated.Value(0)).current;
  const foodAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  
  // Calculate emoji horizontal position based on progress
  const progressPercentage = currentStep / (ONBOARDING_STEPS.length - 1);
  
  // Get theme colors based on game mode
  const themeColor = gameMode === 'life' ? '#fbbf24' : '#f59e0b';

  // Initial loading animation
  useEffect(() => {
    Animated.sequence([
      Animated.timing(loadingAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.delay(400),
    ]).start(() => {
      setIsLoading(false);
    });
  }, [loadingAnim]);

  useEffect(() => {
    if (isLoading) return;
    
    // Reset animations
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.9);
    directionArrowAnim.setValue(0);
    foodAnims.forEach(anim => anim.setValue(0));
    
    // Animate in
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
      // Animate emoji slide based on progress
      Animated.spring(emojiSlideAnim, {
        toValue: progressPercentage * -60, // Move left (towards center) up to 60px
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }),
    ]).start();

    // Staggered food animations
    if (step.foods) {
      foodAnims.forEach((anim, i) => {
        Animated.sequence([
          Animated.delay(200 + i * 100),
          Animated.spring(anim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 6,
          }),
        ]).start();
      });
    }

    // Pulse animation for emoji
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();
    
    // Direction arrow animation
    if (step.direction) {
      const arrowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(directionArrowAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(directionArrowAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      );
      arrowLoop.start();
      return () => {
        pulseLoop.stop();
        arrowLoop.stop();
      };
    }

    return () => pulseLoop.stop();
  }, [currentStep, isLoading, progressPercentage, directionArrowAnim, emojiSlideAnim, fadeAnim, foodAnims, pulseAnim, scaleAnim, step.direction, step.foods]);

  const handleNext = () => {
    if (isLastStep) return;
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(prev => prev + 1);
    });
  };
  
  const handleBack = () => {
    if (currentStep === 0) return;
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(prev => prev - 1);
    });
  };

  const handleSelectControl = (mode: ControlMode) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onComplete(mode);
    });
  };

  // Loading screen
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a12', alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          style={{
            opacity: loadingAnim,
            transform: [{
              scale: loadingAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            }],
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 60, marginBottom: 16 }}>🏰</Text>
          <Text style={{ color: themeColor, fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
            {gameMode === 'life' ? 'LIFE MODE' : 'GLUCOSE WARS'}
          </Text>
          <ActivityIndicator size="small" color={themeColor} />
          <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 12 }}>
            {gameMode === 'life' ? 'Preparing your day...' : 'Preparing battle...'}
          </Text>
        </Animated.View>
      </View>
    );
  }
  
  // Get direction arrow transform
  const getDirectionTransform = () => {
    const offset = directionArrowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, step.direction === 'up' ? -15 : step.direction === 'down' ? 15 : step.direction === 'left' ? -15 : 15],
    });
    
    if (step.direction === 'up' || step.direction === 'down') {
      return [{ translateY: offset }];
    }
    return [{ translateX: offset }];
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a12', alignItems: 'center', justifyContent: 'center' }}>
      {/* Background glow */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <View 
          style={{ 
            width: 256, 
            height: 256, 
            borderRadius: 128, 
            opacity: 0.2,
            backgroundColor: step.directionColor || step.allyFoods === true ? '#22c55e' : step.allyFoods === false ? '#ef4444' : themeColor,
          }}
        />
      </View>

      {/* Progress bar */}
      <View style={{ position: 'absolute', top: 48, left: 24, right: 24 }}>
        <View style={{ height: 4, backgroundColor: '#1f2937', borderRadius: 2, overflow: 'hidden' }}>
          <Animated.View 
            style={{ 
              height: '100%',
              width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%`,
              backgroundColor: themeColor,
              borderRadius: 2,
            }}
          />
        </View>
        <Text style={{ color: '#6b7280', fontSize: 10, marginTop: 8, textAlign: 'center' }}>
          {gameMode === 'life' ? 'Life Mode Tutorial' : 'Classic Mode Tutorial'} • Step {currentStep + 1} of {ONBOARDING_STEPS.length}
        </Text>
      </View>

      {/* Main content card */}
      <Animated.View
        accessible
        accessibilityLabel={`Step ${currentStep + 1} of ${ONBOARDING_STEPS.length}. ${step.title}. ${step.subtitle}. ${step.content}`}
        accessibilityRole="text"
        style={{
          alignItems: 'center',
          paddingHorizontal: 32,
          maxWidth: 400,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        {/* Emoji with pulse and horizontal slide */}
        <Animated.View 
          style={{ 
            marginBottom: 16,
            transform: [
              { scale: pulseAnim },
              { translateX: emojiSlideAnim }
            ] 
          }}
        >
          <View 
            style={{ 
              width: 96, 
              height: 96, 
              borderRadius: 48, 
              alignItems: 'center', 
              justifyContent: 'center', 
              borderWidth: 2,
              borderColor: step.directionColor || step.allyFoods === true ? '#22c55e' : step.allyFoods === false ? '#ef4444' : themeColor,
              backgroundColor: 'rgba(0,0,0,0.4)',
            }}
          >
            <Text style={{ fontSize: 48 }}>{step.emoji}</Text>
          </View>
        </Animated.View>

        {/* Title */}
        <Text style={{ color: themeColor, fontSize: 20, fontWeight: 'bold', textAlign: 'center', letterSpacing: 1, marginBottom: 4 }}>
          {step.title}
        </Text>
        <Text style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', marginBottom: 16 }}>
          {step.subtitle}
        </Text>

        {/* Content */}
        {step.content && (
          <Text style={{ color: '#d1d5db', textAlign: 'center', fontSize: 14, marginBottom: 16, lineHeight: 20 }}>
            {step.content}
          </Text>
        )}
        
        {/* Direction indicator with animated arrow */}
        {step.direction && step.directionLabel && (
          <Animated.View 
            style={{ 
              marginBottom: 16,
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: `${step.directionColor}20`,
              borderWidth: 2,
              borderColor: step.directionColor,
              transform: getDirectionTransform(),
            }}
          >
            <Text style={{ color: step.directionColor, fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
              {step.directionLabel}
            </Text>
          </Animated.View>
        )}

        {/* Food examples with staggered animation */}
        {step.foods && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
            {step.foods.map((food, i) => (
              <Animated.View
                key={i}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginHorizontal: 4,
                  borderWidth: 2,
                  borderColor: step.directionColor || (step.allyFoods ? '#22c55e' : '#ef4444'),
                  backgroundColor: step.directionColor ? `${step.directionColor}15` : (step.allyFoods ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                  opacity: foodAnims[i],
                  transform: [{
                    scale: foodAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  }],
                }}
              >
                <Text style={{ fontSize: 28 }}>{food}</Text>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Control selection */}
        {step.isControlSelect && (
          <View style={{ width: '100%', marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => handleSelectControl('swipe')}
              accessibilityLabel={`Swipe controls. ${gameMode === 'life' ? '4 directions' : 'Best for mobile'}`}
              accessibilityRole="button"
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                padding: 16,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: '#22c55e',
                marginBottom: 12,
              }}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 28, marginRight: 12 }}>
                  {gameMode === 'life' ? '👆👇👈👉' : '👆👇'}
                </Text>
                <View>
                  <Text style={{ color: '#86efac', fontWeight: 'bold', fontSize: 16 }}>SWIPE</Text>
                  <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                    {gameMode === 'life' ? '4 directions' : 'Best for mobile'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSelectControl('tap')}
              accessibilityLabel={`Tap controls. ${gameMode === 'life' ? 'Button controls' : 'Best for web'}`}
              accessibilityRole="button"
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                padding: 16,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: '#3b82f6',
              }}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 28, marginRight: 12 }}>🖱️</Text>
                <View>
                  <Text style={{ color: '#93c5fd', fontWeight: 'bold', fontSize: 16 }}>TAP</Text>
                  <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                    {gameMode === 'life' ? 'Button controls' : 'Best for web'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Next button */}
        {!isLastStep && (
          <TouchableOpacity
            onPress={handleNext}
            accessibilityLabel="Next step"
            accessibilityRole="button"
            style={{
              marginTop: 24,
              backgroundColor: `${themeColor}E6`,
              paddingHorizontal: 32,
              paddingVertical: 12,
              borderRadius: 24,
              shadowColor: themeColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>NEXT</Text>
          </TouchableOpacity>
        )}

        {/* Skip button */}
        {!isLastStep && (
          <TouchableOpacity
            onPress={() => onSkip(selectedControlMode)}
            accessibilityLabel="Skip tutorial"
            accessibilityRole="button"
            style={{
              marginTop: 8,
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
              paddingHorizontal: 32,
              paddingVertical: 10,
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: '#6366f1',
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#a5b4fc', fontWeight: 'bold', fontSize: 14 }}>SKIP</Text>
          </TouchableOpacity>
        )}

        {/* Back button */}
        {currentStep > 0 && (
          <TouchableOpacity
            onPress={handleBack}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            style={{
              marginTop: 12,
              backgroundColor: 'rgba(168, 85, 247, 0.2)',
              paddingHorizontal: 32,
              paddingVertical: 10,
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: '#a855f7',
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#d8b4fe', fontWeight: 'bold', fontSize: 14 }}>BACK</Text>
          </TouchableOpacity>
        )}
        </Animated.View>

        {/* Step dots */}
        <View style={{ position: 'absolute', bottom: 32, flexDirection: 'row' }}>
        {ONBOARDING_STEPS.map((_, i) => (
          <View
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              marginHorizontal: 4,
              backgroundColor: i === currentStep ? themeColor : i < currentStep ? `${themeColor}80` : '#374151',
            }}
          />
        ))}
        </View>
    </View>
  );
};
