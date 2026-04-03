import React, { useEffect, useRef, useCallback } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { BattleScreen } from '@/components/game/BattleScreen';
import { useGameSession } from '@/context/GameSessionContext';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
import { SwipeDirection, SwipeAction } from '@/types/game';

export default function BattleScreenRoute() {
  const {
    battleGame,
    controlMode,
    setControlMode,
    tierConfig,
    healthProfile,
    startGameForTier,
    handleGameResult,
    selectedTier,
  } = useGameSession();

  const {
    gameState,
    handleSwipe: baseHandleSwipe,
    useExercise,
    useRations,
    pauseGame,
    resumeGame,
    consumeSavedFood,
  } = battleGame;

  const {
    incrementGamesPlayed,
    updateBestScore,
    unlockNextTier,
    trackQuestProgress,
  } = usePlayerProgressContext();

  const hasTransitionedToResults = useRef(false);

  // Transition to results when game ends
  useEffect(() => {
    if (!gameState.isGameActive && gameState.gameResult && !hasTransitionedToResults.current) {
      hasTransitionedToResults.current = true;
      handleGameResult({
        incrementGamesPlayed,
        updateBestScore,
        unlockNextTier,
        currentTier: selectedTier,
        requiresWin: tierConfig.requiresWin,
      });
      router.replace('/(game)/results');
    }
  }, [
    gameState.isGameActive, 
    gameState.gameResult, 
    handleGameResult, 
    incrementGamesPlayed, 
    updateBestScore, 
    unlockNextTier, 
    selectedTier, 
    tierConfig.requiresWin
  ]);

  // Reset transition flag when game becomes active
  useEffect(() => {
    if (gameState.isGameActive) {
      hasTransitionedToResults.current = false;
    }
  }, [gameState.isGameActive]);

  const handleSwipe = useCallback(
    (foodId: string, direction: SwipeDirection, action: SwipeAction) => {
      baseHandleSwipe(foodId, direction, action);

      const food = gameState.foods.find(f => f.id === foodId);
      if (!food) return;

      if (action === 'save' && (food.faction === 'ally' || food.isContextuallyGood)) {
        trackQuestProgress('save_healthy');
      } else if (action === 'reject' && (food.faction === 'enemy' || !food.isContextuallyGood)) {
        trackQuestProgress('reject_enemy');
      } else if (action === 'share' && (food.faction === 'ally' || food.isContextuallyGood)) {
        trackQuestProgress('share_ally');
      }
    },
    [baseHandleSwipe, gameState.foods, trackQuestProgress],
  );

  const handleToggleControlMode = useCallback(() => {
    setControlMode(controlMode === 'swipe' ? 'tap' : 'swipe');
  }, [controlMode, setControlMode]);

  const handleExit = useCallback(() => {
    router.replace('/welcome');
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a12' }}>
      <BattleScreen
        gameState={gameState}
        onSwipe={handleSwipe}
        onExercise={useExercise}
        onRations={useRations}
        controlMode={controlMode}
        onPause={pauseGame}
        onResume={resumeGame}
        onRestart={() => startGameForTier()}
        onConsumeSaved={consumeSavedFood}
        onExit={handleExit}
        healthProfile={tierConfig.healthProfile ? healthProfile.healthProfile : undefined}
        onAdministerInsulin={healthProfile.administerInsulin}
        tierConfig={tierConfig}
        onToggleControlMode={handleToggleControlMode}
      />
    </View>
  );
}
