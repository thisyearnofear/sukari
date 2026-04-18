/**
 * useFoodMovement — Moves foods at ~30fps, handles miss penalties and combo breaking.
 * Extracted from useBattleGame for MODULAR / CLEAN separation of concerns.
 */
import { useEffect, useRef } from 'react';
import { GameState, FoodUnit } from '@/types/game';
import { MISS_PENALTIES, ANNOUNCEMENTS } from '@/constants/gameConfig';

const getRandomAnnouncement = (category: keyof typeof ANNOUNCEMENTS): string => {
  const options = ANNOUNCEMENTS[category];
  if (!options || !Array.isArray(options)) return '';
  return options[Math.floor(Math.random() * options.length)];
};

interface UseFoodMovementArgs {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  tierConfig?: { tier?: string };
  showAnnouncement: (text: string, type?: string) => void;
}

export function useFoodMovement({ gameState, setGameState, tierConfig, showAnnouncement }: UseFoodMovementArgs) {
  const moveRef = useRef<number | null>(null);

  useEffect(() => {
    if (!gameState.isGameActive || gameState.isPaused) return;

    moveRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.isPaused) return prev;
        const updatedFoods: FoodUnit[] = [];
        let newStability = prev.stability;
        let newMetrics = { ...prev.metrics };
        let comboBreaker = false;

        const tierKey = (tierConfig?.tier || 'tier1') as keyof typeof MISS_PENALTIES;
        const penalties = MISS_PENALTIES[tierKey];

        for (const food of prev.foods) {
          if (food.isBeingDragged) { updatedFoods.push(food); continue; }

          const newY = food.y + food.speed * (prev.speedMultiplier || 1);

          if (newY >= food.targetY) {
            comboBreaker = true;
            if (prev.gameMode === 'life') {
              if (food.faction === 'enemy') {
                newMetrics.stability = Math.max(0, Math.min(100, newMetrics.stability - penalties.enemyGetThrough));
                if (tierConfig?.tier === 'tier3') newMetrics.energy = Math.max(0, newMetrics.energy - 10);
              } else {
                newMetrics.nutrition = Math.max(0, newMetrics.nutrition - penalties.allyMissed);
              }
              newStability = newMetrics.stability;
            } else {
              newStability = food.faction === 'enemy'
                ? Math.max(0, newStability - penalties.enemyGetThrough)
                : Math.max(0, newStability - penalties.allyMissed);
            }
          } else {
            updatedFoods.push({ ...food, y: newY });
          }
        }

        if (comboBreaker && prev.comboCount > 0) {
          showAnnouncement(getRandomAnnouncement('COMBO_BREAK'), 'warning');
        }

        if (prev.gameMode === 'classic' && (newStability <= 5 || newStability >= 95)) {
          return { ...prev, foods: updatedFoods, stability: newStability, isGameActive: false, gameResult: 'defeat' as const };
        }

        return {
          ...prev, foods: updatedFoods, stability: newStability, metrics: newMetrics,
          comboCount: comboBreaker ? 0 : prev.comboCount,
        };
      });
    }, 32);

    return () => { if (moveRef.current) clearInterval(moveRef.current); };
  }, [gameState.isGameActive, gameState.isPaused, tierConfig?.tier, showAnnouncement, setGameState]);

  return { moveRef };
}
