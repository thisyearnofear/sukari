import React from 'react';
import { useRouter } from 'expo-router';
import { GameSelectionScreen } from '@/components/game/GameSelectionScreen';
import { GameTier } from '@/constants/gameTiers';
import { ControlMode, GameMode } from '@/types/game';

export default function GameSelectionRoute() {
  const router = useRouter();

  const handleStartGame = (tier: GameTier, controlMode: ControlMode, gameMode?: GameMode) => {
    if (gameMode === 'slowmo') {
      router.push('/slowmo');
      return;
    }

    router.push({
      pathname: '/(game)/onboarding',
      params: { tier, controlMode, gameMode: gameMode ?? 'classic' },
    });
  };

  return (
    <GameSelectionScreen
      onStartGame={handleStartGame}
      onBack={() => router.back()}
    />
  );
}
