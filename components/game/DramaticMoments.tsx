/**
 * DramaticMoments — Immersive visual overlays for key game events.
 * Brief, non-blocking, kingdom-themed. All use Animated API only.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

// ─── #1: Game Start — "The Gates Open" ───────────────────────

export const GatesOpen: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const fade = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(textFade, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1.1, friction: 4, useNativeDriver: true }),
      ]),
      Animated.delay(600),
      Animated.timing(fade, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(onComplete);
  }, [fade, scale, textFade, onComplete]);

  return (
    <Animated.View style={[styles.fullOverlay, { opacity: fade, backgroundColor: 'rgba(0,0,0,0.8)' }]}>
      <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
        <Animated.Text style={[styles.gatesEmoji, { opacity: textFade }]}>⚔️</Animated.Text>
        <Animated.Text style={[styles.gatesText, { opacity: textFade }]}>DEFEND!</Animated.Text>
      </Animated.View>
    </Animated.View>
  );
};

// ─── #3: Critical Zone — "The Kingdom Trembles" ──────────────

export const KingdomTrembles: React.FC<{ zone: 'critical-low' | 'critical-high' }> = ({ zone }) => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const color = zone === 'critical-high' ? 'rgba(239,68,68,' : 'rgba(6,182,212,';

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.fullOverlay, {
        opacity: pulse,
        borderWidth: 8,
        borderColor: zone === 'critical-high' ? '#ef4444' : '#06b6d4',
        backgroundColor: `${color}0.15)`,
      }]}
    />
  );
};

// ─── #4: Plot Twist — "A Storm Approaches" ───────────────────

export const StormApproaches: React.FC<{ name: string; icon: string; onComplete?: () => void }> = ({ name, icon, onComplete }) => {
  const fade = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.sequence([
      // Lightning flash
      Animated.timing(flash, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0, duration: 80, useNativeDriver: true }),
      // Reveal
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]),
      Animated.delay(1200),
      Animated.timing(fade, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(onComplete);
  }, [fade, flash, scale, onComplete]);

  return (
    <>
      <Animated.View pointerEvents="none" style={[styles.fullOverlay, { opacity: flash, backgroundColor: 'rgba(255,255,255,0.6)' }]} />
      <Animated.View style={[styles.fullOverlay, { opacity: fade, backgroundColor: 'rgba(88,28,135,0.7)', justifyContent: 'center', alignItems: 'center' }]}>
        <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
          <Text style={styles.stormIcon}>{icon}</Text>
          <Text style={styles.stormText}>{name}</Text>
          <Text style={styles.stormSub}>⚡ PLOT TWIST ⚡</Text>
        </Animated.View>
      </Animated.View>
    </>
  );
};

// ─── #2: First Combo — "The Kingdom Rallies" ─────────────────

export const KingdomRallies: React.FC<{ color: string }> = ({ color }) => {
  const pulse = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(pulse, { toValue: 0.5, duration: 200, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 2.5, friction: 6, useNativeDriver: true }),
    ]).start(() => {
      Animated.timing(pulse, { toValue: 0, duration: 400, useNativeDriver: true }).start();
    });
  }, [pulse, scale]);

  return (
    <Animated.View pointerEvents="none" style={[styles.fullOverlay, { justifyContent: 'center', alignItems: 'center' }]}>
      <Animated.View style={{
        width: 200, height: 200, borderRadius: 100,
        backgroundColor: color, opacity: pulse,
        transform: [{ scale }],
      }} />
    </Animated.View>
  );
};

// ─── #6: Defeat — "The Kingdom Falls" ────────────────────────

export const KingdomFalls: React.FC = () => {
  const grey = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(grey, { toValue: 0.6, duration: 300, useNativeDriver: true }),
      Animated.delay(200),
      Animated.timing(grey, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [grey]);

  return (
    <Animated.View pointerEvents="none" style={[styles.fullOverlay, { opacity: grey, backgroundColor: 'rgba(30,30,30,0.8)' }]}>
      <View style={styles.crackContainer}>
        {['╲', '╱', '│', '─', '╲'].map((c, i) => (
          <Text key={i} style={[styles.crack, { left: `${15 + i * 17}%`, top: `${20 + (i % 3) * 25}%`, transform: [{ rotate: `${i * 35}deg` }] }]}>{c}</Text>
        ))}
      </View>
    </Animated.View>
  );
};

// ─── #7: Mechanic Unlock — "New Power" glow ──────────────────

export const NewPowerGlow: React.FC = () => {
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(glow, { toValue: 0.4, duration: 300, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, [glow]);

  return (
    <Animated.View pointerEvents="none" style={[styles.fullOverlay, {
      opacity: glow, backgroundColor: 'rgba(34,197,94,0.3)',
      borderWidth: 4, borderColor: '#22c55e',
    }]} />
  );
};

const styles = StyleSheet.create({
  fullOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  gatesEmoji: { fontSize: 64, marginBottom: 8 },
  gatesText: { color: '#fbbf24', fontSize: 32, fontWeight: 'bold', letterSpacing: 6 },
  stormIcon: { fontSize: 56, marginBottom: 8 },
  stormText: { color: '#fff', fontSize: 22, fontWeight: 'bold', letterSpacing: 2 },
  stormSub: { color: '#c4b5fd', fontSize: 12, marginTop: 4, letterSpacing: 3 },
  crackContainer: { ...StyleSheet.absoluteFillObject },
  crack: { position: 'absolute', color: 'rgba(255,255,255,0.4)', fontSize: 48, fontWeight: 'bold' },
});
