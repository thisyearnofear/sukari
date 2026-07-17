import React, { useEffect } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Onboarding } from '@/components/game/Onboarding';
import { useGameSession } from '@/context/GameSessionContext';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
import { ControlMode } from '@/types/game';
import { GameTier } from '@/constants/gameTiers';
import { track } from '@/utils/analytics';

export default function OnboardingScreen() {
  const params = useLocalSearchParams<{ tier?: string; controlMode?: string; gameMode?: string }>();
  const { controlMode, setControlMode, tierConfig, startGameForTier, healthProfile, setSelectedTier, selectedTier } = useGameSession();
  const { progress, setSkipOnboarding } = usePlayerProgressContext();

  useEffect(() => {
    track('screen_view', { screen: 'onboarding', tier: params.tier ?? selectedTier, privacy_mode: progress.privacyMode });
    track('onboarding_started', {
      tier: params.tier ?? selectedTier,
      control_mode: params.controlMode ?? controlMode,
      game_mode: params.gameMode ?? tierConfig.gameMode,
      privacy_mode: progress.privacyMode,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    track('onboarding_completed', { tier: selectedTier, control_mode: mode, game_mode: tierConfig.gameMode, privacy_mode: progress.privacyMode });
    startGameForTier();
    router.replace('/(game)/battle');
  };

  const handleSkip = (mode: ControlMode) => {
    setControlMode(mode);
    setSkipOnboarding(true);
    track('onboarding_skipped', { tier: selectedTier, control_mode: mode, game_mode: tierConfig.gameMode, privacy_mode: progress.privacyMode });
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
