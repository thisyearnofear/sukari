/**
 * PROGRESS INDICATOR - Visual feedback for tier progression
 * 
 * Shows user which tier they're on and tier completion status
 * Used in MainMenu and during game to provide visual context
 */

import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { COLORS, SPACING } from '@/constants/designSystem';
import { GameTier } from '@/constants/gameTiers';

const { width } = Dimensions.get('window');
const maxWidth = Math.min(width * 0.9, 400);

interface ProgressIndicatorProps {
  currentTier: GameTier;
  unlockedTiers: GameTier[];
  variant?: 'compact' | 'detailed';
  showLabel?: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentTier,
  unlockedTiers,
  variant = 'detailed',
  showLabel = true,
}) => {
  const tiers: GameTier[] = ['tier1', 'tier2', 'tier3'];
  const tierLabels: Partial<Record<GameTier, { emoji: string; name: string; desc: string }>> = {
    tier1: { emoji: '🎓', name: 'Tutorial', desc: '30 sec warmup' },
    tier2: { emoji: '⚔️', name: 'Challenge 1', desc: '60 sec battle' },
    tier3: { emoji: '👑', name: 'Challenge 2', desc: '90 sec epic' },
  };

  const getCurrentTierIndex = () => tiers.indexOf(currentTier);

  if (variant === 'compact') {
    return (
      <View
        className="flex-row justify-center items-center gap-2"
        style={{
          width: maxWidth,
        }}
      >
        {tiers.map((tier, index) => {
          const isActive = currentTier === tier;
          const isUnlocked = unlockedTiers.includes(tier);
          const isCompleted = index < getCurrentTierIndex();

          return (
            <View key={tier} className="flex-1">
              {/* Tier dot */}
              <View
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: isActive
                    ? COLORS.PRIMARY
                    : isCompleted
                    ? COLORS.SUCCESS
                    : isUnlocked
                    ? COLORS.WARNING
                    : COLORS.BORDER,
                }}
              />
              {/* Connecting line */}
              {index < tiers.length - 1 && (
                <View
                  className="absolute top-1.5 left-full w-8 h-0.5"
                  style={{
                    backgroundColor: isCompleted ? COLORS.SUCCESS : COLORS.BORDER,
                  }}
                />
              )}
            </View>
          );
        })}
      </View>
    );
  }

  // Detailed variant
  return (
    <View
      className="bg-black/60 p-4 rounded-lg border"
      style={{
        width: maxWidth,
        borderColor: COLORS.ZONES.balanced,
      }}
    >
      {/* Header */}
      {showLabel && (
        <Text className="text-cyan-400 text-xs font-bold mb-3">
          🎮 TIER PROGRESSION
        </Text>
      )}

      {/* Tier list */}
      <View className="gap-2">
        {tiers.map((tier, index) => {
          const isActive = currentTier === tier;
          const isUnlocked = unlockedTiers.includes(tier);
          const isCompleted = index < getCurrentTierIndex();
          const tierInfo = tierLabels[tier];

          let statusColor: string = COLORS.BORDER;
          let statusIcon = '🔒';
          if (isCompleted) {
            statusColor = COLORS.SUCCESS;
            statusIcon = '✓';
          } else if (isActive) {
            statusColor = COLORS.PRIMARY;
            statusIcon = '▶';
          } else if (isUnlocked) {
            statusColor = COLORS.WARNING;
            statusIcon = '◯';
          }

          return (
            <View key={tier} className="flex-row items-center">
              {/* Status indicator */}
              <Text
                className="w-6 text-center mr-3 font-bold"
                style={{ color: statusColor as any }}
              >
                {statusIcon}
              </Text>

              {/* Tier info */}
              <View className="flex-1">
                {tierInfo && (
                  <>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-lg">{tierInfo.emoji}</Text>
                      <Text
                        className="font-bold text-sm"
                        style={{
                          color: isActive ? COLORS.PRIMARY : COLORS.TEXT_PRIMARY,
                        }}
                      >
                        {tierInfo.name}
                      </Text>
                    {isCompleted && <Text className="text-xs text-green-400">Completed</Text>}
                    {isActive && <Text className="text-xs text-blue-400">Current</Text>}
                    </View>
                    <Text className="text-xs text-gray-500 mt-0.5">
                      {tierInfo.desc}
                    </Text>
                  </>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Current tier description */}
      <View className="mt-3 pt-3 border-t border-gray-700">
        <Text className="text-xs text-gray-400">
          {currentTier === 'tier1' &&
            '⏱️ Get comfortable with controls in this 30-second tutorial. Auto-advance to Tier 2!'}
          {currentTier === 'tier2' &&
            '🎯 Win this 60-second challenge to unlock Tier 3. Learn glucose basics with real Dexcom data.'}
          {currentTier === 'tier3' &&
            '👑 Master this 90-second challenge and mint your achievement as an NFT!'}
        </Text>
      </View>
    </View>
  );
};
