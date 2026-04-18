/**
 * usePlotTwists — Schedules and triggers plot twists with VRF support.
 * Extracted from useBattleGame for MODULAR / CLEAN separation of concerns.
 */
import { useEffect, useRef, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { GameState, PlotTwist, UserMode } from '@/types/game';
import { PLOT_TWISTS, MODE_PLOT_TWISTS } from '@/constants/gameConfig';
import { useVRFService } from './useVRFService';

interface UsePlotTwistsArgs {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  userMode?: UserMode;
  showAnnouncement: (text: string, type?: string, science?: string) => void;
  triggerScreenShake: (intensity?: number) => void;
}

export function usePlotTwists({
  gameState,
  setGameState,
  userMode,
  showAnnouncement,
  triggerScreenShake,
}: UsePlotTwistsArgs) {
  const plotTwistRef = useRef<number | null>(null);
  const { generateFairPlotTwist } = useVRFService();
  const [vrfEnabled, setVrfEnabled] = [false, (_: boolean) => {}]; // Controlled externally

  const applyTwist = useCallback((twist: PlotTwist, isVerifiable: boolean) => {
    setGameState(prev => {
      if (prev.gameMode !== 'life' || prev.activePlotTwist || prev.plotTwistsTriggered >= 2) return prev;

      const newMetrics = { ...prev.metrics };
      if (twist.effect.energy) newMetrics.energy = Math.max(0, Math.min(100, newMetrics.energy + twist.effect.energy));
      if (twist.effect.hydration) newMetrics.hydration = Math.max(0, Math.min(100, newMetrics.hydration + twist.effect.hydration));
      if (twist.effect.nutrition) newMetrics.nutrition = Math.max(0, Math.min(100, newMetrics.nutrition + twist.effect.nutrition));
      if (twist.effect.stability) newMetrics.stability = Math.max(0, Math.min(100, newMetrics.stability + twist.effect.stability));

      return {
        ...prev,
        activePlotTwist: twist,
        plotTwistTimer: twist.duration,
        plotTwistsTriggered: prev.plotTwistsTriggered + 1,
        metrics: newMetrics,
      };
    });

    const label = isVerifiable ? `${twist.icon} ${twist.name} ⚖️ FAIR` : `${twist.icon} ${twist.name}`;
    showAnnouncement(label, 'plot_twist', twist.bonusCondition || undefined);
    triggerScreenShake(12);
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}
  }, [setGameState, showAnnouncement, triggerScreenShake]);

  const triggerPlotTwist = useCallback(async () => {
    try {
      const result = await generateFairPlotTwist(gameState.gameMode, Date.now());
      applyTwist(result.plotTwist, result.isVerifiable);
    } catch {
      // Fallback to local random
      const pool = userMode ? MODE_PLOT_TWISTS[userMode] : PLOT_TWISTS;
      const available = pool.filter(() => Math.random() > 0.3);
      if (available.length === 0) return;
      applyTwist(available[Math.floor(Math.random() * available.length)], false);
    }
  }, [generateFairPlotTwist, gameState.gameMode, userMode, applyTwist]);

  // Schedule plot twists at random intervals (Life Mode only)
  useEffect(() => {
    if (!gameState.isGameActive || gameState.gameMode !== 'life') return;

    const delay = 15000 + Math.random() * 20000;
    plotTwistRef.current = setTimeout(() => {
      if (gameState.timer > 10 && gameState.plotTwistsTriggered < 2) {
        triggerPlotTwist();
      }
    }, delay);

    return () => { if (plotTwistRef.current) clearTimeout(plotTwistRef.current); };
  }, [gameState.isGameActive, gameState.gameMode, triggerPlotTwist, gameState.timer, gameState.plotTwistsTriggered]);

  return { plotTwistRef, triggerPlotTwist };
}
