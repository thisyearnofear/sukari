import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated, Easing } from 'react-native';
import { GameTier, GAME_TIERS } from '@/constants/gameTiers';
import { COLORS, FONTS, ANIMATIONS } from '@/constants/designSystem';
import { MetabolicField } from '@/components/atmosphere/MetabolicField';
import { PressableScale } from '@/components/ui/PressableScale';

type SelectableTier = Exclude<GameTier, 'slowmo'>;

interface WelcomeBackProps {
  maxTierUnlocked: SelectableTier;
  currentTier: SelectableTier;
  onResume: () => void;
  onSkipToTier: (tier: SelectableTier) => void;
  onPlayAgain: () => void;
}

const P = COLORS.PROGRAMME;

export const WelcomeBack: React.FC<WelcomeBackProps> = ({
  maxTierUnlocked,
  currentTier,
  onResume,
  onSkipToTier,
  onPlayAgain,
}) => {
  const tiers: Exclude<GameTier, 'slowmo'>[] = ['tier1', 'tier2', 'tier3', 'weekly'];
  const tierDescriptions: Record<Exclude<GameTier, 'slowmo'>, string> = {
    tier1: 'Learn the basics (30 seconds)',
    tier2: 'Manage your health (60 seconds)',
    tier3: 'Master advanced play (90 seconds)',
    weekly: "Alchemist's Lab Weekly Challenge",
  };
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const { duration, bezier } = ANIMATIONS.MOTION.enter;
    Animated.timing(enter, {
      toValue: 1,
      duration,
      easing: Easing.bezier(bezier[0], bezier[1], bezier[2], bezier[3]),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  return (
    <View style={styles.root}>
      <MetabolicField band="in_range" intensity={0.45} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: enter,
            transform: [
              {
                translateY: enter.interpolate({
                  inputRange: [0, 1],
                  outputRange: [14, 0],
                }),
              },
            ],
          }}
        >
          <Text style={styles.brand}>Glucose Wars</Text>
          <Text style={styles.headline}>Welcome back</Text>
          <Text style={styles.sub}>
            Unlocked through {GAME_TIERS[maxTierUnlocked].name}. One composition — resume or choose a
            tier.
          </Text>

          <PressableScale onPress={onResume} accessibilityRole="button" style={styles.primary}>
            <Text style={styles.primaryText}>Resume {GAME_TIERS[currentTier].name}</Text>
          </PressableScale>

          <Text style={styles.orLabel}>Or pick a tier</Text>

          {tiers.map((tier) => {
            const isUnlocked = tiers.indexOf(tier) <= tiers.indexOf(maxTierUnlocked);
            const isCurrent = tier === currentTier;

            return (
              <PressableScale
                key={tier}
                disabled={!isUnlocked}
                onPress={() => onSkipToTier(tier)}
                accessibilityRole="button"
                style={[
                  styles.tierRow,
                  isCurrent && styles.tierRowCurrent,
                  !isUnlocked && styles.tierRowLocked,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tierName, !isUnlocked && styles.lockedText]}>
                    {GAME_TIERS[tier].name}
                  </Text>
                  <Text style={styles.tierDesc}>{tierDescriptions[tier]}</Text>
                </View>
                <Text style={styles.tierMeta}>{isCurrent ? '→' : !isUnlocked ? 'Locked' : ''}</Text>
              </PressableScale>
            );
          })}

          <PressableScale onPress={onPlayAgain} accessibilityRole="button" style={styles.ghost}>
            <Text style={styles.ghostText}>Back to Realm Home</Text>
          </PressableScale>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.ink,
  },
  scroll: {
    flex: 1,
    zIndex: 10,
  },
  content: {
    padding: 28,
    paddingTop: 56,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  brand: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 28,
    letterSpacing: -0.3,
  },
  headline: {
    fontFamily: FONTS.display,
    color: P.textSoft,
    fontSize: 20,
    marginTop: 8,
  },
  sub: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    marginBottom: 28,
  },
  primary: {
    backgroundColor: P.accent,
    paddingVertical: 16,
    borderRadius: 2,
    alignItems: 'center',
    marginBottom: 28,
  },
  primaryText: {
    fontFamily: FONTS.bodyBold,
    color: P.ink,
    fontSize: 15,
  },
  orLabel: {
    fontFamily: FONTS.bodyMedium,
    color: P.textMuted,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.mist,
    borderRadius: 2,
    marginBottom: 8,
  },
  tierRowCurrent: {
    borderColor: P.accent,
    backgroundColor: P.accentSoft,
  },
  tierRowLocked: {
    opacity: 0.45,
  },
  tierName: {
    fontFamily: FONTS.bodyBold,
    color: P.text,
    fontSize: 14,
  },
  tierDesc: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  tierMeta: {
    fontFamily: FONTS.bodyMedium,
    color: P.accent,
    fontSize: 12,
    marginLeft: 10,
  },
  lockedText: {
    color: P.textMuted,
  },
  ghost: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: P.line,
    borderRadius: 2,
  },
  ghostText: {
    fontFamily: FONTS.bodyMedium,
    color: P.textSoft,
    fontSize: 13,
  },
});
