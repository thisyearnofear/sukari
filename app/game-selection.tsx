import React from 'react';
import { useRouter } from 'expo-router';
import { GameSelectionScreen } from '@/components/game/GameSelectionScreen';
import { GameTier } from '@/constants/gameTiers';
import { ControlMode, GameMode } from '@/types/game';
import { track } from '@/utils/analytics';

export default function GameSelectionRoute() {
  const router = useRouter();

  React.useEffect(() => {
    track('screen_view', { screen: 'game_selection' });
  }, []);

  const handleStartGame = (tier: GameTier, controlMode: ControlMode, gameMode?: GameMode) => {
    track('start_game_clicked', {
      from: 'game_selection',
      tier,
      control_mode: controlMode,
      game_mode: gameMode ?? 'classic',
    });
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
