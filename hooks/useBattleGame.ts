import { useState, useEffect, useRef, useCallback } from 'react';
import { Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
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
  ALLY_FOODS,
  ENEMY_FOODS,
  ALL_FOODS,
  SPAWN_CONFIG,
  ANNOUNCEMENTS,
  POWER_UPS,
  STABILITY_ZONES,
  TIME_PHASES,
  MORNING_CONDITIONS,
  PLOT_TWISTS,
  MODE_PLOT_TWISTS,
  INITIAL_METRICS,
  METRIC_DRAIN_RATES,
  SPECIAL_MODES,
  MISS_PENALTIES,
  TIME_SPEED_MODIFIERS,
  MESSAGE_POSITIONS,
} from '@/constants/gameConfig';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
import { getReflectionMessage } from '@/constants/userModes';
import { useVRFService } from './useVRFService';
import { SeededRandom, getWeeklySeed } from '@/utils/random';
import { useBeam } from '@/context/BeamContext';

const { width, height } = Dimensions.get('window');

const getRandomAnnouncement = (category: keyof typeof ANNOUNCEMENTS): string => {
  const options = ANNOUNCEMENTS[category];
  if (!options || !Array.isArray(options)) return '';
  return options[Math.floor(Math.random() * options.length)];
};

const getRandomPosition = () => {
  const positions = MESSAGE_POSITIONS;
  return positions[Math.floor(Math.random() * positions.length)] as { x: 'left' | 'center' | 'right'; y: 'top' | 'middle' | 'bottom' };
};

const getStabilityZone = (stability: number): StabilityZone => {
  if (stability >= 40 && stability <= 60) return 'balanced';
  if (stability >= 25 && stability < 40) return 'warning-low';
  if (stability > 60 && stability <= 75) return 'warning-high';
  if (stability < 25) return 'critical-low';
  return 'critical-high';
};

// Get current time phase based on timer
const getTimePhase = (timer: number): TimePhase => {
  if (timer >= 46) return 'morning';
  if (timer >= 31) return 'midday';
  if (timer >= 16) return 'afternoon';
  return 'evening';
};

// Get random morning condition
const getRandomMorningCondition = (): MorningCondition => {
  const conditions: MorningCondition[] = ['well_rested', 'poor_sleep', 'sick_day', 'marathon_day', 'stressed', 'recovery_day', 'normal_day'];
  return conditions[Math.floor(Math.random() * conditions.length)];
};

// Get morning condition config
const getMorningConditionConfig = (condition: MorningCondition) => {
  return MORNING_CONDITIONS.find(c => c.id === condition) || MORNING_CONDITIONS.find(c => c.id === 'normal_day')!;
};

// Check if a metric is in critical state
const isMetricCritical = (value: number): boolean => value <= 15 || value >= 85;
const isMetricWarning = (value: number): boolean => (value > 15 && value <= 30) || (value >= 70 && value < 85);

// Default food effects for backwards compatibility
const DEFAULT_EFFECTS: FoodEffects = { energy: 0, hydration: 0, nutrition: 0, stability: 0 };

const selectRandomFood = (isAlly: boolean, timePhase?: TimePhase, seededRandom?: SeededRandom | null): FoodDefinition => {
  const foods = isAlly ? ALLY_FOODS : ENEMY_FOODS;
  const totalWeight = foods.reduce((sum, f) => sum + f.spawnWeight, 0);
  let random = seededRandom ? seededRandom.next() * totalWeight : Math.random() * totalWeight;

  for (const food of foods) {
    random -= food.spawnWeight;
    if (random <= 0) return food;
  }
  return foods[0];
};

const SIDE_PANEL_WIDTH = 80; // Match the side panel width from LifeModeHUD

const createFoodUnit = (definition: FoodDefinition, timePhase?: TimePhase, gameMode?: GameMode, seededRandom?: SeededRandom | null): FoodUnit => {
  // For life mode, spawn within the narrower center area
  const leftMargin = gameMode === 'life' ? SIDE_PANEL_WIDTH + 20 : 40;
  const rightMargin = gameMode === 'life' ? SIDE_PANEL_WIDTH + 20 : 40;
  const randomX = seededRandom ? seededRandom.next() : Math.random();
  const spawnX = leftMargin + randomX * (width - leftMargin - rightMargin);
  const spawnY = -60;

  // Determine if contextual food is good based on time
  let isContextuallyGood = true;
  if (definition.faction === 'contextual' && definition.timeModifiers && timePhase) {
    const modifier = definition.timeModifiers[timePhase] || 1;
    isContextuallyGood = modifier > 0;
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
    y: spawnY,
    targetY: height - 200, // Stop well above the bottom (was 120, now 200)
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

export const useBattleGame = (onFoodConsumed?: (foodNutrients: FoodNutrients) => void, tierConfig?: any, userMode?: UserMode) => {
  const beamContext = useBeam();
  const playerAccount = beamContext?.playerAccount;
  const reportGameResult = beamContext?.reportGameResult;
  const { discoverLore } = usePlayerProgressContext();
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const timerRef = useRef<number | null>(null);
  const spawnRef = useRef<number | null>(null);
  const moveRef = useRef<number | null>(null);
  const announcementRef = useRef<number | null>(null);
  const comboTimerRef = useRef<number | null>(null);
  const plotTwistRef = useRef<number | null>(null);

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

  // Trigger a plot twist (Life Mode only)
  // Initialize VRF service
  const { generateFairPlotTwist, getVerifiableRandom } = useVRFService();

  const [vrfEnabled, setVrfEnabled] = useState(false); // Toggle for testing VRF fairness
  const seededRandomRef = useRef<SeededRandom | null>(null);

  useEffect(() => {
    if (tierConfig?.tier === 'weekly') {
      seededRandomRef.current = new SeededRandom(getWeeklySeed());
    } else {
      seededRandomRef.current = null;
    }
  }, [tierConfig?.tier]);

  const triggerPlotTwist = useCallback(async () => {
    try {
      let twist, fairnessProof, isVerifiable;

      if (vrfEnabled) {
        // Use VRF for provably fair plot twists
        const result = await generateFairPlotTwist(gameState.gameMode, Date.now());
        twist = result.plotTwist;
        fairnessProof = result.fairnessProof;
        isVerifiable = result.isVerifiable;
      } else {
        // Use mode-specific plot twists if userMode is available, otherwise use default
        const availableTwists = userMode
          ? MODE_PLOT_TWISTS[userMode].filter(t => Math.random() > 0.3) // Random selection
          : PLOT_TWISTS.filter(t => Math.random() > 0.3); // Use default for backward compatibility

        if (availableTwists.length === 0) return;

        twist = availableTwists[Math.floor(Math.random() * availableTwists.length)];
        fairnessProof = undefined; // No fairness proof when not using VRF
        isVerifiable = false;
      }

      setGameState(prev => {
        if (prev.gameMode !== 'life' || prev.activePlotTwist || prev.plotTwistsTriggered >= 2) return prev;

        // Apply immediate effect
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

      // Show the plot twist announcement with bonus condition as science text (if available)
      // Include fairness proof badge if this is a verifiable plot twist
      if (twist.bonusCondition) {
        const announcementText = isVerifiable
          ? `${twist.icon} ${twist.name} ⚖️ FAIR`
          : `${twist.icon} ${twist.name}`;
        showAnnouncement(announcementText, 'plot_twist', twist.bonusCondition);
      } else {
        const announcementText = isVerifiable
          ? `${twist.icon} ${twist.name} ⚖️ FAIR`
          : `${twist.icon} ${twist.name}`;
        showAnnouncement(announcementText, 'plot_twist');
      }
      triggerScreenShake(12);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.error('Error triggering plot twist:', error);
      // Fallback to regular plot twist on VRF error
      const availableTwists = userMode
        ? MODE_PLOT_TWISTS[userMode].filter(t => Math.random() > 0.3) // Random selection
        : PLOT_TWISTS.filter(t => Math.random() > 0.3); // Use default for backward compatibility

      if (availableTwists.length === 0) return;

      const fallbackTwist = availableTwists[Math.floor(Math.random() * availableTwists.length)];

      setGameState(prev => {
        if (prev.gameMode !== 'life' || prev.activePlotTwist || prev.plotTwistsTriggered >= 2) return prev;

        // Apply immediate effect
        const newMetrics = { ...prev.metrics };
        if (fallbackTwist.effect.energy) newMetrics.energy = Math.max(0, Math.min(100, newMetrics.energy + fallbackTwist.effect.energy));
        if (fallbackTwist.effect.hydration) newMetrics.hydration = Math.max(0, Math.min(100, newMetrics.hydration + fallbackTwist.effect.hydration));
        if (fallbackTwist.effect.nutrition) newMetrics.nutrition = Math.max(0, Math.min(100, newMetrics.nutrition + fallbackTwist.effect.nutrition));
        if (fallbackTwist.effect.stability) newMetrics.stability = Math.max(0, Math.min(100, newMetrics.stability + fallbackTwist.effect.stability));

        return {
          ...prev,
          activePlotTwist: fallbackTwist,
          plotTwistTimer: fallbackTwist.duration,
          plotTwistsTriggered: prev.plotTwistsTriggered + 1,
          metrics: newMetrics,
        };
      });

      // Show the plot twist announcement with bonus condition as science text (if available)
      if (fallbackTwist.bonusCondition) {
        showAnnouncement(`${fallbackTwist.icon} ${fallbackTwist.name}`, 'plot_twist', fallbackTwist.bonusCondition);
      } else {
        showAnnouncement(`${fallbackTwist.icon} ${fallbackTwist.name}`, 'plot_twist');
      }
      triggerScreenShake(12);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [showAnnouncement, triggerScreenShake, userMode, vrfEnabled, generateFairPlotTwist, gameState.gameMode]);

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
  }, [showAnnouncement]);

  const endGame = useCallback(async (result: 'victory' | 'defeat') => {
    setGameState(prev => ({
      ...prev,
      isGameActive: false,
      gameResult: result,
    }));

    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
    if (moveRef.current) clearInterval(moveRef.current);
    if (plotTwistRef.current) clearTimeout(plotTwistRef.current);

    // Sync results with Beam (ENHANCEMENT FIRST & PERFORMANT)
    if (playerAccount && reportGameResult) {
      reportGameResult(gameState.score, result, {
        correctSwipes: gameState.correctSwipes,
        incorrectSwipes: gameState.incorrectSwipes,
        comboMax: gameState.comboCount, // Fixed: use comboCount instead of comboMax
        timeInBalanced: gameState.timeInBalanced,
        finalHarmony: gameState.stability
      });
    }

    Haptics.notificationAsync(
      result === 'victory'
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error
    );
  }, [playerAccount, reportGameResult, gameState.score, gameState.correctSwipes, gameState.incorrectSwipes, gameState.comboCount, gameState.timeInBalanced, gameState.stability]);

  // Timer countdown with Life Mode support
  useEffect(() => {
    if (!gameState.isGameActive || gameState.isPaused) return;

    timerRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.isPaused) return prev;
        const newTimer = prev.timer - 1;
        const zone = getStabilityZone(prev.stability);
        const newTimePhase = getTimePhase(newTimer);
        const conditionConfig = getMorningConditionConfig(prev.morningCondition);

        // Track time in zones
        let timeInBalanced = prev.timeInBalanced;
        let timeInWarning = prev.timeInWarning;
        let timeInCritical = prev.timeInCritical;

        if (zone === 'balanced') timeInBalanced++;
        else if (zone.includes('warning')) timeInWarning++;
        else timeInCritical++;

        // Life Mode: Apply metric drain and condition multipliers
        let newMetrics = { ...prev.metrics };
        if (prev.gameMode === 'life') {
          const drainMultipliers = conditionConfig.needsMultipliers;
          newMetrics.energy = Math.max(0, newMetrics.energy - (METRIC_DRAIN_RATES.energy * (drainMultipliers.energy || 1)));
          newMetrics.hydration = Math.max(0, newMetrics.hydration - (METRIC_DRAIN_RATES.hydration * (drainMultipliers.hydration || 1)));
          newMetrics.nutrition = Math.max(0, newMetrics.nutrition - (METRIC_DRAIN_RATES.nutrition * (drainMultipliers.nutrition || 1)));
          newMetrics.stability = Math.max(0, Math.min(100, newMetrics.stability - (METRIC_DRAIN_RATES.stability * (drainMultipliers.stability || 1))));

          // Apply ongoing plot twist effects
          if (prev.activePlotTwist?.ongoingEffect) {
            const ongoing = prev.activePlotTwist.ongoingEffect;
            if (ongoing.energy) newMetrics.energy = Math.max(0, Math.min(100, newMetrics.energy + ongoing.energy));
            if (ongoing.hydration) newMetrics.hydration = Math.max(0, Math.min(100, newMetrics.hydration + ongoing.hydration));
            if (ongoing.nutrition) newMetrics.nutrition = Math.max(0, Math.min(100, newMetrics.nutrition + ongoing.nutrition));
            if (ongoing.stability) newMetrics.stability = Math.max(0, Math.min(100, newMetrics.stability + ongoing.stability));
          }
        }

        // Record metrics history for end-game graph
        const metricsHistory = [...prev.metricsHistory, { ...newMetrics }];

        // Handle plot twist timer
        let activePlotTwist = prev.activePlotTwist;
        let plotTwistTimer = prev.plotTwistTimer;
        if (activePlotTwist && plotTwistTimer > 0) {
          plotTwistTimer--;
          if (plotTwistTimer <= 0) {
            activePlotTwist = null;
          }
        }

        // Phase change announcement (Life Mode)
        if (prev.gameMode === 'life' && newTimePhase !== prev.timePhase) {
          const phaseKey = `PHASE_${newTimePhase.toUpperCase()}` as keyof typeof ANNOUNCEMENTS;
          if (ANNOUNCEMENTS[phaseKey]) {
            showAnnouncement(getRandomAnnouncement(phaseKey), 'info');
          }
        }

        // Final wave announcement
        if (newTimer === 10) {
          showAnnouncement(getRandomAnnouncement('FINAL_WAVE'), 'warning');
        }

          // Check for game end
          if (newTimer <= 0) {
            const isVictory = prev.gameMode === 'classic'
              ? (prev.stability >= 30 && prev.stability <= 70 && prev.score > 0)
              : (newMetrics.energy > 15 && newMetrics.hydration > 15 && newMetrics.nutrition > 15 && newMetrics.stability > 15 && prev.score > 0);

            endGame(isVictory ? 'victory' : 'defeat');

            return {
              ...prev,
              timer: 0,
              isGameActive: false,
              gameResult: isVictory ? 'victory' : 'defeat',
              timeInBalanced,
              timeInWarning,
              timeInCritical,
              metrics: newMetrics,
              stability: prev.gameMode === 'life' ? newMetrics.stability : prev.stability,
              metricsHistory,
              activePlotTwist,
              plotTwistTimer,
            };
          }

          // Life Mode: Check for critical metrics (game over)
          if (prev.gameMode === 'life') {
            const anyCriticalLow = newMetrics.energy <= 5 || newMetrics.hydration <= 5 || newMetrics.nutrition <= 5 || newMetrics.stability <= 5;
            if (anyCriticalLow) {
              endGame('defeat');

              return {
                ...prev,
                timer: newTimer,
                isGameActive: false,
                gameResult: 'defeat',
                metrics: newMetrics,
                metricsHistory,
              };
            }
          }

        return {
          ...prev,
          timer: newTimer,
          timePhase: newTimePhase,
          timeInBalanced,
          timeInWarning,
          timeInCritical,
          metrics: newMetrics,
          stability: prev.gameMode === 'life' ? newMetrics.stability : prev.stability,
          metricsHistory,
          activePlotTwist,
          plotTwistTimer,
        };
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.isGameActive, gameState.isPaused, endGame, showAnnouncement]);

  // Plot twist trigger (Life Mode) - trigger at random times
  useEffect(() => {
    if (!gameState.isGameActive || gameState.gameMode !== 'life') return;

    // Schedule plot twists at random intervals
    const scheduleNextTwist = () => {
      const delay = 15000 + Math.random() * 20000; // Between 15-35 seconds
      plotTwistRef.current = setTimeout(() => {
        if (gameState.timer > 10 && gameState.plotTwistsTriggered < 2) {
          triggerPlotTwist();
        }
      }, delay);
    };

    scheduleNextTwist();

    return () => {
      if (plotTwistRef.current) clearTimeout(plotTwistRef.current);
    };
  }, [gameState.isGameActive, gameState.gameMode, triggerPlotTwist, userMode]);

  // Spawn foods
  useEffect(() => {
    if (!gameState.isGameActive || gameState.isPaused) return;

    const getSpawnInterval = () => {
      const elapsed = GAME_DURATION - gameState.timer;
      const reduction = Math.floor(elapsed / 10) * SPAWN_CONFIG.INTERVAL_DECREASE;
      return Math.max(SPAWN_CONFIG.MIN_INTERVAL, SPAWN_CONFIG.INITIAL_INTERVAL - reduction);
    };

    const spawnFood = () => {
      setGameState(prev => {
        if (prev.foods.length >= SPAWN_CONFIG.MAX_FOODS_ON_SCREEN || prev.isPaused) return prev;

        const randomVal = seededRandomRef.current ? seededRandomRef.current.next() : Math.random();
        const isAlly = randomVal < SPAWN_CONFIG.ALLY_SPAWN_CHANCE;
        const definition = selectRandomFood(isAlly, prev.timePhase, seededRandomRef.current);
        const newFood = createFoodUnit(definition, prev.timePhase, prev.gameMode, seededRandomRef.current);

        return {
          ...prev,
          foods: [...prev.foods, newFood],
        };
      });
    };

    // Initial spawn
    spawnFood();
    setTimeout(spawnFood, 400);
    setTimeout(spawnFood, 800);

    spawnRef.current = setInterval(spawnFood, getSpawnInterval());

    return () => {
      if (spawnRef.current) clearInterval(spawnRef.current);
    };
  }, [gameState.isGameActive, gameState.isPaused, gameState.timer]);

  // Move foods
  useEffect(() => {
    if (!gameState.isGameActive || gameState.isPaused) return;

    moveRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.isPaused) return prev;
        const updatedFoods: FoodUnit[] = [];
        let newStability = prev.stability;
        let newMetrics = { ...prev.metrics };
        let missedCount = 0;

        // Get tier-specific penalties (fallback to tier1 if tierConfig not provided)
        const tierKey = (tierConfig?.tier || 'tier1') as keyof typeof MISS_PENALTIES;
        const penalties = MISS_PENALTIES[tierKey];
        let comboBreaker = false;

        for (const food of prev.foods) {
          if (food.isBeingDragged) {
            updatedFoods.push(food);
            continue;
          }

          const newY = food.y + food.speed;

          // Food reached the gate - miss penalty
          if (newY >= food.targetY) {
            missedCount++;
            comboBreaker = true; // All misses break combo

            if (prev.gameMode === 'life') {
              // Life Mode: scale penalties by tier
              if (food.faction === 'enemy') {
                // Enemy got through - apply tier-scaled penalty
                newMetrics.stability = Math.max(0, Math.min(100, newMetrics.stability - penalties.enemyGetThrough));
                // Tier 3 also damages energy
                if (tierConfig?.tier === 'tier3') {
                  newMetrics.energy = Math.max(0, newMetrics.energy - 10);
                }
              } else {
                // Ally missed - tier-scaled nutrition penalty
                newMetrics.nutrition = Math.max(0, newMetrics.nutrition - penalties.allyMissed);
              }
              newStability = newMetrics.stability;
            } else {
              // Classic mode: tier-scaled stability penalties
              if (food.faction === 'enemy') {
                newStability = Math.max(0, newStability - penalties.enemyGetThrough);
              } else {
                newStability = Math.max(0, newStability - penalties.allyMissed);
              }
            }
          } else {
            updatedFoods.push({ ...food, y: newY });
          }
        }

        // Show combo break announcement if streak was lost
        if (comboBreaker && prev.comboCount > 0) {
          showAnnouncement(getRandomAnnouncement('COMBO_BREAK'), 'warning');
        }

        // Check for critical stability (Classic mode)
        if (prev.gameMode === 'classic' && (newStability <= 5 || newStability >= 95)) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (spawnRef.current) clearInterval(spawnRef.current);
          if (moveRef.current) clearInterval(moveRef.current);

          return {
            ...prev,
            foods: updatedFoods,
            stability: newStability,
            isGameActive: false,
            gameResult: 'defeat',
          };
        }

        return {
          ...prev,
          foods: updatedFoods,
          stability: newStability,
          metrics: newMetrics,
          // Break combo on any missed food
          comboCount: comboBreaker ? 0 : prev.comboCount,
        };
      });
    }, 32); // ~30fps

    return () => {
      if (moveRef.current) clearInterval(moveRef.current);
    };
  }, [gameState.isGameActive, gameState.isPaused, endGame, tierConfig?.tier]);

  // Handle swipe on food - supports 4 directions in Life Mode
  const handleSwipe = useCallback((foodId: string, direction: SwipeDirection, action: SwipeAction) => {
    setGameState(prev => {
      const food = prev.foods.find(f => f.id === foodId);
      if (!food) return prev;

      const now = Date.now();
      const isComboActive = now - prev.lastSwipeTime < COMBO_WINDOW;

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

          const newComboCount = isComboActive ? prev.comboCount + 1 : 1;
          let multiplier = 1;
          for (const tier of COMBO_TIERS) {
            if (newComboCount >= tier.count) multiplier = tier.multiplier;
          }

          const points = Math.round(food.points * multiplier);
          const newStability = Math.max(0, Math.min(100, prev.stability + food.glucoseImpact));

          const comboTier = COMBO_TIERS.find(t => t.count === newComboCount);
          if (comboTier) showAnnouncement(comboTier.title, 'success');

          const oldZone = getStabilityZone(prev.stability);
          const newZone = getStabilityZone(newStability);

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
        correctSwipes: isOptimalSwipe ? prev.correctSwipes + 1 : prev.correctSwipes,
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
      if (prev.exerciseCharges <= 0) return prev;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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
    getStabilityZone: () => getStabilityZone(gameState.stability),
    getTimePhase: () => getTimePhase(gameState.timer),
    getMorningConditionConfig: () => getMorningConditionConfig(gameState.morningCondition),
    // VRF Functions
    enableVRF: () => setVrfEnabled(true),
    disableVRF: () => setVrfEnabled(false),
    isVRFEnabled: vrfEnabled,
  };
};
