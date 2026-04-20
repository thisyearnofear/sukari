import React, { useCallback } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ResultsScroll } from '@/components/game/ResultsScroll';
import { useGameSession } from '@/context/GameSessionContext';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
import { GameTier } from '@/constants/gameTiers';
import { track } from '@/utils/analytics';

export default function ResultsScreen() {
  const {
    battleGame,
    tierConfig,
    healthProfile,
    selectedTier,
    setSelectedTier,
  } = useGameSession();

  const { gameState } = battleGame;
  const { progress } = usePlayerProgressContext();

  React.useEffect(() => {
    track('screen_view', { screen: 'results', tier: selectedTier, privacy_mode: progress.privacyMode });
    track('results_viewed', {
      tier: selectedTier,
      result: gameState.gameResult || 'defeat',
      privacy_mode: progress.privacyMode,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlayAgain = useCallback(() => {
    // Victory = always advance to next tier. Defeat = replay same tier.
    const isVictory = gameState.gameResult === 'victory';
    const tierOrder: GameTier[] = ['tier1', 'tier2', 'tier3'];
    const currentIdx = tierOrder.indexOf(selectedTier);
    const nextTier = tierOrder[currentIdx + 1];

    if (isVictory && nextTier) {
      track('tier_advanced', { from_tier: selectedTier, to_tier: nextTier, privacy_mode: progress.privacyMode });
      setSelectedTier(nextTier);
      router.replace('/(game)/onboarding');
    } else {
      track('play_again_clicked', { tier: selectedTier, privacy_mode: progress.privacyMode });
      router.replace('/(game)/onboarding');
    }
  }, [selectedTier, progress.privacyMode, gameState.gameResult, setSelectedTier]);

  const handleMainMenu = useCallback(() => {
    track('main_menu_clicked', { from: 'results', tier: selectedTier, privacy_mode: progress.privacyMode });
    router.replace('/');
  }, [selectedTier, progress.privacyMode]);

  return (
      <View style={{ flex: 1 }}>
        <ResultsScroll
          result={gameState.gameResult || 'defeat'}
          score={gameState.score}
          glucoseLevel={gameState.stability}
          correctSwipes={gameState.correctSwipes}
          incorrectSwipes={gameState.incorrectSwipes}
          timeInBalanced={gameState.timeInBalanced}
          comboMax={gameState.comboCount}
          onPlayAgain={handlePlayAgain}
          onMainMenu={handleMainMenu}
          gameMode={tierConfig.gameMode}
          finalMetrics={gameState.metrics}
          morningCondition={gameState.morningCondition}
          gameState={gameState}
          healthProfile={tierConfig.healthProfile ? healthProfile.healthProfile : undefined}
          tier={selectedTier || 'tier1'}
          dexcomOption={tierConfig.dexcomOption}
          userMode={progress.userMode || undefined}
        />
      </View>
  );
}
