import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { ControlMode, UserMode } from '@/types/game';
import { HealthScenario } from '@/types/health';
import { GameTier, TierConfig, GAME_TIERS } from '@/constants/gameTiers';
import { useBattleGame } from '@/hooks/useBattleGame';
import { useHealthProfile } from '@/hooks/useHealthProfile';

interface GameSessionProviderProps {
  children: ReactNode;
  userMode?: UserMode;
}

type BattleGame = ReturnType<typeof useBattleGame>;
type HealthProfileHook = ReturnType<typeof useHealthProfile>;

interface GameSessionContextType {
  // Control mode
  controlMode: ControlMode;
  setControlMode: (mode: ControlMode) => void;

  // Tier selection
  selectedTier: GameTier;
  setSelectedTier: (tier: GameTier) => void;
  tierConfig: TierConfig;

  // Battle game hook return
  battleGame: BattleGame;

  // Health profile hook return
  healthProfile: HealthProfileHook;

  // Session actions
  startGameForTier: () => void;
  handleGameResult: (callbacks: {
    incrementGamesPlayed: () => void;
    updateBestScore: (score: number) => void;
    unlockNextTier: (currentTier: GameTier) => void;
    currentTier: GameTier;
    requiresWin: boolean;
  }) => void;
}

const GameSessionContext = createContext<GameSessionContextType | undefined>(undefined);

export const GameSessionProvider = ({ children, userMode }: GameSessionProviderProps) => {
  const [controlMode, setControlMode] = useState<ControlMode>('swipe');
  const [selectedTier, setSelectedTier] = useState<GameTier>('tier1');

  const tierConfig = useMemo(() => GAME_TIERS[selectedTier], [selectedTier]);

  const health = useHealthProfile(
    tierConfig.healthProfile && tierConfig.healthProfile !== 'player_selected' && tierConfig.healthProfile !== 'auto_newly_aware'
      ? (tierConfig.healthProfile as HealthScenario)
      : undefined,
  );

  const battle = useBattleGame(health.logMeal, tierConfig, userMode);

  const startGameForTier = useCallback(() => {
    battle.startGame(tierConfig.gameMode);
    if (tierConfig.healthProfile) {
      health.startGlucoseSimulation();
    }
  }, [battle, tierConfig.gameMode, tierConfig.healthProfile, health]);

  const handleGameResult = useCallback(
    (callbacks: {
      incrementGamesPlayed: () => void;
      updateBestScore: (score: number) => void;
      unlockNextTier: (currentTier: GameTier) => void;
      currentTier: GameTier;
      requiresWin: boolean;
    }) => {
      const { gameState } = battle;

      callbacks.incrementGamesPlayed();
      callbacks.updateBestScore(gameState.score);

      if (gameState.gameResult === 'victory' && callbacks.requiresWin) {
        callbacks.unlockNextTier(callbacks.currentTier);
      }

      health.stopGlucoseSimulation();
    },
    [battle, health],
  );

  const value = useMemo<GameSessionContextType>(
    () => ({
      controlMode,
      setControlMode,
      selectedTier,
      setSelectedTier,
      tierConfig,
      battleGame: battle,
      healthProfile: health,
      startGameForTier,
      handleGameResult,
    }),
    [controlMode, selectedTier, tierConfig, battle, health, startGameForTier, handleGameResult],
  );

  return (
    <GameSessionContext.Provider value={value}>
      {children}
    </GameSessionContext.Provider>
  );
};

export const useGameSession = () => {
  const context = useContext(GameSessionContext);
  if (context === undefined) {
    throw new Error('useGameSession must be used within a GameSessionProvider');
  }
  return context;
};
