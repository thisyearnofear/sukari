/**
 * WelcomeScene — the cinematic first-open moment.
 *
 * Plays once, the very first time a patient opens the app. The orb
 * materializes from darkness, breathes into presence, and Mira
 * introduces herself. Then a single input appears: "Say hello when
 * you're ready." The patient's first words become the first message
 * in the conversation — no separate onboarding flow, no forms.
 *
 * On subsequent opens, this scene is skipped entirely.
 *
 * Design intent: the orb is the hero for 5 seconds, not a decoration
 * in the corner. This is the "you've arrived somewhere considered"
 * moment that Calm, Headspace, and Apple Health all have.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '@/constants/designSystem';
import { MiraOrb } from '@/components/agent/MiraOrb';
import { PressableScale } from '@/components/ui/PressableScale';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { track } from '@/utils/analytics';

const P = COLORS.PROGRAMME;

const INTRO_LINES = [
  "I'm Mira.",
  "I'm here to help you find the small things that change the pattern.",
  'No pressure. No lectures. Just attention.',
];

interface WelcomeSceneProps {
  onComplete: (firstMessage: string) => void;
}

export const WelcomeScene: React.FC<WelcomeSceneProps> = ({ onComplete }) => {
  const reducedMotion = useReducedMotion();
  const [input, setInput] = useState('');
  const [inputVisible, setInputVisible] = useState(false);

  // Animation values
  const orbOpacity = useRef(new Animated.Value(0)).current;
  const orbScale = useRef(new Animated.Value(0.3)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const lineOpacities = useRef(INTRO_LINES.map(() => new Animated.Value(0))).current;
  const inputOpacity = useRef(new Animated.Value(0)).current;
  const inputTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    track('welcome_scene_started');

    if (reducedMotion) {
      // Skip animations — show everything immediately
      orbOpacity.setValue(1);
      orbScale.setValue(1);
      glowOpacity.setValue(0.4);
      lineOpacities.forEach((v) => v.setValue(1));
      inputOpacity.setValue(1);
      inputTranslateY.setValue(0);
      setInputVisible(true);
      return;
    }

    // Sequence:
    // 0.0s — orb glow fades in from darkness
    // 0.8s — orb materializes (scale + opacity)
    // 2.0s — first intro line fades in
    // 3.0s — second line
    // 4.0s — third line
    // 5.0s — input appears
    const sequence: Animated.CompositeAnimation[] = [];

    // Glow fade-in
    sequence.push(
      Animated.timing(glowOpacity, {
        toValue: 0.5,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );

    // Orb materializes
    sequence.push(
      Animated.parallel([
        Animated.timing(orbOpacity, {
          toValue: 1,
          duration: 1200,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
          useNativeDriver: true,
        }),
        Animated.timing(orbScale, {
          toValue: 1,
          duration: 1200,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
          useNativeDriver: true,
        }),
      ]),
    );

    // Intro lines — staggered
    INTRO_LINES.forEach((_, idx) => {
      sequence.push(
        Animated.timing(lineOpacities[idx], {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      );
    });

    // Input appears
    sequence.push(
      Animated.parallel([
        Animated.timing(inputOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(inputTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    // Run the sequence with delays between each step
    Animated.sequence(
      sequence.map((anim, idx) =>
        Animated.sequence([
          Animated.delay(idx === 0 ? 0 : idx === 1 ? 800 : idx <= 4 ? 1000 : 600),
          anim,
        ]),
      ),
    ).start(() => {
      setInputVisible(true);
      track('welcome_scene_complete');
    });

    return () => {
      orbOpacity.stopAnimation();
      orbScale.stopAnimation();
      glowOpacity.stopAnimation();
      lineOpacities.forEach((v) => v.stopAnimation());
      inputOpacity.stopAnimation();
      inputTranslateY.stopAnimation();
    };
  }, [reducedMotion, orbOpacity, orbScale, glowOpacity, lineOpacities, inputOpacity, inputTranslateY]);

  const handleSubmit = () => {
    const msg = input.trim();
    if (!msg) return;
    track('welcome_first_message', { length: msg.length });
    onComplete(msg);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Background glow — a faint radial behind the orb */}
          <Animated.View
            style={[
              styles.bgGlow,
              { opacity: glowOpacity },
            ]}
          />

          <View style={styles.content}>
            {/* Orb — hero, centered, large */}
            <Animated.View
              style={[
                styles.orbContainer,
                {
                  opacity: orbOpacity,
                  transform: [{ scale: orbScale }],
                },
              ]}
            >
              <MiraOrb posture="steady" size={120} />
            </Animated.View>

            {/* Intro lines */}
            <View style={styles.introContainer}>
              {INTRO_LINES.map((line, idx) => (
                <Animated.Text
                  key={idx}
                  style={[
                    styles.introLine,
                    idx === 0 && styles.introLineFirst,
                    { opacity: lineOpacities[idx] },
                  ]}
                >
                  {line}
                </Animated.Text>
              ))}
            </View>

            {/* Input — appears after intro */}
            <Animated.View
              style={[
                styles.inputContainer,
                {
                  opacity: inputOpacity,
                  transform: [{ translateY: inputTranslateY }],
                },
              ]}
            >
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Say hello when you're ready…"
                placeholderTextColor={P.textMuted}
                multiline
                maxLength={500}
                onSubmitEditing={handleSubmit}
                returnKeyType="send"
                autoFocus={inputVisible}
              />
              <PressableScale
                onPress={handleSubmit}
                style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
                accessibilityRole="button"
                disabled={!input.trim()}
              >
                <Text style={styles.sendButtonText}>Begin</Text>
              </PressableScale>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.ink,
  },
  flex: {
    flex: 1,
  },
  bgGlow: {
    position: 'absolute',
    top: '25%',
    left: '50%',
    width: 300,
    height: 300,
    marginLeft: -150,
    marginTop: -150,
    borderRadius: 999,
    backgroundColor: 'rgba(61, 155, 122, 0.12)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  orbContainer: {
    marginBottom: 48,
  },
  introContainer: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 48,
  },
  introLine: {
    fontFamily: FONTS.body,
    fontSize: 16,
    lineHeight: 24,
    color: P.textSoft,
    textAlign: 'center',
  },
  introLineFirst: {
    fontFamily: FONTS.display,
    fontSize: 28,
    lineHeight: 36,
    color: P.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
    maxWidth: 440,
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: P.text,
    borderWidth: 1,
    borderColor: P.line,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
    maxHeight: 120,
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: P.accent,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: P.ink,
  },
});
