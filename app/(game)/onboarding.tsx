import React, { useEffect } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Onboarding } from '@/components/game/Onboarding';
import { useGameSession } from '@/context/GameSessionContext';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
import { ControlMode } from '@/types/game';
import { GameTier } from '@/constants/gameTiers';

export default function OnboardingScreen() {
  const params = useLocalSearchParams<{ tier?: string; controlMode?: string; gameMode?: string }>();
  const { controlMode, setControlMode, tierConfig, startGameForTier, healthProfile, setSelectedTier, selectedTier } = useGameSession();
  const { progress, setSkipOnboarding } = usePlayerProgressContext();

  // Apply route params from game-selection
  useEffect(() => {
    if (params.tier && params.tier !== selectedTier) {
      setSelectedTier(params.tier as GameTier);
    }
    if (params.controlMode) {
      setControlMode(params.controlMode as ControlMode);
    }
  }, [params.tier, params.controlMode, selectedTier, setControlMode, setSelectedTier]);

  // Skip onboarding if player has opted out
  useEffect(() => {
    if (progress.skipOnboarding) {
      startGameForTier();
      router.replace('/(game)/battle');
    }
  }, [progress.skipOnboarding, startGameForTier]);

  const handleComplete = (mode: ControlMode) => {
    setControlMode(mode);
    startGameForTier();
    router.replace('/(game)/battle');
  };

  const handleSkip = (mode: ControlMode) => {
    setControlMode(mode);
    setSkipOnboarding(true);
    startGameForTier();
    router.replace('/(game)/battle');
  };

  if (progress.skipOnboarding) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <Onboarding
        onComplete={handleComplete}
        onSkip={handleSkip}
        defaultControlMode={controlMode}
        gameMode={tierConfig.gameMode}
        healthProfile={healthProfile.healthProfile}
        userMode={progress.userMode || undefined}
      />
    </View>
  );
}
