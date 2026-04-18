/**
 * useGameTimer — Manages the 1-second game clock, metric drain, zone tracking,
 * plot twist timers, phase transitions, and game-end conditions.
 *
 * Extracted from useBattleGame for MODULAR / CLEAN separation of concerns.
 */
import { useEffect, useRef, useCallback } from 'react';
import { GameState, TimePhase, MorningCondition } from '@/types/game';
import {
  ANNOUNCEMENTS,
  METRIC_DRAIN_RATES,
  MORNING_CONDITIONS,
} from '@/constants/gameConfig';
import { getStabilityZone } from '@/utils/gameLogic';

// Get current time phase based on timer
const getTimePhase = (timer: number): TimePhase => {
  if (timer >= 46) return 'morning';
  if (timer >= 31) return 'midday';
  if (timer >= 16) return 'afternoon';
  return 'evening';
};

const getMorningConditionConfig = (condition: MorningCondition) =>
  MORNING_CONDITIONS.find(c => c.id === condition) || MORNING_CONDITIONS.find(c => c.id === 'normal_day')!;

const getRandomAnnouncement = (category: keyof typeof ANNOUNCEMENTS): string => {
  const options = ANNOUNCEMENTS[category];
  if (!options || !Array.isArray(options)) return '';
  return options[Math.floor(Math.random() * options.length)];
};

export { getTimePhase, getMorningConditionConfig, getRandomAnnouncement };

interface UseGameTimerArgs {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  balancedRangeRef: React.MutableRefObject<{ min: number; max: number }>;
  endGame: (result: 'victory' | 'defeat') => void;
  showAnnouncement: (text: string, type?: string, science?: string) => void;
}

export function useGameTimer({
  gameState,
  setGameState,
  balancedRangeRef,
  endGame,
  showAnnouncement,
}: UseGameTimerArgs) {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!gameState.isGameActive || gameState.isPaused) return;

    timerRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.isPaused) return prev;
        const newTimer = prev.timer - 1;
        const zone = getStabilityZone(prev.stability, balancedRangeRef.current);
        const newTimePhase = getTimePhase(newTimer);
        const conditionConfig = getMorningConditionConfig(prev.morningCondition);

        let timeInBalanced = prev.timeInBalanced;
        let timeInWarning = prev.timeInWarning;
        let timeInCritical = prev.timeInCritical;

        if (zone === 'balanced') timeInBalanced++;
        else if (zone.includes('warning')) timeInWarning++;
        else timeInCritical++;

        let newMetrics = { ...prev.metrics };
        if (prev.gameMode === 'life') {
          const drainMultipliers = conditionConfig.needsMultipliers;
          newMetrics.energy = Math.max(0, newMetrics.energy - (METRIC_DRAIN_RATES.energy * (drainMultipliers.energy || 1)));
          newMetrics.hydration = Math.max(0, newMetrics.hydration - (METRIC_DRAIN_RATES.hydration * (drainMultipliers.hydration || 1)));
          newMetrics.nutrition = Math.max(0, newMetrics.nutrition - (METRIC_DRAIN_RATES.nutrition * (drainMultipliers.nutrition || 1)));
          newMetrics.stability = Math.max(0, Math.min(100, newMetrics.stability - (METRIC_DRAIN_RATES.stability * (drainMultipliers.stability || 1))));

          if (prev.activePlotTwist?.ongoingEffect) {
            const ongoing = prev.activePlotTwist.ongoingEffect;
            if (ongoing.energy) newMetrics.energy = Math.max(0, Math.min(100, newMetrics.energy + ongoing.energy));
            if (ongoing.hydration) newMetrics.hydration = Math.max(0, Math.min(100, newMetrics.hydration + ongoing.hydration));
            if (ongoing.nutrition) newMetrics.nutrition = Math.max(0, Math.min(100, newMetrics.nutrition + ongoing.nutrition));
            if (ongoing.stability) newMetrics.stability = Math.max(0, Math.min(100, newMetrics.stability + ongoing.stability));
          }
        }

        const metricsHistory = [...prev.metricsHistory, { ...newMetrics }];

        let activePlotTwist = prev.activePlotTwist;
        let plotTwistTimer = prev.plotTwistTimer;
        if (activePlotTwist && plotTwistTimer > 0) {
          plotTwistTimer--;
          if (plotTwistTimer <= 0) activePlotTwist = null;
        }

        if (prev.gameMode === 'life' && newTimePhase !== prev.timePhase) {
          const phaseKey = `PHASE_${newTimePhase.toUpperCase()}` as keyof typeof ANNOUNCEMENTS;
          if (ANNOUNCEMENTS[phaseKey]) showAnnouncement(getRandomAnnouncement(phaseKey), 'info');
        }

        if (newTimer === 10) showAnnouncement(getRandomAnnouncement('FINAL_WAVE'), 'warning');

        if (newTimer <= 0) {
          const isVictory = prev.gameMode === 'classic'
            ? (prev.stability >= 30 && prev.stability <= 70 && prev.score > 0)
            : (newMetrics.energy > 15 && newMetrics.hydration > 15 && newMetrics.nutrition > 15 && newMetrics.stability > 15 && prev.score > 0);

          endGame(isVictory ? 'victory' : 'defeat');

          return {
            ...prev, timer: 0, isGameActive: false,
            gameResult: isVictory ? 'victory' : 'defeat',
            timeInBalanced, timeInWarning, timeInCritical,
            metrics: newMetrics,
            stability: prev.gameMode === 'life' ? newMetrics.stability : prev.stability,
            metricsHistory, activePlotTwist, plotTwistTimer,
          };
        }

        if (prev.gameMode === 'life') {
          const anyCriticalLow = newMetrics.energy <= 5 || newMetrics.hydration <= 5 || newMetrics.nutrition <= 5 || newMetrics.stability <= 5;
          if (anyCriticalLow) {
            endGame('defeat');
            return { ...prev, timer: newTimer, isGameActive: false, gameResult: 'defeat' as const, metrics: newMetrics, metricsHistory };
          }
        }

        return {
          ...prev, timer: newTimer, timePhase: newTimePhase,
          timeInBalanced, timeInWarning, timeInCritical,
          metrics: newMetrics,
          stability: prev.gameMode === 'life' ? newMetrics.stability : prev.stability,
          metricsHistory, activePlotTwist, plotTwistTimer,
        };
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState.isGameActive, gameState.isPaused, endGame, showAnnouncement, balancedRangeRef, setGameState]);

  return { timerRef };
}
