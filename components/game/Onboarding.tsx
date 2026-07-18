import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ControlMode, GameMode, UserMode } from '@/types/game';
import { HealthProfile } from '@/types/health';
import { USER_MODE_CONFIGS } from '@/constants/userModes';
import { COLORS, FONTS, ANIMATIONS } from '@/constants/designSystem';
import { MetabolicField } from '@/components/atmosphere/MetabolicField';
import { PressableScale } from '@/components/ui/PressableScale';

const P = COLORS.PROGRAMME;

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
  isControlSelect?: boolean;
}

function getModeIntroStep(userMode: UserMode | undefined): OnboardingStep {
  if (!userMode) {
    return {
      title: 'A short rehearsal',
      subtitle: 'Warm up before today’s real-world mission',
      content:
        'Foods move toward your field. Rally steadying choices up. Send spikes away down. Stay in range — then take the habit into real life.',
    };
  }

  const modeConfig = USER_MODE_CONFIGS[userMode];
  const introTexts: Record<UserMode, string> = {
    personal: 'This practice rehearses today’s mission — each choice is a small decision you’ll make between appointments.',
    caregiver: 'Step into the decisions they face daily. Empathy through a short rehearsal tied to a real support ask.',
    curious: 'See how pattern → mission → practice → action feels. The game is the engagement layer, not the whole product.',
  };

  return {
    title: modeConfig.name,
    subtitle: modeConfig.subtitle,
    content: introTexts[userMode],
  };
}

const CLASSIC_STEPS: OnboardingStep[] = [
  {
    title: 'How rehearsal works',
    subtitle: 'Two gestures. One goal.',
    content:
      'Swipe up on allies that steady you.\nSwipe down on enemies that spike or crash.\nKeep the bar in range — then do the mission in real life.',
  },
  {
    title: 'Choose controls',
    subtitle: 'How do you want to practice?',
    content: '',
    isControlSelect: true,
  },
];

const LIFE_MODE_STEPS: OnboardingStep[] = [
  {
    title: 'A day in the field',
    subtitle: 'Dawn to dusk, one decision at a time',
    content:
      'Up: take allies · Down: refuse enemies\nLeft: save for later · Right: share\nKeep harmony balanced through the day.',
  },
  {
    title: 'Choose controls',
    subtitle: 'How do you want to practice?',
    content: '',
    isControlSelect: true,
  },
];

export const Onboarding: React.FC<OnboardingProps> = ({
  onComplete,
  onSkip,
  defaultControlMode = 'swipe',
  gameMode,
  userMode,
}) => {
  const baseSteps = gameMode === 'life' ? LIFE_MODE_STEPS : CLASSIC_STEPS;
  const steps = userMode ? [getModeIntroStep(userMode), ...baseSteps] : baseSteps;

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedControlMode] = useState<ControlMode>(defaultControlMode);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const runEnter = () => {
    const { duration, bezier } = ANIMATIONS.MOTION.enter;
    fadeAnim.setValue(0);
    slideAnim.setValue(12);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        easing: Easing.bezier(bezier[0], bezier[1], bezier[2], bezier[3]),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration,
        easing: Easing.bezier(bezier[0], bezier[1], bezier[2], bezier[3]),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const runExit = (then: () => void) => {
    const { duration, bezier } = ANIMATIONS.MOTION.exit;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration,
        easing: Easing.bezier(bezier[0], bezier[1], bezier[2], bezier[3]),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -8,
        duration,
        easing: Easing.bezier(bezier[0], bezier[1], bezier[2], bezier[3]),
        useNativeDriver: true,
      }),
    ]).start(then);
  };

  useEffect(() => {
    runEnter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const handleNext = () => {
    if (isLastStep) return;
    runExit(() => setCurrentStep((prev) => prev + 1));
  };

  const handleBack = () => {
    if (currentStep === 0) return;
    runExit(() => setCurrentStep((prev) => prev - 1));
  };

  const handleSelectControl = (mode: ControlMode) => {
    runExit(() => onComplete(mode));
  };

  return (
    <View style={styles.root}>
      <MetabolicField band="in_range" intensity={0.4} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentStep + 1) / steps.length) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {gameMode === 'life' ? 'Day practice' : 'Practice'} · {currentStep + 1} of {steps.length}
          </Text>
        </View>

        <Animated.View
          accessible
          accessibilityLabel={`Step ${currentStep + 1} of ${steps.length}. ${step.title}. ${step.subtitle}. ${step.content}`}
          accessibilityRole="text"
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.brand}>Glucose Wars</Text>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.subtitle}>{step.subtitle}</Text>

          {step.content ? <Text style={styles.content}>{step.content}</Text> : null}

          {step.isControlSelect ? (
            <View style={styles.controls}>
              <PressableScale
                onPress={() => handleSelectControl('swipe')}
                accessibilityLabel={`Swipe controls. ${gameMode === 'life' ? 'Four directions' : 'Best for mobile'}`}
                accessibilityRole="button"
                style={styles.controlPrimary}
              >
                <Text style={styles.controlPrimaryTitle}>Swipe</Text>
                <Text style={styles.controlPrimarySub}>
                  {gameMode === 'life' ? 'Four directions' : 'Best for mobile'}
                </Text>
              </PressableScale>

              <PressableScale
                onPress={() => handleSelectControl('tap')}
                accessibilityLabel={`Tap controls. ${gameMode === 'life' ? 'Button controls' : 'Best for web'}`}
                accessibilityRole="button"
                style={styles.controlSecondary}
              >
                <Text style={styles.controlSecondaryTitle}>Tap</Text>
                <Text style={styles.controlSecondarySub}>
                  {gameMode === 'life' ? 'Button controls' : 'Best for web'}
                </Text>
              </PressableScale>
            </View>
          ) : null}

          {!isLastStep ? (
            <PressableScale
              onPress={handleNext}
              accessibilityLabel="Next step"
              accessibilityRole="button"
              style={styles.nextBtn}
            >
              <Text style={styles.nextText}>Continue</Text>
            </PressableScale>
          ) : null}

          {!isLastStep ? (
            <PressableScale
              onPress={() => onSkip(selectedControlMode)}
              accessibilityLabel="Skip tutorial"
              accessibilityRole="button"
              style={styles.ghostBtn}
            >
              <Text style={styles.ghostText}>Skip to practice</Text>
            </PressableScale>
          ) : null}

          {currentStep > 0 ? (
            <PressableScale
              onPress={handleBack}
              accessibilityLabel="Go back"
              accessibilityRole="button"
              style={styles.backBtn}
            >
              <Text style={styles.ghostText}>Back</Text>
            </PressableScale>
          ) : null}
        </Animated.View>

        <View style={styles.dots}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentStep && styles.dotActive,
                i < currentStep && styles.dotDone,
              ]}
            />
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.ink,
  },
  safe: {
    flex: 1,
    zIndex: 10,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  progressWrap: {
    position: 'absolute',
    top: 16,
    left: 28,
    right: 28,
  },
  progressTrack: {
    height: 2,
    backgroundColor: P.line,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: P.accent,
  },
  progressLabel: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  brand: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 22,
    letterSpacing: -0.3,
    marginBottom: 20,
  },
  title: {
    fontFamily: FONTS.display,
    color: P.textSoft,
    fontSize: 26,
    lineHeight: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  content: {
    fontFamily: FONTS.body,
    color: P.text,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 8,
  },
  controls: {
    marginTop: 12,
    gap: 10,
  },
  controlPrimary: {
    backgroundColor: P.accent,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 2,
  },
  controlPrimaryTitle: {
    fontFamily: FONTS.bodyBold,
    color: P.ink,
    fontSize: 16,
  },
  controlPrimarySub: {
    fontFamily: FONTS.body,
    color: 'rgba(11, 18, 16, 0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  controlSecondary: {
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.mist,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 2,
  },
  controlSecondaryTitle: {
    fontFamily: FONTS.bodyBold,
    color: P.text,
    fontSize: 16,
  },
  controlSecondarySub: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  nextBtn: {
    marginTop: 28,
    backgroundColor: P.accent,
    paddingVertical: 14,
    borderRadius: 2,
    alignItems: 'center',
  },
  nextText: {
    fontFamily: FONTS.bodyBold,
    color: P.ink,
    fontSize: 15,
  },
  ghostBtn: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: P.line,
    borderRadius: 2,
  },
  backBtn: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  ghostText: {
    fontFamily: FONTS.bodyMedium,
    color: P.textSoft,
    fontSize: 13,
  },
  dots: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 3,
    borderRadius: 1,
    backgroundColor: P.line,
  },
  dotActive: {
    width: 22,
    backgroundColor: P.accent,
  },
  dotDone: {
    backgroundColor: 'rgba(61, 155, 122, 0.45)',
  },
});
