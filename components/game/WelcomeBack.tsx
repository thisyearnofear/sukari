import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { GameTier, GAME_TIERS } from '@/constants/gameTiers';

type SelectableTier = Exclude<GameTier, 'slowmo'>;

interface WelcomeBackProps {
  maxTierUnlocked: SelectableTier;
  currentTier: SelectableTier;
  onResume: () => void;
  onSkipToTier: (tier: SelectableTier) => void;
  onPlayAgain: () => void;
}

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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0a12' }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 }}>
        Welcome back! 👋
      </Text>
      <Text style={{ fontSize: 14, color: '#9ca3af', marginBottom: 24 }}>
        You&apos;ve unlocked up to {GAME_TIERS[maxTierUnlocked].name}
      </Text>

      {/* Main action: Resume */}
      <TouchableOpacity
        onPress={onResume}
        style={{
          backgroundColor: '#7c3aed',
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }}>
          ▶️ Resume {GAME_TIERS[currentTier].name}
        </Text>
        <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', marginTop: 4 }}>
          Continue your journey
        </Text>
      </TouchableOpacity>

      {/* Tier selector */}
      <Text style={{ fontSize: 12, fontWeight: '600', color: '#9ca3af', marginBottom: 12 }}>
        OR PICK A TIER:
      </Text>

      {tiers.map((tier, idx) => {
        const isUnlocked = tiers.indexOf(tier) <= tiers.indexOf(maxTierUnlocked);
        const isCurrent = tier === currentTier;

        return (
          <TouchableOpacity
            key={tier}
            disabled={!isUnlocked}
            onPress={() => onSkipToTier(tier)}
            style={{
              backgroundColor: isCurrent ? 'rgba(124, 58, 237, 0.3)' : isUnlocked ? 'rgba(79, 70, 229, 0.2)' : 'rgba(75, 85, 99, 0.2)',
              borderWidth: isCurrent ? 2 : 1,
              borderColor: isCurrent ? '#7c3aed' : isUnlocked ? '#4f46e5' : '#374151',
              borderRadius: 8,
              padding: 12,
              marginBottom: 8,
              opacity: isUnlocked ? 1 : 0.5,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: isUnlocked ? '#fff' : '#9ca3af' }}>
                  {GAME_TIERS[tier].name}
                </Text>
                <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                  {tierDescriptions[tier]}
                </Text>
              </View>
              {isCurrent && <Text style={{ color: '#7c3aed', fontWeight: 'bold' }}>→</Text>}
              {!isUnlocked && <Text style={{ color: '#9ca3af', fontWeight: 'bold' }}>🔒</Text>}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};