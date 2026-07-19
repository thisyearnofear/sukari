/**
 * HeroIntro — value-first first-open screen.
 * Establishes the real-world problem before asking for any personalisation.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { COLORS, FONTS, ANIMATIONS } from '@/constants/designSystem';
import { MetabolicField } from '@/components/atmosphere/MetabolicField';
import { PressableScale } from '@/components/ui/PressableScale';
import { MiraOrb } from '@/components/agent/MiraOrb';
import { CoachModal } from '@/components/agent/CoachModal';
import { steadyPresence } from '@/domain/agent';
import { useCoach } from '@/hooks/useCoach';

const P = COLORS.PROGRAMME;

interface HeroIntroProps {
  onComplete: (source: 'cta' | 'skip') => void;
}

export const HeroIntro: React.FC<HeroIntroProps> = ({ onComplete }) => {
  const [showMeetMira, setShowMeetMira] = useState(false);
  const reducedMotion = useReducedMotion();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (reducedMotion) {
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
      return;
    }
    const enter = ANIMATIONS.MOTION.enter;
    const easeIn = Easing.bezier(enter.bezier[0], enter.bezier[1], enter.bezier[2], enter.bezier[3]);

    fadeAnim.setValue(0);
    slideAnim.setValue(14);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: enter.duration,
        easing: easeIn,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: enter.duration,
        easing: easeIn,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, reducedMotion]);

  return (
    <View style={styles.root}>
      <MetabolicField band="in_range" intensity={0.5} />

      <Animated.View
        style={[
          styles.scene,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <MiraOrb
          posture="steady"
          presence={steadyPresence()}
          size={72}
          onPress={() => setShowMeetMira(true)}
        />
        <Text style={styles.orbHint} accessibilityLabel="Tap the orb to meet Mira">
          Tap to meet Mira
        </Text>
        <Text style={styles.brand}>Sukari</Text>
        <Text style={styles.eyebrow}>Metabolic care, between appointments</Text>
        <Text style={styles.title}>You know what helps. The hard part is doing it at the moment it matters.</Text>
        <Text style={styles.sub}>
          Sukari turns a pattern into one small experiment for today, then helps you carry it into real life.
        </Text>
        <View style={styles.example}>
          <Text style={styles.exampleLabel}>Tonight&apos;s example</Text>
          <Text style={styles.exampleAction}>Take a 10-minute walk after dinner.</Text>
          <Text style={styles.exampleReason}>A small way to test whether your evenings run steadier.</Text>
        </View>
        <PressableScale
          onPress={() => onComplete('cta')}
          accessibilityLabel="See how Sukari works"
          accessibilityRole="button"
          style={styles.primary}
        >
          <Text style={styles.primaryText}>See how it works</Text>
        </PressableScale>
        <Text style={styles.scope}>Habits only. Never medication, dosing, or diagnosis.</Text>
        <PressableScale
          onPress={() => onComplete('skip')}
          accessibilityLabel="Skip introduction"
          accessibilityRole="button"
          style={styles.skip}
        >
          <Text style={styles.skipText}>I already know the flow</Text>
        </PressableScale>
      </Animated.View>

      <MeetMiraModal visible={showMeetMira} onClose={() => setShowMeetMira(false)} />
    </View>
  );
};

/**
 * Meet Mira — a lightweight welcome chat available from the first screen.
 * No mission context yet; Mira introduces herself in voice and answers
 * orientation questions. The persona lock on the worker keeps her in
 * character regardless of what the person asks.
 *
 * Uses the shared CoachModal so the conversation surface is identical
 * across every screen — streaming, session memory, tier transitions, and
 * "Sit with me" rest mode all work here too.
 */
const MeetMiraModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const coach = useCoach();
  const [input, setInput] = useState('');

  return (
    <CoachModal
      visible={visible}
      onClose={onClose}
      mission={null}
      insights={[]}
      chatReply={coach.chatReply}
      isLoading={coach.isLoading}
      input={input}
      setInput={setInput}
      onAsk={async () => {
        const q = input.trim();
        setInput('');
        await coach.ask(q, null);
      }}
      messages={coach.messages}
      onClearChat={coach.clearChat}
    />
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scene: {
    zIndex: 10,
    alignItems: 'center',
    paddingHorizontal: 36,
    maxWidth: 460,
  },
  orbHint: {
    fontFamily: FONTS.bodyMedium,
    color: P.textMuted,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 24,
  },
  brand: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 26,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  eyebrow: {
    fontFamily: FONTS.bodyMedium,
    color: P.accent,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  title: {
    fontFamily: FONTS.display,
    color: P.textSoft,
    fontSize: 30,
    lineHeight: 37,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  sub: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: 14,
  },
  example: {
    width: '100%',
    marginTop: 26,
    borderLeftWidth: 2,
    borderLeftColor: P.accent,
    backgroundColor: P.mist,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  exampleLabel: {
    fontFamily: FONTS.bodyMedium,
    color: P.textMuted,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  exampleAction: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 18,
    lineHeight: 24,
    marginTop: 6,
  },
  exampleReason: {
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  primary: {
    width: '100%',
    marginTop: 16,
    backgroundColor: P.accent,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryText: {
    fontFamily: FONTS.bodyBold,
    color: P.ink,
    fontSize: 15,
  },
  scope: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  skip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 2,
  },
  skipText: {
    fontFamily: FONTS.bodyMedium,
    color: P.textMuted,
    fontSize: 13,
  },
});
