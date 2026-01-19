import React, { useState, useEffect, useRef } from 'react';
import { View } from 'react-native';
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
import { useBattleGame } from '@/hooks/useBattleGame';
import { useHealthProfile } from '@/hooks/useHealthProfile';
import { usePlayerProgress } from '@/hooks/usePlayerProgress';
import { ControlMode, GameMode } from '@/types/game';
import { GAME_TIERS, GameTier } from '@/constants/gameTiers';

type AppScreen = 'menu' | 'onboarding' | 'battle' | 'results' | 'welcome' | 'game_selection' | 'slowmo' | 'slowmo_results' | 'slowmo_stats';

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
        setAppScreen('slowmo');
        return;
      }
    }
    
    // Show onboarding only for first-time users or if explicitly requested
    if (progress.gamesPlayed === 0 || !progress.skipOnboarding) {
      setAppScreen('onboarding');
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
    setAppScreen('battle');
    startGame(tierConfig.gameMode);

    // Start health simulation if tier has health profile
    if (tierConfig.healthProfile) {
      startGlucoseSimulation();
    }
  };

  const handleSelectGame = () => {
    setAppScreen('game_selection');
  };

  const handleBackFromGameSelection = () => {
    setAppScreen('menu');
  };

  const handleViewStats = () => {
    setAppScreen('slowmo_stats');
  };

  const handleCloseStats = () => {
    setAppScreen('menu');
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
    setAppScreen('results');
  };

  const handleResultsNext = () => {
    // Auto-advance tier1 to tier2
    if (currentTier === 'tier1') {
      setCurrentTier('tier2');
      setAppScreen('onboarding');
    } else {
      // For tier2+, show options
      setAppScreen('menu');
    }
  };

  const handleExit = () => {
    stopGlucoseSimulation();
    setAppScreen('welcome');
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

  // Show Slow Mo Mode Stats
  if (appScreen === 'slowmo_stats') {
    return (
      <View style={{ flex: 1 }}>
        <SlowMoStats
          analytics={getSlowMoAnalytics()}
          onClose={handleCloseStats}
        />
      </View>
    );
  }

  // Show main menu with user mode selector if needed
  if (appScreen === 'menu') {
    return (
      <View style={{ flex: 1 }}>
        <MainMenu 
          onStartGame={handleStartGame}
          onSelectGame={handleSelectGame}
          onViewStats={handleViewStats}
          userModeSelected={progress.userMode !== null}
        />
      </View>
    );
  }

  // Show game selection screen
  if (appScreen === 'game_selection') {
    return (
      <View style={{ flex: 1 }}>
        <GameSelectionScreen
          onStartGame={handleStartGameWithTier}
          onBack={handleBackFromGameSelection}
        />
      </View>
    );
  }

  // Show Slow Mo Mode
  if (appScreen === 'slowmo') {
    return (
      <View style={{ flex: 1 }}>
        <SlowMoMode
          onStartGame={(mode: GameMode) => {
            // After SlowMoMode completes, return to menu
            setAppScreen('menu');
          }}
          onBack={() => setAppScreen('game_selection')}
          onComplete={() => {
            // Session completed and recorded - show results
            const lastSession = progress.slowMoSessions?.[progress.slowMoSessions.length - 1];
            if (lastSession) {
              setLastSlowMoSession(lastSession);
              setAppScreen('slowmo_results');
            } else {
              setAppScreen('menu');
            }
          }}
        />
      </View>
    );
  }

  // Show Slow Mo Mode Results
  if (appScreen === 'slowmo_results' && lastSlowMoSession) {
    return (
      <View style={{ flex: 1 }}>
        <SlowMoResults
          session={lastSlowMoSession}
          sessionNumber={progress.slowMoSessionsCompleted || 1}
          onContinue={() => setAppScreen('menu')}
        />
      </View>
    );
  }

  // Show onboarding (beautiful original onboarding)
  if (appScreen === 'onboarding') {
    return (
      <View style={{ flex: 1 }}>
        <Onboarding
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
          defaultControlMode={controlMode}
          gameMode={tierConfig.gameMode}
          healthProfile={healthProfile}
          userMode={progress.userMode || undefined}
        />
      </View>
    );
  }

  // Show results screen
  if (appScreen === 'results') {
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
    );
  }

  // Show battle screen
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
        healthProfile={tierConfig.healthProfile ? healthProfile : undefined}
        onAdministerInsulin={administerInsulin}
        tierConfig={tierConfig}
        onToggleControlMode={handleToggleControlMode}
      />
    </View>
  );
}
