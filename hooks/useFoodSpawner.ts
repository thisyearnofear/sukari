/**
 * useFoodSpawner — Manages food spawning at dynamic intervals.
 * Extracted from useBattleGame for MODULAR / CLEAN separation of concerns.
 */
import { useEffect, useRef } from 'react';
import { Dimensions } from 'react-native';
import { GameState, FoodUnit, FoodDefinition, TimePhase, GameMode } from '@/types/game';
import {
  GAME_DURATION,
  SPAWN_CONFIG,
  ALLY_FOODS,
  ENEMY_FOODS,
} from '@/constants/gameConfig';
import { SeededRandom } from '@/utils/random';

const { width, height } = Dimensions.get('window');
const SIDE_PANEL_WIDTH = 80;

const DEFAULT_EFFECTS = { energy: 0, hydration: 0, nutrition: 0, stability: 0 };

export const selectRandomFood = (isAlly: boolean, timePhase?: TimePhase, seededRandom?: SeededRandom | null): FoodDefinition => {
  const foods = isAlly ? ALLY_FOODS : ENEMY_FOODS;
  const totalWeight = foods.reduce((sum, f) => sum + f.spawnWeight, 0);
  let random = seededRandom ? seededRandom.next() * totalWeight : Math.random() * totalWeight;
  for (const food of foods) {
    random -= food.spawnWeight;
    if (random <= 0) return food;
  }
  return foods[0];
};

export const createFoodUnit = (definition: FoodDefinition, timePhase?: TimePhase, gameMode?: GameMode, seededRandom?: SeededRandom | null): FoodUnit => {
  const leftMargin = gameMode === 'life' ? SIDE_PANEL_WIDTH + 20 : 40;
  const rightMargin = gameMode === 'life' ? SIDE_PANEL_WIDTH + 20 : 40;
  const randomX = seededRandom ? seededRandom.next() : Math.random();
  const spawnX = leftMargin + randomX * (width - leftMargin - rightMargin);

  let isContextuallyGood = true;
  if (definition.faction === 'contextual' && definition.timeModifiers && timePhase) {
    isContextuallyGood = (definition.timeModifiers[timePhase] || 1) > 0;
  }

  const randomSpeed = seededRandom ? seededRandom.next() : Math.random();
  const randomId = seededRandom ? seededRandom.nextInt(0, 1000000).toString() : Math.random().toString(36).substr(2, 9);

  return {
    id: `food-${Date.now()}-${randomId}`,
    type: definition.type,
    faction: definition.faction,
    name: definition.name,
    sprite: definition.sprite,
    x: spawnX,
    y: -60,
    targetY: height - 200,
    speed: 1.2 + randomSpeed * 0.8,
    points: definition.basePoints,
    glucoseImpact: definition.glucoseImpact,
    effects: definition.effects || DEFAULT_EFFECTS,
    isBeingDragged: false,
    swipeDirection: null,
    opacity: 1,
    scale: 1,
    isContextuallyGood,
  };
};

interface UseFoodSpawnerArgs {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  seededRandomRef: React.MutableRefObject<SeededRandom | null>;
}

export function useFoodSpawner({ gameState, setGameState, seededRandomRef }: UseFoodSpawnerArgs) {
  const spawnRef = useRef<number | null>(null);

  useEffect(() => {
    if (!gameState.isGameActive || gameState.isPaused) return;

    const getSpawnInterval = () => {
      const elapsed = GAME_DURATION - gameState.timer;
      const reduction = Math.floor(elapsed / 10) * SPAWN_CONFIG.INTERVAL_DECREASE;
      const base = Math.max(SPAWN_CONFIG.MIN_INTERVAL, SPAWN_CONFIG.INITIAL_INTERVAL - reduction);
      return Math.max(80, Math.round(base / (gameState.spawnRateMultiplier || 1)));
    };

    const spawnFood = () => {
      setGameState(prev => {
        if (prev.foods.length >= SPAWN_CONFIG.MAX_FOODS_ON_SCREEN || prev.isPaused) return prev;
        const randomVal = seededRandomRef.current ? seededRandomRef.current.next() : Math.random();
        const isAlly = randomVal < SPAWN_CONFIG.ALLY_SPAWN_CHANCE;
        const definition = selectRandomFood(isAlly, prev.timePhase, seededRandomRef.current);
        const newFood = createFoodUnit(definition, prev.timePhase, prev.gameMode, seededRandomRef.current);
        return { ...prev, foods: [...prev.foods, newFood] };
      });
    };

    spawnFood();
    setTimeout(spawnFood, 400);
    setTimeout(spawnFood, 800);
    spawnRef.current = setInterval(spawnFood, getSpawnInterval());

    return () => { if (spawnRef.current) clearInterval(spawnRef.current); };
  }, [gameState.isGameActive, gameState.isPaused, gameState.timer, setGameState, seededRandomRef]);

  return { spawnRef };
}
