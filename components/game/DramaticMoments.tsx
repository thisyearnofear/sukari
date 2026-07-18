/**
 * DramaticMoments — metabolic beats for key practice events.
 * Brief, non-blocking. Same component APIs as before.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '@/constants/designSystem';

const P = COLORS.PROGRAMME;

// ─── Game start — Field opens ────────────────────────────────

export const GatesOpen: React.FC<{ onComplete?: () => void; tier?: string }> = ({
  onComplete,
  tier,
}) => {
  const fade = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(14)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  const copy =
    tier === 'tier3'
      ? { title: 'Storm practice', sub: 'Hold the field under pressure' }
      : tier === 'tier2'
        ? { title: 'Day practice', sub: 'Decisions from dawn to dusk' }
        : { title: 'Field opens', sub: 'Practice begins' };

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(textFade, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]),
      Animated.delay(700),
      Animated.timing(fade, { toValue: 0, duration: 360, useNativeDriver: true }),
    ]).start(onComplete);
  }, [fade, slide, textFade, onComplete]);

  return (
    <Animated.View style={[styles.fullOverlay, { opacity: fade, backgroundColor: 'rgba(11,18,16,0.88)' }]}>
      <Animated.View
        style={{
          opacity: textFade,
          transform: [{ translateY: slide }],
          alignItems: 'center',
          paddingHorizontal: 32,
        }}
      >
        <Text style={styles.brand}>Sukari</Text>
        <Text style={styles.gatesTitle}>{copy.title}</Text>
        <Text style={styles.gatesSub}>{copy.sub}</Text>
      </Animated.View>
    </Animated.View>
  );
};

// ─── Critical zone — Field unsettles ─────────────────────────

export const KingdomTrembles: React.FC<{ zone: 'critical-low' | 'critical-high' }> = ({
  zone,
}) => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 420, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.08, duration: 420, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const border = zone === 'critical-high' ? P.danger : P.cool;
  const wash =
    zone === 'critical-high' ? 'rgba(196,92,92,0.18)' : 'rgba(74,143,168,0.18)';

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.fullOverlay,
        {
          opacity: pulse,
          borderWidth: 10,
          borderColor: border,
          backgroundColor: wash,
        },
      ]}
    />
  );
};

// ─── Plot twist — Metabolic event ────────────────────────────

export const StormApproaches: React.FC<{
  name: string;
  icon: string;
  onComplete?: () => void;
}> = ({ name, icon, onComplete }) => {
  const fade = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(flash, { toValue: 0.45, duration: 70, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0, duration: 90, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]),
      Animated.delay(1100),
      Animated.timing(fade, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start(onComplete);
  }, [fade, flash, slide, onComplete]);

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[styles.fullOverlay, { opacity: flash, backgroundColor: 'rgba(232,240,235,0.25)' }]}
      />
      <Animated.View
        style={[
          styles.fullOverlay,
          {
            opacity: fade,
            backgroundColor: 'rgba(11,18,16,0.82)',
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <Animated.View
          style={{ transform: [{ translateY: slide }], alignItems: 'center', paddingHorizontal: 28 }}
        >
          <Text style={styles.eventEyebrow}>Metabolic event</Text>
          <Text style={styles.stormIcon}>{icon}</Text>
          <Text style={styles.stormText}>{name}</Text>
        </Animated.View>
      </Animated.View>
    </>
  );
};

// ─── Combo — Harmony flash ───────────────────────────────────

export const KingdomRallies: React.FC<{ color: string }> = ({ color }) => {
  const pulse = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(pulse, { toValue: 0.4, duration: 180, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 2.2, duration: 420, useNativeDriver: true }),
    ]).start(() => {
      Animated.timing(pulse, { toValue: 0, duration: 360, useNativeDriver: true }).start();
    });
  }, [pulse, scale]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.fullOverlay, { justifyContent: 'center', alignItems: 'center' }]}
    >
      <Animated.View
        style={{
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: color || P.accent,
          opacity: pulse,
          transform: [{ scale }],
        }}
      />
    </Animated.View>
  );
};

// ─── Defeat — Soft collapse ──────────────────────────────────

export const KingdomFalls: React.FC = () => {
  const grey = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(grey, { toValue: 0.55, duration: 280, useNativeDriver: true }),
      Animated.delay(180),
      Animated.timing(grey, { toValue: 0, duration: 480, useNativeDriver: true }),
    ]).start();
  }, [grey]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.fullOverlay,
        { opacity: grey, backgroundColor: 'rgba(11,18,16,0.75)' },
      ]}
    >
      <View style={styles.collapseCenter}>
        <Text style={styles.collapseText}>Field collapsed</Text>
      </View>
    </Animated.View>
  );
};

// ─── Mechanic unlock glow ────────────────────────────────────

export const NewPowerGlow: React.FC = () => {
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(glow, { toValue: 0.35, duration: 280, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, [glow]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.fullOverlay,
        {
          opacity: glow,
          backgroundColor: P.accentSoft,
          borderWidth: 3,
          borderColor: P.accent,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  fullOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  brand: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 20,
    marginBottom: 16,
  },
  gatesTitle: {
    fontFamily: FONTS.display,
    color: P.textSoft,
    fontSize: 28,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  gatesSub: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  eventEyebrow: {
    fontFamily: FONTS.bodyMedium,
    color: P.warn,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  stormIcon: { fontSize: 40, marginBottom: 8 },
  stormText: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 22,
    textAlign: 'center',
  },
  collapseCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collapseText: {
    fontFamily: FONTS.display,
    color: P.textMuted,
    fontSize: 18,
  },
});
