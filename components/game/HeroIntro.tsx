/**
 * HeroIntro — value-first first-open screen.
 * Establishes the real-world problem before asking for any personalisation.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, StyleSheet, Modal, TextInput } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { COLORS, FONTS, ANIMATIONS } from '@/constants/designSystem';
import { MetabolicField } from '@/components/atmosphere/MetabolicField';
import { PressableScale } from '@/components/ui/PressableScale';
import { MiraOrb } from '@/components/agent/MiraOrb';
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
 */
const MeetMiraModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const coach = useCoach();
  const [input, setInput] = useState('');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.meetBackdrop}>
        <View style={styles.meetSheet}>
          <View style={styles.meetHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.meetDot, { backgroundColor: coach.isLoading ? P.accent : P.cool }]} />
              <Text style={styles.meetTitle}>Mira</Text>
            </View>
            <PressableScale onPress={onClose} accessibilityRole="button">
              <Text style={styles.meetClose}>Close</Text>
            </PressableScale>
          </View>
          <Text style={styles.meetMuted}>Habits only — never dosing or medical advice.</Text>
          <Text style={styles.meetGreeting}>
            I&apos;m Mira. I&apos;ll be here when you&apos;re ready — one small experiment at a time.
          </Text>
          {coach.chatReply ? (
            <View style={styles.meetReply}>
              <Text style={styles.meetReplyText}>{coach.chatReply}</Text>
            </View>
          ) : null}
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={coach.isLoading ? 'Listening…' : 'Ask me anything before you begin…'}
            placeholderTextColor={P.textMuted}
            style={styles.meetInput}
          />
          <PressableScale
            disabled={coach.isLoading || !input.trim()}
            onPress={async () => {
              const q = input.trim();
              setInput('');
              await coach.ask(q, null);
            }}
            style={[styles.meetCta, { opacity: coach.isLoading || !input.trim() ? 0.5 : 1 }]}
          >
            <Text style={styles.meetCtaText}>{coach.isLoading ? 'Thinking…' : 'Ask Mira'}</Text>
          </PressableScale>
        </View>
      </View>
    </Modal>
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
  meetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  meetSheet: {
    backgroundColor: P.inkElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  meetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  meetDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  meetTitle: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 22,
  },
  meetClose: {
    fontFamily: FONTS.bodyMedium,
    color: P.cool,
    fontSize: 14,
  },
  meetMuted: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 11,
    marginBottom: 16,
  },
  meetGreeting: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 16,
  },
  meetReply: {
    backgroundColor: P.mist,
    borderLeftWidth: 2,
    borderLeftColor: P.accent,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  meetReplyText: {
    fontFamily: FONTS.body,
    color: P.text,
    fontSize: 14,
    lineHeight: 20,
  },
  meetInput: {
    backgroundColor: P.mist,
    color: P.text,
    fontFamily: FONTS.body,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: P.line,
    marginBottom: 12,
  },
  meetCta: {
    backgroundColor: P.accent,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 4,
  },
  meetCtaText: {
    fontFamily: FONTS.bodyBold,
    color: P.ink,
    fontSize: 15,
  },
});
