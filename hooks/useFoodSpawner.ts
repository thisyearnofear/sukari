/**
 * useFoodSpawner — Manages food spawning at dynamic intervals.
 * Extracted from useBattleGame for MODULAR / CLEAN separation of concerns.
 */
import { useEffect, useRef } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { GameState, FoodUnit, FoodDefinition, TimePhase, GameMode } from '@/types/game';
import {
  GAME_DURATION,
  SPAWN_CONFIG,
  ALLY_FOODS,
  ENEMY_FOODS,
} from '@/constants/gameConfig';
import { SeededRandom } from '@/utils/random';
import {
  getPracticeBiasForMission,
  applyWorldStateToPracticeBias,
  PracticeBias,
  PROTEIN_ALLY_TYPES,
  SUGARY_DRINK_TYPES,
} from '@/domain/programme';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';

const GAME_MAX_WIDTH = Platform.OS === 'web' ? 960 : 500; // Must match BattleScreen maxWidth

const DEFAULT_EFFECTS = { energy: 0, hydration: 0, nutrition: 0, stability: 0 };

function weightedFoods(foods: FoodDefinition[], bias: PracticeBias, isAlly: boolean): FoodDefinition[] {
  return foods.map((f) => {
    let w = f.spawnWeight;
    if (isAlly && bias.preferProteinAllies && PROTEIN_ALLY_TYPES.has(f.type)) {
      w *= 1 + bias.allyWeightBonus + 0.35;
    } else if (isAlly && bias.allyWeightBonus) {
      w *= 1 + bias.allyWeightBonus * 0.5;
    }
    if (!isAlly && bias.preferRejectSugaryDrinks && SUGARY_DRINK_TYPES.has(f.type)) {
      w *= 1 + bias.enemyWeightBonus + 0.4;
    } else if (!isAlly && bias.enemyWeightBonus) {
      w *= 1 + bias.enemyWeightBonus;
    }
    return { ...f, spawnWeight: w };
  });
}

export const selectRandomFood = (
  isAlly: boolean,
  timePhase?: TimePhase,
  seededRandom?: SeededRandom | null,
  bias?: PracticeBias,
): FoodDefinition => {
  const base = isAlly ? ALLY_FOODS.filter(food => food.faction === 'ally') : ENEMY_FOODS;
  const foods = bias ? weightedFoods(base, bias, isAlly) : base;
  const totalWeight = foods.reduce((sum, f) => sum + f.spawnWeight, 0);
  let random = seededRandom ? seededRandom.next() * totalWeight : Math.random() * totalWeight;
  for (const food of foods) {
    random -= food.spawnWeight;
    if (random <= 0) return food;
  }
  return foods[0];
};

export const createFoodUnit = (
  definition: FoodDefinition,
  timePhase?: TimePhase,
  gameMode?: GameMode,
  seededRandom?: SeededRandom | null,
  fieldSize: { width: number; height: number } = { width: GAME_MAX_WIDTH, height: 800 },
): FoodUnit => {
  const fieldWidth = Math.min(fieldSize.width, GAME_MAX_WIDTH);
  // Every shipped tier now shares the compact HUD, so the decision field keeps
  // the same generous usable width on mobile and desktop.
  const leftMargin = 40;
  const rightMargin = 40;
  const randomX = seededRandom ? seededRandom.next() : Math.random();
  const usableWidth = Math.max(80, fieldWidth - leftMargin - rightMargin);
  const spawnX = leftMargin + randomX * usableWidth;

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
    // Keep the opening field clear for the mission and controls before the choice enters play.
    y: 150,
    targetY: fieldSize.height - 200,
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
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const { progress } = usePlayerProgressContext();
  const missionTemplateId = progress.activeMission?.templateId;

  useEffect(() => {
    if (!gameState.isGameActive || gameState.isPaused) return;
    const templateBias = getPracticeBiasForMission(
      missionTemplateId ? progress.activeMission : null,
    );
    const missionBias = applyWorldStateToPracticeBias(templateBias, progress.worldState);

    const getSpawnInterval = () => {
      const elapsed = GAME_DURATION - gameState.timer;
      const reduction = Math.floor(elapsed / 10) * SPAWN_CONFIG.INTERVAL_DECREASE;
      const base = Math.max(SPAWN_CONFIG.MIN_INTERVAL, SPAWN_CONFIG.INITIAL_INTERVAL - reduction);
      const rate =
        (gameState.spawnRateMultiplier || 1) * (missionBias.spawnRateMultiplier || 1);
      return Math.max(80, Math.round(base / rate));
    };

    const spawnFood = () => {
      setGameState(prev => {
        // Rehearsal is a decision aid, not a reflex test. Keep the field readable.
        const maxConcurrentChoices = 3;
        if (prev.foods.length >= maxConcurrentChoices || prev.isPaused) return prev;
        const randomVal = seededRandomRef.current ? seededRandomRef.current.next() : Math.random();
        const allyChance = Math.min(
          0.75,
          SPAWN_CONFIG.ALLY_SPAWN_CHANCE + (missionBias.allyWeightBonus || 0) * 0.5,
        );
        const isAlly = randomVal < allyChance;
        const definition = selectRandomFood(
          isAlly,
          prev.timePhase,
          seededRandomRef.current,
          missionBias,
        );
        const newFood = createFoodUnit(definition, prev.timePhase, prev.gameMode, seededRandomRef.current, {
          width: viewportWidth,
          height: viewportHeight,
        });
        return { ...prev, foods: [...prev.foods, newFood] };
      });
    };

    spawnFood();
    setTimeout(spawnFood, 400);
    setTimeout(spawnFood, 800);
    spawnRef.current = setInterval(spawnFood, getSpawnInterval());

    return () => { if (spawnRef.current) clearInterval(spawnRef.current); };
  }, [
    gameState.isGameActive,
    gameState.isPaused,
    gameState.timer,
    setGameState,
    seededRandomRef,
    missionTemplateId,
    progress.activeMission,
    progress.worldState,
    viewportHeight,
    viewportWidth,
  ]);

  return { spawnRef };
}
