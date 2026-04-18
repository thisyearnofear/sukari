import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, Animated as RNAnimated } from 'react-native';
import { router } from 'expo-router';
import { BattleScreen } from '@/components/game/BattleScreen';
import { VictoryCelebration } from '@/components/game/VictoryCelebration';
import { useGameSession } from '@/context/GameSessionContext';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
import { SwipeDirection, SwipeAction } from '@/types/game';
import { track } from '@/utils/analytics';

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
    progress,
    incrementGamesPlayed,
    updateBestScore,
    unlockNextTier,
    trackQuestProgress,
    questCompletionToast,
    promotionToast,
    loreToast,
  } = usePlayerProgressContext();

  const hasTransitionedToResults = useRef(false);
  const hasTrackedBattleStart = useRef(false);
  const [showCelebration, setShowCelebration] = useState<'victory' | 'defeat' | null>(null);

  useEffect(() => {
    track('screen_view', { screen: 'battle', tier: selectedTier, privacy_mode: progress.privacyMode });
    // We intentionally don’t attach health-related props here.
  }, [selectedTier, progress.privacyMode]);

  // Track battle start once when gameplay becomes active
  useEffect(() => {
    if (gameState.isGameActive && !hasTrackedBattleStart.current) {
      hasTrackedBattleStart.current = true;
      track('battle_started', {
        tier: selectedTier,
        game_mode: gameState.gameMode,
        control_mode: controlMode,
        privacy_mode: progress.privacyMode,
      });
    }
  }, [gameState.isGameActive, selectedTier, gameState.gameMode, controlMode, progress.privacyMode]);

  // Transition to results when game ends — show celebration first
  useEffect(() => {
    if (!gameState.isGameActive && gameState.gameResult && !hasTransitionedToResults.current) {
      hasTransitionedToResults.current = true;
      track('battle_ended', {
        tier: selectedTier,
        game_mode: gameState.gameMode,
        control_mode: controlMode,
        result: gameState.gameResult,
        score: gameState.score,
        correct_swipes: gameState.correctSwipes,
        incorrect_swipes: gameState.incorrectSwipes,
        time_in_balanced: gameState.timeInBalanced,
        time_in_warning: gameState.timeInWarning,
        time_in_critical: gameState.timeInCritical,
        combo_max: gameState.comboCount,
        plot_twists_triggered: gameState.plotTwistsTriggered,
        privacy_mode: progress.privacyMode,
      });
      handleGameResult({
        incrementGamesPlayed,
        updateBestScore,
        unlockNextTier,
        currentTier: selectedTier,
        requiresWin: tierConfig.requiresWin,
      });
      setShowCelebration(gameState.gameResult);
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
      hasTrackedBattleStart.current = false;
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
    router.replace('/');
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
      {showCelebration && (
        <VictoryCelebration
          result={showCelebration}
          isPersonalBest={gameState.score > progress.bestScore}
          onComplete={() => {
            setShowCelebration(null);
            router.replace('/(game)/results');
          }}
        />
      )}
      {questCompletionToast && (
        <View style={{ position: 'absolute', top: 100, left: 20, right: 20, zIndex: 200, backgroundColor: 'rgba(251,191,36,0.95)', padding: 12, borderRadius: 12, alignItems: 'center' }}>
          <Text style={{ color: '#0a0a12', fontWeight: 'bold', fontSize: 13 }}>🎉 Quest Complete: {questCompletionToast.title}</Text>
          <Text style={{ color: '#0a0a12', fontSize: 11 }}>+{questCompletionToast.reward} Renown</Text>
        </View>
      )}
      {promotionToast && (
        <View style={{ position: 'absolute', top: 100, left: 20, right: 20, zIndex: 200, backgroundColor: 'rgba(168,85,247,0.95)', padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#c4b5fd' }}>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>{promotionToast.icon} PROMOTED!</Text>
          <Text style={{ color: '#e9d5ff', fontSize: 12 }}>You are now a {promotionToast.title}</Text>
        </View>
      )}
      {loreToast && (
        <View style={{ position: 'absolute', top: 100, left: 20, right: 20, zIndex: 200, backgroundColor: 'rgba(59,130,246,0.95)', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#93c5fd' }}>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>📜 Kingdom Lore Discovered! +50 Renown</Text>
        </View>
      )}
    </View>
  );
}
