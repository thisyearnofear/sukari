import React, { useState, useEffect, useRef } from 'react';
import { View, Text, AccessibilityInfo } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BattleScreen } from '@/components/game/BattleScreen';
import { ResultsScroll } from '@/components/game/ResultsScroll';
import { Onboarding } from '@/components/game/Onboarding';
import { WelcomeBack } from '@/components/game/WelcomeBack';
import { MainMenu } from '@/components/game/MainMenu';
import { GameSelectionScreen } from '@/components/game/GameSelectionScreen';
import { SlowMoMode } from '@/components/game/SlowMoMode';
import { SlowMoResults } from '@/components/game/SlowMoResults';
import { SlowMoStats } from '@/components/game/SlowMoStats';
import { ProgressIndicator } from '@/components/game/ProgressIndicator';
import { useBattleGame } from '@/hooks/useBattleGame';
import { useHealthProfile } from '@/hooks/useHealthProfile';
import { usePlayerProgress } from '@/hooks/usePlayerProgress';
import { ControlMode, GameMode } from '@/types/game';
import { GAME_TIERS, GameTier } from '@/constants/gameTiers';
import {
  AppScreen,
  SCREEN_METADATA,
  VALID_TRANSITIONS,
  isValidTransition,
  getNavigationBreadcrumb,
  getTransitionDescription,
  getProgressIndicator
} from '@/constants/navigation';

export default function HomeScreen() {
  const { progress, unlockNextTier, updateBestScore, incrementGamesPlayed, setSkipOnboarding, setCurrentTier, getSlowMoAnalytics } =
    usePlayerProgress();

  const [appScreen, setAppScreen] = useState<AppScreen>('menu');
  const [controlMode, setControlMode] = useState<ControlMode>('swipe');
  const [selectedHealthScenario, setSelectedHealthScenario] = useState<string | null>(null);
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>('classic');
  const [lastSlowMoSession, setLastSlowMoSession] = useState<any>(null);
  const hasTransitionedToResults = useRef(false);

  // Ensure we always have a valid tier config
  const currentTier = progress.currentTier || 'tier1';
  const tierConfig = GAME_TIERS[currentTier];

  /**
   * Navigate to a screen with validation
   * Uses the navigation state machine to ensure valid transitions
   */
  const navigateTo = (to: AppScreen) => {
    if (!isValidTransition(appScreen, to)) {
      console.warn(`Invalid navigation from ${appScreen} to ${to}`);
      return false;
    }

    // Announce transition for accessibility
    const description = getTransitionDescription(appScreen, to);
    console.log(`Navigation: ${description}`);
    AccessibilityInfo.announceForAccessibility(description);

    setAppScreen(to);
    return true;
  };

  /**
   * Render screen header with breadcrumb and progress indicator
   */
  const renderScreenHeader = (screen: AppScreen) => {
    const breadcrumb = getNavigationBreadcrumb(screen);
    const progressInfo = getProgressIndicator(screen, currentTier);
    const unlockedTiers = [...(['tier1'] as const), ...(progress.maxTierUnlocked !== 'tier1' ? [progress.maxTierUnlocked] : [])];

    return (
      <View style={{ padding: 10, backgroundColor: '#1a1a2e' }}>
        <Text style={{ color: '#fff', fontSize: 14 }}>{breadcrumb}</Text>
        {progressInfo.current > 0 && (
          <View style={{ marginTop: 5 }}>
            <ProgressIndicator
              currentTier={currentTier as any}
              unlockedTiers={unlockedTiers}
              variant="compact"
              showLabel={true}
            />
          </View>
        )}
      </View>
    );
  };

  /**
   * Screen map for rendering components
   * Centralizes all screen rendering logic
   */
  const screenMap: Record<AppScreen, () => JSX.Element> = {
    menu: () => (
      <View style={{ flex: 1 }}>
        <View style={{ padding: 10, backgroundColor: '#1a1a2e' }}>
          <Text style={{ color: '#fff', fontSize: 14 }}>{getNavigationBreadcrumb('menu')}</Text>
        </View>
        <MainMenu
          onStartGame={handleStartGame}
          onSelectGame={handleSelectGame}
          onViewStats={handleViewStats}
          userModeSelected={progress.userMode !== null}
        />
      </View>
    ),
    game_selection: () => (
      <View style={{ flex: 1 }}>
        <View style={{ padding: 10, backgroundColor: '#1a1a2e' }}>
          <Text style={{ color: '#fff', fontSize: 14 }}>{getNavigationBreadcrumb('game_selection')}</Text>
        </View>
        <GameSelectionScreen
          onStartGame={handleStartGameWithTier}
          onBack={handleBackFromGameSelection}
        />
      </View>
    ),
    slowmo: () => (
      <View style={{ flex: 1 }}>
        <View style={{ padding: 10, backgroundColor: '#1a1a2e' }}>
          <Text style={{ color: '#fff', fontSize: 14 }}>{getNavigationBreadcrumb('slowmo')}</Text>
        </View>
        <SlowMoMode
          onStartGame={(mode: GameMode) => {
            // After SlowMoMode completes, return to menu
            navigateTo('menu');
          }}
          onBack={() => navigateTo('game_selection')}
          onComplete={() => {
            // Session completed and recorded - show results
            const lastSession = progress.slowMoSessions?.[progress.slowMoSessions.length - 1];
            if (lastSession) {
              setLastSlowMoSession(lastSession);
              navigateTo('slowmo_results');
            } else {
              navigateTo('menu');
            }
          }}
        />
      </View>
    ),
    slowmo_results: () => lastSlowMoSession ? (
      <View style={{ flex: 1 }}>
        <View style={{ padding: 10, backgroundColor: '#1a1a2e' }}>
          <Text style={{ color: '#fff', fontSize: 14 }}>{getNavigationBreadcrumb('slowmo_results')}</Text>
        </View>
        <SlowMoResults
          session={lastSlowMoSession}
          sessionNumber={progress.slowMoSessionsCompleted || 1}
          onContinue={() => navigateTo('menu')}
        />
      </View>
    ) : screenMap.menu(),
    slowmo_stats: () => (
      <View style={{ flex: 1 }}>
        <View style={{ padding: 10, backgroundColor: '#1a1a2e' }}>
          <Text style={{ color: '#fff', fontSize: 14 }}>{getNavigationBreadcrumb('slowmo_stats')}</Text>
        </View>
        <SlowMoStats
          analytics={getSlowMoAnalytics()}
          onClose={handleCloseStats}
        />
      </View>
    ),
    onboarding: () => (
      <View style={{ flex: 1 }}>
        {renderScreenHeader('onboarding')}
        <Onboarding
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
          defaultControlMode={controlMode}
          gameMode={tierConfig.gameMode}
          healthProfile={healthProfile}
          userMode={progress.userMode || undefined}
        />
      </View>
    ),
    results: () => (
      <View style={{ flex: 1 }}>
        <View style={{ padding: 10, backgroundColor: '#1a1a2e' }}>
          <Text style={{ color: '#fff', fontSize: 14 }}>{getNavigationBreadcrumb('results')}</Text>
        </View>
        <ResultsScroll
          result={gameState.gameResult || 'defeat'}
          score={gameState.score}
          glucoseLevel={gameState.stability}
          correctSwipes={gameState.correctSwipes}
          incorrectSwipes={gameState.incorrectSwipes}
          timeInBalanced={gameState.timeInBalanced}
          comboMax={gameState.comboCount}
          onPlayAgain={handleResultsNext}
          onMainMenu={handleExit}
          gameMode={tierConfig.gameMode}
          finalMetrics={gameState.metrics}
          morningCondition={gameState.morningCondition}
          gameState={gameState}
          healthProfile={tierConfig.healthProfile ? healthProfile : undefined}
          tier={currentTier || 'tier1'}
          dexcomOption={tierConfig.dexcomOption}
          userMode={progress.userMode || undefined}
        />
      </View>
    ),
    battle: () => (
      <View style={{ flex: 1, backgroundColor: '#0a0a12' }}>
        {renderScreenHeader('battle')}
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
          healthProfile={tierConfig.healthProfile ? healthProfile : undefined}
          onAdministerInsulin={administerInsulin}
          tierConfig={tierConfig}
          onToggleControlMode={handleToggleControlMode}
        />
      </View>
    ),
    welcome: () => (
      <View style={{ flex: 1 }}>
        <View style={{ padding: 10, backgroundColor: '#1a1a2e' }}>
          <Text style={{ color: '#fff', fontSize: 14 }}>{getNavigationBreadcrumb('welcome')}</Text>
        </View>
        <WelcomeBack
          maxTierUnlocked={(progress.maxTierUnlocked as any) || 'tier1'}
          currentTier={currentTier as any}
          onResume={() => navigateTo('battle')}
          onSkipToTier={(tier) => {
            setCurrentTier(tier);
            navigateTo('onboarding');
          }}
          onPlayAgain={() => navigateTo('menu')}
        />
      </View>
    ),
  };

  const {
    healthProfile,
    startGlucoseSimulation,
    stopGlucoseSimulation,
    logMeal,
    administerInsulin,
  } = useHealthProfile(selectedHealthScenario as any || undefined);

  const {
    gameState,
    startGame,
    handleSwipe,
    useExercise,
    useRations,
    pauseGame,
    resumeGame,
    restartGame,
    consumeSavedFood,
  } = useBattleGame(logMeal, tierConfig, progress.userMode || undefined);

  const handleStartGame = (controlMode: ControlMode) => {
    setControlMode(controlMode);
    startGameForTier();
  };

  const handleStartGameWithTier = (tier: GameTier, controlMode: ControlMode, gameMode?: GameMode) => {
    setControlMode(controlMode);
    setCurrentTier(tier);

    // Set the game mode if provided
    if (gameMode) {
      setSelectedGameMode(gameMode);
      // If slowmo mode, go directly to SlowMoMode component
      if (gameMode === 'slowmo') {
        navigateTo('slowmo');
        return;
      }
    }

    // Show onboarding only for first-time users or if explicitly requested
    if (progress.gamesPlayed === 0 || !progress.skipOnboarding) {
      navigateTo('onboarding');
    } else {
      startGameForTier();
    }
  };

  const handleToggleControlMode = () => {
    setControlMode(prev => prev === 'swipe' ? 'tap' : 'swipe');
  };

  const handleOnboardingComplete = (mode: ControlMode) => {
    setControlMode(mode);
    startGameForTier();
  };

  const handleOnboardingSkip = (mode: ControlMode) => {
    setControlMode(mode);
    setSkipOnboarding(true);
    startGameForTier();
  };

  const startGameForTier = () => {
    navigateTo('battle');
    startGame(tierConfig.gameMode);

    // Start health simulation if tier has health profile
    if (tierConfig.healthProfile) {
      startGlucoseSimulation();
    }
  };

  const handleSelectGame = () => {
    navigateTo('game_selection');
  };

  const handleBackFromGameSelection = () => {
    navigateTo('menu');
  };

  const handleViewStats = () => {
    navigateTo('slowmo_stats');
  };

  const handleCloseStats = () => {
    navigateTo('menu');
  };

  const handleGameResult = () => {
    incrementGamesPlayed();
    updateBestScore(gameState.score);

    // Check if player won
    if (gameState.gameResult === 'victory' && tierConfig.requiresWin) {
      // Unlock next tier if available
      const tiers: GameTier[] = ['tier1', 'tier2', 'tier3'];
      const nextTierIndex = tiers.indexOf(progress.currentTier) + 1;
      if (nextTierIndex < tiers.length) {
        unlockNextTier(progress.currentTier);
      }
    }

    stopGlucoseSimulation();
    navigateTo('results');
  };

  const handleResultsNext = () => {
    // Auto-advance tier1 to tier2
    if (currentTier === 'tier1') {
      setCurrentTier('tier2');
      navigateTo('onboarding');
    } else {
      // For tier2+, show options
      navigateTo('menu');
    }
  };

  const handleExit = () => {
    stopGlucoseSimulation();
    navigateTo('welcome');
  };

  // Check if game ended and we need to show results - use useEffect to avoid infinite re-renders
  useEffect(() => {
    if (appScreen === 'battle' && !gameState.isGameActive && gameState.gameResult && !hasTransitionedToResults.current) {
      hasTransitionedToResults.current = true;
      handleGameResult();
    }
  }, [appScreen, gameState.isGameActive, gameState.gameResult]);

  // Reset transition flag when starting a new game
  useEffect(() => {
    if (appScreen === 'battle' && gameState.isGameActive) {
      hasTransitionedToResults.current = false;
    }
  }, [appScreen, gameState.isGameActive]);

  // Render current screen using screen map
  return screenMap[appScreen]();
}
