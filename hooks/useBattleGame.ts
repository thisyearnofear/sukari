import { useState, useEffect, useRef, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { playSound } from '@/utils/sounds';
import {
  GameState,
  FoodUnit,
  StabilityZone,
  FoodDefinition,
  GameMode,
  BodyMetrics,
  TimePhase,
  MorningCondition,
  PlotTwist,
  FoodEffects,
  SwipeDirection,
  SwipeAction,
  SavedFoodSlot,
  SocialStats,
  SpecialMode,
  UserMode,
} from '@/types/game';
import { FoodNutrients } from '@/types/health';
import { getFoodNutrients } from '@/utils/foodToGlucose';
import {
  GAME_DURATION,
  INITIAL_STABILITY,
  COMBO_WINDOW,
  COMBO_TIERS,
  ALL_FOODS,
  ANNOUNCEMENTS,
  POWER_UPS,
  INITIAL_METRICS,
  MORNING_CONDITIONS,
} from '@/constants/gameConfig';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
import { getReflectionMessage } from '@/constants/userModes';
import { SeededRandom, getWeeklySeed } from '@/utils/random';
import { useBeam } from '@/context/BeamContext';
import { ChallengeModifier } from '@/types/challenge';
import { getStabilityZone } from '@/utils/gameLogic';
import { useGameTimer, getTimePhase, getMorningConditionConfig, getRandomAnnouncement } from './useGameTimer';
import { useFoodSpawner } from './useFoodSpawner';
import { useFoodMovement } from './useFoodMovement';
import { usePlotTwists } from './usePlotTwists';

// Get random morning condition
const getRandomMorningCondition = (): MorningCondition => {
  const conditions: MorningCondition[] = ['well_rested', 'poor_sleep', 'sick_day', 'marathon_day', 'stressed', 'recovery_day', 'normal_day'];
  return conditions[Math.floor(Math.random() * conditions.length)];
};

const initialGameState: GameState = {
  // Core
  score: 0,
  timer: GAME_DURATION,
  foods: [],
  isGameActive: false,
  gameResult: null,
  gameMode: 'classic',

  // Multi-metric system
  metrics: { ...INITIAL_METRICS },
  stability: INITIAL_STABILITY,

  // Time of day (Life Mode)
  timePhase: 'morning',
  morningCondition: 'normal_day',

  // Plot twists
  activePlotTwist: null,
  plotTwistTimer: 0,
  plotTwistsTriggered: 0,

  // Special modes
  activeSpecialMode: null,
  specialModeTimer: 0,
  foodTypeStreak: { type: '', count: 0 },

  // Combo system
  comboCount: 0,
  comboTimer: 0,
  lastSwipeTime: 0,

  // Power-ups
  exerciseCharges: POWER_UPS.EXERCISE.maxCharges,
  rationCharges: POWER_UPS.RATIONS.maxCharges,

  // 4-Direction Swipe System
  savedFoods: [{ food: null, savedAt: 0 }, { food: null, savedAt: 0 }, { food: null, savedAt: 0 }],
  socialStats: { totalShares: 0, shareStreak: 0, socialMeter: 0 },
  lastSwipeAction: null,

  // UI state
  announcement: null,
  announcementType: 'info',
  announcementPosition: { x: 'center', y: 'top' },
  announcementScience: null,
  showTutorial: true,
  tutorialStep: 0,
  screenShake: 0,
  isPaused: false,

  // Dynamic speed modifiers
  speedMultiplier: 1.0,
  spawnRateMultiplier: 1.0,

  // Stats tracking
  correctSwipes: 0,
  incorrectSwipes: 0,
  optimalSwipes: 0,
  timeInBalanced: 0,
  timeInWarning: 0,
  timeInCritical: 0,
  metricsHistory: [],
  shareableMoments: [],
};

export const useBattleGame = (
  onFoodConsumed?: (foodNutrients: FoodNutrients) => void,
  tierConfig?: any,
  userMode?: UserMode,
  challenge?: { id: string; seed: string; modifiers: ChallengeModifier[] },
) => {
  const beamContext = useBeam();
  const playerAccount = beamContext?.playerAccount;
  const reportGameResult = beamContext?.reportGameResult;
  const { discoverLore } = usePlayerProgressContext();
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const timerRef = useRef<number | null>(null);
  const announcementRef = useRef<number | null>(null);
  const comboTimerRef = useRef<number | null>(null);
  const comboWindowMsRef = useRef<number>(COMBO_WINDOW);
  const balancedRangeRef = useRef<{ min: number; max: number }>({ min: 40, max: 60 });
  const powerupsDisabledRef = useRef<boolean>(false);
  const challengeIdRef = useRef<string | null>(null);

  const showAnnouncement = useCallback((text: string, type: 'info' | 'success' | 'warning' | 'error' | 'plot_twist' | 'joke' | 'fact' | 'special_mode' | 'reflection' = 'info', science?: string) => {
    setGameState(prev => ({ ...prev, announcement: text, announcementType: type, announcementScience: science || null }));

    if (announcementRef.current) clearTimeout(announcementRef.current);
    // Longer duration for educational messages
    const duration = science ? 2500 : (type === 'plot_twist' ? 2500 : 1500);
    announcementRef.current = setTimeout(() => {
      setGameState(prev => ({ ...prev, announcement: null, announcementScience: null }));
    }, duration);
  }, []);

  const triggerScreenShake = useCallback((intensity: number = 5) => {
    setGameState(prev => ({ ...prev, screenShake: intensity }));
    setTimeout(() => {
      setGameState(prev => ({ ...prev, screenShake: 0 }));
    }, 200);
  }, []);

  const seededRandomRef = useRef<SeededRandom | null>(null);

  useEffect(() => {
    const stringToSeed = (s: string) => {
      let hash = 0;
      for (let i = 0; i < s.length; i++) {
        hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
      }
      return hash || 1;
    };

    if (challenge?.seed) {
      seededRandomRef.current = new SeededRandom(stringToSeed(challenge.seed));
      challengeIdRef.current = challenge.id;
    } else if (tierConfig?.tier === 'weekly') {
      seededRandomRef.current = new SeededRandom(getWeeklySeed());
      challengeIdRef.current = null;
    } else {
      seededRandomRef.current = null;
      challengeIdRef.current = null;
    }
  }, [tierConfig?.tier, challenge?.seed, challenge?.id]);

  // Apply challenge modifiers (if present)
  useEffect(() => {
    if (!challenge) {
      comboWindowMsRef.current = COMBO_WINDOW;
      balancedRangeRef.current = { min: 40, max: 60 };
      powerupsDisabledRef.current = false;
      return;
    }

    // Defaults
    comboWindowMsRef.current = COMBO_WINDOW;
    balancedRangeRef.current = { min: 40, max: 60 };
    powerupsDisabledRef.current = false;

    if (challenge.modifiers?.includes('short_combo_window')) {
      comboWindowMsRef.current = Math.max(250, Math.round(COMBO_WINDOW * 0.65));
    }
    if (challenge.modifiers?.includes('thin_margins')) {
      // Narrow balanced zone from 40-60 -> 45-55
      balancedRangeRef.current = { min: 45, max: 55 };
    }
    if (challenge.modifiers?.includes('no_powerups')) {
      powerupsDisabledRef.current = true;
    }
  }, [challenge]);

  const startGame = useCallback((mode: GameMode = 'classic') => {
    const morningCondition = mode === 'life' ? getRandomMorningCondition() : 'normal_day';
    const conditionConfig = getMorningConditionConfig(morningCondition);

    // Apply morning condition modifiers to starting metrics
    const startingMetrics = mode === 'life'
      ? { ...conditionConfig.metricModifiers } as BodyMetrics
      : { ...INITIAL_METRICS };

    setGameState({
      ...initialGameState,
      isGameActive: true,
      showTutorial: false,
      gameMode: mode,
      morningCondition,
      metrics: startingMetrics,
      stability: startingMetrics.stability,
      timePhase: 'morning',
      // Apply challenge-driven multipliers
      spawnRateMultiplier: challenge?.modifiers?.includes('fast_spawn')
        ? 1.25
        : challenge?.modifiers?.includes('slow_spawn')
          ? 0.8
          : 1.0,
      speedMultiplier: challenge?.modifiers?.includes('fast_fall') ? 1.25 : 1.0,
    });

    setTimeout(() => {
      if (mode === 'life') {
        showAnnouncement(`${conditionConfig.icon} ${conditionConfig.name}`, 'info');
        setTimeout(() => {
          showAnnouncement(conditionConfig.description, 'info');
        }, 2000);
      } else {
        showAnnouncement(getRandomAnnouncement('GAME_START'), 'info');
      }
    }, 500);
  }, [showAnnouncement, challenge?.modifiers]);

  const endGame = useCallback(async (result: 'victory' | 'defeat') => {
    setGameState(prev => {
      // Capture final state inside the updater to avoid stale closures
      if (playerAccount && reportGameResult) {
        reportGameResult(prev.score, result, {
          correctSwipes: prev.correctSwipes,
          incorrectSwipes: prev.incorrectSwipes,
          comboMax: prev.comboCount,
          timeInBalanced: prev.timeInBalanced,
          finalHarmony: prev.stability,
        });
      }

      return {
        ...prev,
        isGameActive: false,
        gameResult: result,
      };
    });

    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
    if (moveRef.current) clearInterval(moveRef.current);
    if (plotTwistRef.current) clearTimeout(plotTwistRef.current);

    try {
      Haptics.notificationAsync(
        result === 'victory'
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error
      );
    } catch {
      // Haptics may not be available on web/simulators
    }
  }, [playerAccount, reportGameResult]);

  // ═══════════════════════════════════════════════════════════════
  // Delegated hooks — timer, spawning, movement, plot twists
  // ═══════════════════════════════════════════════════════════════
  useGameTimer({ gameState, setGameState, balancedRangeRef, endGame, showAnnouncement });
  const { spawnRef } = useFoodSpawner({ gameState, setGameState, seededRandomRef });
  const { moveRef } = useFoodMovement({ gameState, setGameState, tierConfig, showAnnouncement });
  const { plotTwistRef } = usePlotTwists({ gameState, setGameState, userMode, showAnnouncement, triggerScreenShake });

  // Handle swipe on food - supports 4 directions in Life Mode
  const handleSwipe = useCallback((foodId: string, direction: SwipeDirection, action: SwipeAction) => {
    setGameState(prev => {
      const food = prev.foods.find(f => f.id === foodId);
      if (!food) return prev;

      const now = Date.now();
      const isComboActive = now - prev.lastSwipeTime < comboWindowMsRef.current;

      // In Classic mode, only up/down are valid
      if (prev.gameMode === 'classic') {
        // Determine correct swipe based on faction
        let isCorrectSwipe: boolean;
        if (food.faction === 'contextual') {
          isCorrectSwipe = food.isContextuallyGood ? direction === 'up' : direction === 'down';
        } else {
          isCorrectSwipe =
            (food.faction === 'ally' && direction === 'up') ||
            (food.faction === 'enemy' && direction === 'down');
        }

        if (isCorrectSwipe) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          playSound('swipe');

          const newComboCount = isComboActive ? prev.comboCount + 1 : 1;
          let multiplier = 1;
          for (const tier of COMBO_TIERS) {
            if (newComboCount >= tier.count) multiplier = tier.multiplier;
          }

          const points = Math.round(food.points * multiplier);
          const newStability = Math.max(0, Math.min(100, prev.stability + food.glucoseImpact));

          const comboTier = COMBO_TIERS.find(t => t.count === newComboCount);
          if (comboTier) { showAnnouncement(comboTier.title, 'success'); playSound('combo'); }

          const oldZone = getStabilityZone(prev.stability, balancedRangeRef.current);
          const newZone = getStabilityZone(newStability, balancedRangeRef.current);

          if (newZone === 'critical-high' && oldZone !== 'critical-high') {
            showAnnouncement(getRandomAnnouncement('CRITICAL_HIGH'), 'error');
            triggerScreenShake(8);
          } else if (newZone === 'critical-low' && oldZone !== 'critical-low') {
            showAnnouncement(getRandomAnnouncement('CRITICAL_LOW'), 'error');
            triggerScreenShake(8);
          }

          return {
            ...prev,
            score: prev.score + points,
            stability: newStability,
            foods: prev.foods.filter(f => f.id !== foodId),
            comboCount: newComboCount,
            lastSwipeTime: now,
            correctSwipes: prev.correctSwipes + 1,
            lastSwipeAction: action,
          };
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          playSound('miss');
          showAnnouncement(getRandomAnnouncement('WRONG_SWIPE'), 'error');
          triggerScreenShake(10);

          return {
            ...prev,
            stability: Math.max(0, Math.min(100, prev.stability - 8)),
            foods: prev.foods.filter(f => f.id !== foodId),
            comboCount: 0,
            incorrectSwipes: prev.incorrectSwipes + 1,
            lastSwipeAction: action,
          };
        }
      }

      // Life Mode - 4 direction swipes
      let isOptimalSwipe = false;
      let isCorrectAction = false;
      let points = food.points;
      let multiplier = 1;
      let newMetrics = { ...prev.metrics };
      let newSocialStats = { ...prev.socialStats };
      let newSavedFoods = [...prev.savedFoods];

      // Calculate combo
      const newComboCount = isComboActive ? prev.comboCount + 1 : 1;
      for (const tier of COMBO_TIERS) {
        if (newComboCount >= tier.count) multiplier = tier.multiplier;
      }

      // Check if this is the optimal swipe for current context
      if (food.optimalSwipe?.direction === direction) {
        isOptimalSwipe = true;
        multiplier *= food.optimalSwipe.multiplier;
      }

      // Plot twist bonus
      if (prev.activePlotTwist) {
        const twist = prev.activePlotTwist;
        if (twist.optimalActions?.includes(action)) {
          multiplier *= 1.5;
        }
        if (twist.shareBonus && action === 'share') {
          multiplier *= 2;
        }
      }

      // Process action
      switch (action) {
        case 'consume': // UP - Eat the food
          if (food.faction === 'ally' || (food.faction === 'contextual' && food.isContextuallyGood)) {
            // Good food consumed - apply positive effects
            isCorrectAction = true;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const foodDef = ALL_FOODS.find(f => f.type === food.type);
            const timeModifier = foodDef?.timeModifiers?.[prev.timePhase] || 1;

            newMetrics.energy = Math.max(0, Math.min(100, newMetrics.energy + (food.effects.energy * Math.abs(timeModifier))));
            newMetrics.hydration = Math.max(0, Math.min(100, newMetrics.hydration + (food.effects.hydration * Math.abs(timeModifier))));
            newMetrics.nutrition = Math.max(0, Math.min(100, newMetrics.nutrition + (food.effects.nutrition * Math.abs(timeModifier))));
            newMetrics.stability = Math.max(0, Math.min(100, newMetrics.stability + (food.effects.stability * Math.abs(timeModifier))));

            points = Math.round(food.points * multiplier);

            // Show reflection message for good food consumed (50% chance, not every time)
            if (userMode && Math.random() < 0.5) {
              const reflection = getReflectionMessage(userMode, 'ally_consumed');
              if (reflection) {
                showAnnouncement(reflection.text, 'reflection', reflection.science);
              }
            }

            // Lore Discovery: Green Aegis (Fiber)
            if (food.type === 'vegetable' && newComboCount >= 5) {
              discoverLore('fiber');
            }
            // Lore Discovery: Morning Shield
            if (prev.timePhase === 'morning' && food.type === 'protein') {
              discoverLore('breakfast');
            }
          } else {
            // Bad food consumed - apply negative effects
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            newMetrics.energy = Math.max(0, Math.min(100, newMetrics.energy + food.effects.energy));
            newMetrics.hydration = Math.max(0, Math.min(100, newMetrics.hydration + food.effects.hydration));
            newMetrics.nutrition = Math.max(0, Math.min(100, newMetrics.nutrition + food.effects.nutrition));
            newMetrics.stability = Math.max(0, Math.min(100, newMetrics.stability + food.effects.stability));

            points = Math.round(food.points * 0.5); // Reduced points for eating bad food
            showAnnouncement('⚠️ That wasn\'t healthy!', 'warning');
          }

          // Notify health system about food consumption
          if (onFoodConsumed) {
            const foodNutrients = getFoodNutrients(food);
            if (foodNutrients) {
              onFoodConsumed(foodNutrients);
            }
          }
          break;

        case 'reject': // DOWN - Banish the food
          if (food.faction === 'enemy' || (food.faction === 'contextual' && !food.isContextuallyGood)) {
            // Correctly rejected bad food
            isCorrectAction = true;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            points = Math.round(food.points * multiplier);

            // Show reflection message for enemy rejected (50% chance)
            if (userMode && Math.random() < 0.5) {
              const reflection = getReflectionMessage(userMode, 'enemy_rejected');
              if (reflection) {
                showAnnouncement(reflection.text, 'reflection', reflection.science);
              }
            }

            // Lore Discovery: The Knight's March (Exercise/Reject streak)
            if (newComboCount >= 10) {
              discoverLore('exercise');
            }
          } else {
            // Wrongly rejected good food
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            points = 0;
            newMetrics.nutrition = Math.max(0, newMetrics.nutrition - 3);
            showAnnouncement('❌ That was healthy!', 'error');
            triggerScreenShake(5);
          }
          break;

        case 'save': // LEFT - Save for later
          const emptySlotIndex = newSavedFoods.findIndex(slot => slot.food === null);
          if (emptySlotIndex !== -1) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            newSavedFoods[emptySlotIndex] = { food: { ...food }, savedAt: now };
            points = Math.round(food.points * 0.3); // Small points for saving
            showAnnouncement('📦 Saved for later!', 'info');
          } else {
            // No empty slots
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            showAnnouncement('⚠️ Storage full!', 'warning');
            points = 0;
          }
          break;

        case 'share': // RIGHT - Share with others
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

          // Sharing gives social meter boost and bonus points
          newSocialStats.totalShares++;
          newSocialStats.shareStreak = isComboActive ? newSocialStats.shareStreak + 1 : 1;
          newSocialStats.socialMeter = Math.min(100, newSocialStats.socialMeter + 10);

          // Lore Discovery: Pure Stream (Hydration)
          if (food.type === 'water') {
            discoverLore('hydration');
          }

          // High social meter gives bonus multiplier
          if (newSocialStats.socialMeter >= 70) {
            multiplier *= 1.5;
          }

          // Sharing comfort foods during stress events is extra good
          if (prev.activePlotTwist?.id === 'stressful_call' || prev.activePlotTwist?.id === 'social_lunch') {
            multiplier *= 2;
            newMetrics.stability = Math.min(100, newMetrics.stability + 5);
          }

          points = Math.round((food.points + 15) * multiplier); // Base share bonus + multiplier
          showAnnouncement(`🤝 Shared! +${points}`, 'success');
          break;
      }

      // Check for combo tier announcements
      const comboTier = COMBO_TIERS.find(t => t.count === newComboCount);
      if (comboTier) {
        showAnnouncement(comboTier.title, 'success');
      }

      // Show optimal swipe reflection (rare: 20% chance to avoid spam)
      if (isOptimalSwipe && userMode && Math.random() < 0.2) {
        const reflection = getReflectionMessage(userMode, 'optimal_swipe');
        if (reflection) {
          showAnnouncement(reflection.text, 'reflection', reflection.science);
        }
      }

      // Check for critical metrics warnings
      if (newMetrics.energy <= 20 && prev.metrics.energy > 20) {
        showAnnouncement(getRandomAnnouncement('ENERGY_LOW'), 'warning');
      }
      if (newMetrics.hydration <= 20 && prev.metrics.hydration > 20) {
        showAnnouncement(getRandomAnnouncement('HYDRATION_LOW'), 'warning');
      }
      if (newMetrics.nutrition <= 20 && prev.metrics.nutrition > 20) {
        showAnnouncement(getRandomAnnouncement('NUTRITION_LOW'), 'warning');
      }

      return {
        ...prev,
        score: prev.score + points,
        stability: newMetrics.stability,
        metrics: newMetrics,
        foods: prev.foods.filter(f => f.id !== foodId),
        comboCount: newComboCount,
        lastSwipeTime: now,
        correctSwipes: isCorrectAction ? prev.correctSwipes + 1 : prev.correctSwipes,
        incorrectSwipes: !isCorrectAction ? prev.incorrectSwipes + 1 : prev.incorrectSwipes,
        optimalSwipes: isOptimalSwipe ? prev.optimalSwipes + 1 : prev.optimalSwipes,
        savedFoods: newSavedFoods,
        socialStats: newSocialStats,
        lastSwipeAction: action,
      };
    });
  }, [showAnnouncement, triggerScreenShake]);

  // Use exercise power-up
  const useExercise = useCallback(() => {
    setGameState(prev => {
      if (powerupsDisabledRef.current) return prev;
      if (prev.exerciseCharges <= 0) return prev;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      playSound('powerup');
      showAnnouncement(getRandomAnnouncement('EXERCISE_USED'), 'success');

      let newMetrics = { ...prev.metrics };
      let newStability = prev.stability;

      if (prev.gameMode === 'life') {
        // In Life Mode, exercise burns energy but improves stability
        newMetrics.energy = Math.max(0, newMetrics.energy - 15);
        newMetrics.stability = Math.max(0, newMetrics.stability + POWER_UPS.EXERCISE.stabilityChange);
        newStability = newMetrics.stability;
      } else {
        newStability = Math.max(0, prev.stability + POWER_UPS.EXERCISE.stabilityChange);
      }

      return {
        ...prev,
        stability: newStability,
        metrics: newMetrics,
        exerciseCharges: prev.exerciseCharges - 1,
      };
    });
  }, [showAnnouncement]);

  // Use rations power-up
  const useRations = useCallback(() => {
    setGameState(prev => {
      if (powerupsDisabledRef.current) return prev;
      if (prev.rationCharges <= 0) return prev;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      showAnnouncement(getRandomAnnouncement('RATIONS_USED'), 'success');

      let newMetrics = { ...prev.metrics };
      let newStability = prev.stability;

      if (prev.gameMode === 'life') {
        // In Life Mode, rations boost all metrics slightly
        newMetrics.energy = Math.min(100, newMetrics.energy + 10);
        newMetrics.hydration = Math.min(100, newMetrics.hydration + 8);
        newMetrics.nutrition = Math.min(100, newMetrics.nutrition + 8);
        newMetrics.stability = Math.min(100, newMetrics.stability + POWER_UPS.RATIONS.stabilityChange);
        newStability = newMetrics.stability;
      } else {
        newStability = Math.min(100, prev.stability + POWER_UPS.RATIONS.stabilityChange);
      }

      return {
        ...prev,
        stability: newStability,
        metrics: newMetrics,
        rationCharges: prev.rationCharges - 1,
      };
    });
  }, [showAnnouncement]);

  const skipTutorial = useCallback(() => {
    setGameState(prev => ({ ...prev, showTutorial: false }));
  }, []);

  const nextTutorialStep = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      tutorialStep: prev.tutorialStep + 1,
    }));
  }, []);

  // Consume a saved food from storage
  const consumeSavedFood = useCallback((slotIndex: number) => {
    setGameState(prev => {
      const slot = prev.savedFoods[slotIndex];
      if (!slot || !slot.food) return prev;

      const food = slot.food;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Apply food effects
      let newMetrics = { ...prev.metrics };
      const foodDef = ALL_FOODS.find(f => f.type === food.type);
      const timeModifier = foodDef?.timeModifiers?.[prev.timePhase] || 1;

      newMetrics.energy = Math.max(0, Math.min(100, newMetrics.energy + (food.effects.energy * Math.abs(timeModifier))));
      newMetrics.hydration = Math.max(0, Math.min(100, newMetrics.hydration + (food.effects.hydration * Math.abs(timeModifier))));
      newMetrics.nutrition = Math.max(0, Math.min(100, newMetrics.nutrition + (food.effects.nutrition * Math.abs(timeModifier))));
      newMetrics.stability = Math.max(0, Math.min(100, newMetrics.stability + (food.effects.stability * Math.abs(timeModifier))));

      // Clear the slot
      const newSavedFoods = [...prev.savedFoods];
      newSavedFoods[slotIndex] = { food: null, savedAt: 0 };

      // Bonus points for strategic use
      const points = Math.round(food.points * 1.5);
      showAnnouncement(`🎯 Used saved ${food.sprite}! +${points}`, 'success');

      return {
        ...prev,
        score: prev.score + points,
        stability: newMetrics.stability,
        metrics: newMetrics,
        savedFoods: newSavedFoods,
      };
    });
  }, [showAnnouncement]);

  return {
    gameState,
    startGame,
    endGame,
    handleSwipe,
    useExercise,
    useRations,
    skipTutorial,
    nextTutorialStep,
    consumeSavedFood,
    pauseGame: () => setGameState(prev => ({ ...prev, isPaused: true })),
    resumeGame: () => setGameState(prev => ({ ...prev, isPaused: false })),
    restartGame: (mode?: GameMode) => {
      // Clear all timers
      if (timerRef.current) clearInterval(timerRef.current);
      if (spawnRef.current) clearInterval(spawnRef.current);
      if (moveRef.current) clearInterval(moveRef.current);
      if (announcementRef.current) clearTimeout(announcementRef.current);
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      if (plotTwistRef.current) clearTimeout(plotTwistRef.current);
      // Reset all game state properly
      const morningCondition = mode === 'life' ? getRandomMorningCondition() : 'normal_day';
      const conditionConfig = getMorningConditionConfig(morningCondition);
      const lifeMetrics = {
        energy: conditionConfig.metricModifiers.energy || INITIAL_METRICS.energy,
        hydration: conditionConfig.metricModifiers.hydration || INITIAL_METRICS.hydration,
        nutrition: conditionConfig.metricModifiers.nutrition || INITIAL_METRICS.nutrition,
        stability: conditionConfig.metricModifiers.stability || INITIAL_STABILITY
      };
      setGameState({
        ...initialGameState,
        isGameActive: true,
        showTutorial: false,
        gameMode: mode || gameState.gameMode,
        morningCondition: morningCondition,
        metrics: mode === 'life' ? lifeMetrics : { ...INITIAL_METRICS },
        stability: mode === 'life' ? lifeMetrics.stability : INITIAL_STABILITY,
        timePhase: 'morning',
        correctSwipes: 0,
        incorrectSwipes: 0,
        optimalSwipes: 0,
      });
      // Start fresh game
      setTimeout(() => {
        if (mode === 'life') {
          showAnnouncement(`${conditionConfig.icon} ${conditionConfig.name}`, 'info');
          setTimeout(() => {
            showAnnouncement(conditionConfig.description, 'info');
          }, 2000);
        } else {
          showAnnouncement(getRandomAnnouncement('GAME_START'), 'info');
        }
      }, 500);
    },
    getStabilityZone: () => getStabilityZone(gameState.stability, balancedRangeRef.current),
    getTimePhase: () => getTimePhase(gameState.timer),
    getMorningConditionConfig: () => getMorningConditionConfig(gameState.morningCondition),
  };
};
