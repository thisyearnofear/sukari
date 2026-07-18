import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { BattleScreen } from '@/components/game/BattleScreen';
import { VictoryCelebration } from '@/components/game/VictoryCelebration';
import { NewPowerGlow } from '@/components/game/DramaticMoments';
import { useGameSession } from '@/context/GameSessionContext';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
import { SwipeDirection, SwipeAction } from '@/types/game';
import { track } from '@/utils/analytics';
import { MECHANIC_DISCOVERY_MESSAGES } from '@/constants/mechanicMessages';
import { COLORS } from '@/constants/designSystem';

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
    missionToast,
    questCompletionToast,
    promotionToast,
    loreToast,
    hasMechanic,
    mechanicDiscoveryToast,
  } = usePlayerProgressContext();

  const toast = missionToast || questCompletionToast;

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

  // Transition to results when game ends — show celebration first.
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
    tierConfig.requiresWin,
    controlMode,
    gameState.comboCount,
    gameState.correctSwipes,
    gameState.gameMode,
    gameState.incorrectSwipes,
    gameState.plotTwistsTriggered,
    gameState.score,
    gameState.timeInBalanced,
    gameState.timeInCritical,
    gameState.timeInWarning,
    progress.privacyMode,
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
    },
    [baseHandleSwipe],
  );

  const handleToggleControlMode = useCallback(() => {
    setControlMode(controlMode === 'swipe' ? 'tap' : 'swipe');
  }, [controlMode, setControlMode]);

  const handleExit = useCallback(() => {
    router.replace('/');
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.PROGRAMME.ink }}>
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
        hasMechanic={hasMechanic}
        missionAction={progress.activeMission?.realWorldAction}
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
      {toast && (
        <View style={{ position: 'absolute', top: 100, left: 20, right: 20, zIndex: 200, backgroundColor: 'rgba(18,26,23,0.96)', padding: 12, borderRadius: 2, borderWidth: 1, borderColor: '#3D9B7A', alignItems: 'center' }}>
          <Text style={{ color: '#E8F0EB', fontWeight: '600', fontSize: 13 }}>{toast.title}</Text>
          <Text style={{ color: '#8FA397', fontSize: 11, marginTop: 2 }}>Mission progress</Text>
        </View>
      )}
      {promotionToast && (
        <View style={{ position: 'absolute', top: 100, left: 20, right: 20, zIndex: 200, backgroundColor: 'rgba(18,26,23,0.96)', padding: 14, borderRadius: 2, borderWidth: 1, borderColor: '#3D9B7A', alignItems: 'center' }}>
          <Text style={{ color: '#E8F0EB', fontWeight: '600', fontSize: 14 }}>Progress milestone</Text>
          <Text style={{ color: '#B7C7BC', fontSize: 12, marginTop: 2 }}>{promotionToast.title}</Text>
        </View>
      )}
      {loreToast && (
        <View style={{ position: 'absolute', top: 100, left: 20, right: 20, zIndex: 200, backgroundColor: 'rgba(18,26,23,0.96)', padding: 12, borderRadius: 2, borderWidth: 1, borderColor: 'rgba(180,210,195,0.2)', alignItems: 'center' }}>
          <Text style={{ color: '#B7C7BC', fontWeight: '600', fontSize: 12 }}>Insight unlocked</Text>
        </View>
      )}
      {mechanicDiscoveryToast && (
        <>
        <NewPowerGlow />
        <View style={{ position: 'absolute', top: 100, left: 20, right: 20, zIndex: 200, backgroundColor: 'rgba(18,26,23,0.96)', padding: 14, borderRadius: 2, borderWidth: 1, borderColor: '#3D9B7A', alignItems: 'center' }}>
          <Text style={{ color: '#E8F0EB', fontWeight: '600', fontSize: 14 }}>{MECHANIC_DISCOVERY_MESSAGES[mechanicDiscoveryToast].title}</Text>
          <Text style={{ color: '#8FA397', fontSize: 11, marginTop: 2 }}>{MECHANIC_DISCOVERY_MESSAGES[mechanicDiscoveryToast].sub}</Text>
        </View>
        </>
      )}
    </View>
  );
}
