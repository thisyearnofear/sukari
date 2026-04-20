import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FoodCard } from './FoodCard';
import { BattleHUD } from './BattleHUD';
import { BattleTutorialModal } from './BattleTutorialModal';
import { LifeModeHeader, LifeModeFooter, LeftSidePanel, RightSidePanel, SIDE_PANEL_WIDTH, LifeModePauseOverlay, SocialMeterDisplay } from './LifeModeHUD';
import { AnimatedBackground } from './AnimatedBackground';
import { InsulinControl } from './InsulinControl';
import { GameState, StabilityZone, ControlMode, SwipeDirection, SwipeAction } from '@/types/game';
import { HealthProfile } from '@/types/health';
import { COMBO_TIERS } from '@/constants/gameConfig';
import { getGlucoseZone } from '@/constants/healthScenarios';
import { TierConfig } from '@/constants/gameTiers';
import { getStabilityZone } from '@/utils/gameLogic';
import { GatesOpen, KingdomTrembles, StormApproaches, KingdomRallies, KingdomFalls, NewPowerGlow } from './DramaticMoments';

// Screen-wide combo burst effect
const ComboBurst: React.FC<{
  comboCount: number;
  color: string;
}> = ({ comboCount, color }) => {
  const burstAnim = useRef(new Animated.Value(0)).current;
  const [particles, setParticles] = useState<{ id: number; angle: number; distance: number }[]>([]);
  
  useEffect(() => {
    if (comboCount >= 3) {
      // Generate particles
      const newParticles = Array.from({ length: 16 }, (_, i) => ({
        id: i,
        angle: (i / 16) * Math.PI * 2,
        distance: 100 + Math.random() * 150,
      }));
      setParticles(newParticles);
      
      // Animate burst
      burstAnim.setValue(0);
      Animated.timing(burstAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [comboCount, burstAnim]);

  if (comboCount < 3) return null;

  const scale = burstAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.5, 1.5, 2],
  });

  const opacity = burstAnim.interpolate({
    inputRange: [0, 0.2, 0.5, 1],
    outputRange: [0, 1, 0.5, 0],
  });

  return (
    <View style={styles.comboBurstContainer} pointerEvents="none">
      {/* Central burst ring */}
      <Animated.View
        style={[
          styles.burstRing,
          {
            borderColor: color,
            transform: [{ scale }],
            opacity,
          },
        ]}
      />
      
      {/* Particles */}
      {particles.map((particle) => {
        const translateX = burstAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(particle.angle) * particle.distance],
        });
        const translateY = burstAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(particle.angle) * particle.distance],
        });
        const particleOpacity = burstAnim.interpolate({
          inputRange: [0, 0.3, 0.7, 1],
          outputRange: [0, 1, 0.8, 0],
        });
        const particleScale = burstAnim.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [0.5, 1.2, 0.3],
        });

        return (
          <Animated.View
            key={particle.id}
            style={[
              styles.burstParticle,
              {
                backgroundColor: color,
                transform: [{ translateX }, { translateY }, { scale: particleScale }],
                opacity: particleOpacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

// Screen flash effect for correct/incorrect swipes
const ScreenFlash: React.FC<{
  type: 'success' | 'error' | null;
  trigger: number;
}> = ({ type, trigger }) => {
  const flashAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (type) {
      flashAnim.setValue(0.4);
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [trigger, type, flashAnim]);

  if (!type) return null;

  const color = type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';

  return (
    <Animated.View
      style={[
        styles.screenFlash,
        {
          backgroundColor: color,
          opacity: flashAnim,
        },
      ]}
      pointerEvents="none"
    />
  );
};

interface BattleScreenProps {
  gameState: GameState;
  onSwipe: (foodId: string, direction: SwipeDirection, action: SwipeAction) => void;
  onExercise: () => void;
  onRations: () => void;
  controlMode: ControlMode;
  onPause?: () => void;
  onResume?: () => void;
  onRestart?: () => void;
  onConsumeSaved?: (index: number) => void;
  onExit?: () => void;
  healthProfile?: HealthProfile;
  onAdministerInsulin?: (units: number, insulinType?: string) => void;
  tierConfig?: TierConfig;
  onToggleControlMode?: () => void;
  hasMechanic?: (m: string) => boolean;
}


export const BattleScreen: React.FC<BattleScreenProps> = ({
  gameState,
  onSwipe,
  onExercise,
  onRations,
  controlMode,
  onPause,
  onResume,
  onRestart,
  onConsumeSaved,
  onExit,
  healthProfile,
  onAdministerInsulin,
  tierConfig,
  onToggleControlMode,
  hasMechanic: hasMechanicProp,
}) => {
  const hasMechanic = hasMechanicProp || (() => true); // Default: show everything
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const [showInsulinControl, setShowInsulinControl] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Handle keyboard inputs for desktop
  useEffect(() => {
    if (Platform.OS !== 'web' || !gameState.isGameActive || showTutorial) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.foods.length === 0) return;
      
      const firstFood = gameState.foods[0];
      let direction: SwipeDirection | null = null;
      let action: SwipeAction | null = null;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          direction = 'up';
          action = 'consume';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          direction = 'down';
          action = 'reject';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (gameState.gameMode === 'life') {
            direction = 'left';
            action = 'save';
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (gameState.gameMode === 'life') {
            direction = 'right';
            action = 'share';
          }
          break;
        case ' ': // Space for exercise/rations or general action
          if (showInsulinControl) return;
          // Contextual action or just ignore
          break;
      }

      if (direction && action) {
        onSwipe(firstFood.id, direction, action);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.isGameActive, gameState.foods, gameState.gameMode, showTutorial, showInsulinControl, onSwipe]);
   const zone = getStabilityZone(gameState.stability);
   const insets = useSafeAreaInsets();
   
   // Track combo for burst effect
   const prevComboRef = useRef(gameState.comboCount);
   const [comboBurstTrigger, setComboBurstTrigger] = useState(0);
   
   // Dramatic moments state
   const [showGatesOpen, setShowGatesOpen] = useState(true); // #1: show on mount
   const [showComboRally, setShowComboRally] = useState<string | null>(null); // #2: color
   const [showStorm, setShowStorm] = useState<{ name: string; icon: string } | null>(null); // #4
   const [showDefeatCrack, setShowDefeatCrack] = useState(false); // #6
   const [showNewPower, setShowNewPower] = useState(false); // #7
   const prevPlotTwistRef = useRef(gameState.activePlotTwist);
   const prevGameResultRef = useRef(gameState.gameResult);
   const isCritical = zone === 'critical-low' || zone === 'critical-high';

   // #2: Combo rally pulse when reaching a new combo tier
   useEffect(() => {
     const prev = prevComboRef.current;
     const curr = gameState.comboCount;
     if (curr >= 3 && curr > prev && [3, 5, 8, 12, 18, 25].includes(curr)) {
       setShowComboRally('#fbbf24');
       setTimeout(() => setShowComboRally(null), 700);
     }
     prevComboRef.current = curr;
   }, [gameState.comboCount]);

   // #4: Storm when plot twist arrives
   useEffect(() => {
     if (gameState.activePlotTwist && !prevPlotTwistRef.current) {
       setShowStorm({ name: gameState.activePlotTwist.name, icon: gameState.activePlotTwist.icon });
     }
     prevPlotTwistRef.current = gameState.activePlotTwist;
   }, [gameState.activePlotTwist]);

   // #6: Defeat crack effect
   useEffect(() => {
     if (gameState.gameResult === 'defeat' && prevGameResultRef.current !== 'defeat') {
       setShowDefeatCrack(true);
     }
     prevGameResultRef.current = gameState.gameResult;
   }, [gameState.gameResult]);
   
   // Track swipe feedback
   const [flashType, setFlashType] = useState<'success' | 'error' | null>(null);
   const [flashTrigger, setFlashTrigger] = useState(0);
   
   // Tutorial for tier1 - show modal for first 2 foods
   const [tutorialFood, setTutorialFood] = useState<any>(null);
   const [shownContextualTip, setShownContextualTip] = useState(false);
   const [shownLifeModeTip, setShownLifeModeTip] = useState(false);
   const isTier1Tutorial = tierConfig?.tier === 'tier1' && tierConfig.tutorialMode;

   // Show one-time tooltip when first contextual food appears
   useEffect(() => {
     if (shownContextualTip) return;
     const contextualFood = gameState.foods.find(f => f.faction === 'contextual');
     if (contextualFood) {
       setShownContextualTip(true);
     }
   }, [gameState.foods, shownContextualTip]);

   // Show one-time 4-direction hint for Life Mode (tier2+)
   useEffect(() => {
     if (shownLifeModeTip || gameState.gameMode !== 'life') return;
     if (gameState.foods.length > 0 && gameState.timer > 50) {
       setShownLifeModeTip(true);
       const t = setTimeout(() => setShownLifeModeTip(false), 4000);
       return () => clearTimeout(t);
     }
   }, [gameState.foods.length, gameState.gameMode, gameState.timer, shownLifeModeTip]);
   const currentTutorialFoodId = useRef<string | null>(null);
   const tutorialTimeout = useRef<number | null>(null);

   // Show tutorial for first food
   useEffect(() => {
     // Clear any existing timeout
     if (tutorialTimeout.current) {
       clearTimeout(tutorialTimeout.current);
     }
     
     // Only show tutorial during the initial phase (first 2 swipes) and when game is active
     if (isTier1Tutorial && gameState.isGameActive && gameState.foods.length > 0 && gameState.correctSwipes + gameState.incorrectSwipes < 2) {
       const firstFood = gameState.foods[0];
       // Only show tutorial if not already showing AND either:
       // 1. No tutorial food is set yet, OR
       // 2. The current tutorial food is different from the first food
       if (!showTutorial && firstFood && firstFood.id !== currentTutorialFoodId.current) {
         // Add a small delay to prevent rapid flashing
         tutorialTimeout.current = setTimeout(() => {
           setTutorialFood(firstFood);
           currentTutorialFoodId.current = firstFood.id;
           setShowTutorial(true);
         }, 100);
       }
     } else if (showTutorial && (gameState.correctSwipes + gameState.incorrectSwipes >= 2 || !isTier1Tutorial || !gameState.isGameActive)) {
       // Only hide tutorial if we've exceeded the swipe limit, tutorial mode is off, or game is not active
       tutorialTimeout.current = setTimeout(() => {
         setShowTutorial(false);
         currentTutorialFoodId.current = null;
       }, 100);
     }
     
     return () => {
       if (tutorialTimeout.current) {
         clearTimeout(tutorialTimeout.current);
       }
     };
   }, [gameState.foods, gameState.correctSwipes, gameState.incorrectSwipes, gameState.isGameActive, isTier1Tutorial, showTutorial]);
  
  // Get combo color
  const currentTier = [...COMBO_TIERS].reverse().find(t => gameState.comboCount >= t.count);
  const comboColor = currentTier?.color || '#fbbf24';

  // Screen shake effect
  useEffect(() => {
    if (gameState.screenShake > 0) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: gameState.screenShake, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -gameState.screenShake, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: gameState.screenShake / 2, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -gameState.screenShake / 2, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [gameState.screenShake, shakeAnim]);

  // Combo burst trigger
  useEffect(() => {
    if (gameState.comboCount > prevComboRef.current && gameState.comboCount >= 3) {
      setComboBurstTrigger(prev => prev + 1);
    }
    prevComboRef.current = gameState.comboCount;
  }, [gameState.comboCount]);

  // Flash effect based on announcement type
  useEffect(() => {
    if (gameState.announcementType === 'success') {
      setFlashType('success');
      setFlashTrigger(prev => prev + 1);
    } else if (gameState.announcementType === 'error') {
      setFlashType('error');
      setFlashTrigger(prev => prev + 1);
    }
  }, [gameState.announcement, gameState.announcementType]);

  return (
    <Animated.View 
      style={[
        { flex: 1, backgroundColor: '#0a0a12', alignSelf: 'center', width: '100%', maxWidth: 500 },
        { transform: [{ translateX: shakeAnim }] }
      ]}
    >
      {/* Animated background */}
      <AnimatedBackground 
        zone={zone}
        comboCount={gameState.comboCount}
        timer={gameState.timer}
        timePhase={gameState.timePhase}
        gameMode={gameState.gameMode}
      />

      {/* #8: Morning condition badge (Life Mode) */}
      {gameState.gameMode === 'life' && gameState.morningCondition !== 'normal_day' && (
        <View style={{ position: 'absolute', top: insets.top + 90, right: 8, zIndex: 30, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#fbbf2440' }}>
          <Text style={{ color: '#fbbf24', fontSize: 10 }}>
            {gameState.morningCondition === 'well_rested' ? '😊 Well Rested' :
             gameState.morningCondition === 'poor_sleep' ? '😴 Poor Sleep' :
             gameState.morningCondition === 'sick_day' ? '🤒 Sick Day' :
             gameState.morningCondition === 'stressed' ? '😰 Stressed' :
             gameState.morningCondition === 'marathon_day' ? '🏃 Marathon' :
             gameState.morningCondition === 'recovery_day' ? '🩹 Recovery' : ''}
          </Text>
        </View>
      )}

      {/* ═══ DRAMATIC MOMENTS ═══ */}
      {showGatesOpen && <GatesOpen onComplete={() => setShowGatesOpen(false)} />}
      {isCritical && <KingdomTrembles zone={zone as 'critical-low' | 'critical-high'} />}
      {showComboRally && <KingdomRallies color={showComboRally} />}
      {showStorm && <StormApproaches name={showStorm.name} icon={showStorm.icon} onComplete={() => setShowStorm(null)} />}
      {showDefeatCrack && <KingdomFalls />}
      {showNewPower && <NewPowerGlow />}

      {/* Screen flash effect */}
      <ScreenFlash type={flashType} trigger={flashTrigger} />
      
      {/* Combo burst effect */}
       <ComboBurst comboCount={comboBurstTrigger} color={comboColor} />

       {/* Tier1 Tutorial Modal */}
       <BattleTutorialModal
         visible={showTutorial}
         food={tutorialFood}
         onDismiss={() => {
           if (tutorialTimeout.current !== null) {
             clearTimeout(tutorialTimeout.current);
             tutorialTimeout.current = null;
           }
           setShowTutorial(false);
           currentTutorialFoodId.current = null;
         }}
         controlMode={controlMode}
         key={`${showTutorial}-${tutorialFood?.id}`}
       />

       {/* Contextual food tooltip */}
       {shownContextualTip && gameState.foods.some(f => f.faction === 'contextual') && (
         <View style={{ position: 'absolute', top: 120, left: 20, right: 20, zIndex: 60, alignItems: 'center' }}>
           <View
             style={{
               backgroundColor: 'rgba(139, 92, 246, 0.95)',
               paddingHorizontal: 16, paddingVertical: 10,
               borderRadius: 12, borderWidth: 1, borderColor: '#a78bfa',
             }}
             accessible accessibilityRole="alert"
             accessibilityLabel="Contextual food: this food's effect depends on the time of day"
           >
             <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>
               ☕ This food&apos;s effect depends on the time of day!
             </Text>
           </View>
         </View>
       )}

       {/* Life Mode 4-direction hint */}
       {shownLifeModeTip && (
         <View style={{ position: 'absolute', top: 120, left: 20, right: 20, zIndex: 60, alignItems: 'center' }}>
           <View
             style={{
               backgroundColor: 'rgba(59, 130, 246, 0.95)',
               paddingHorizontal: 16, paddingVertical: 10,
               borderRadius: 12, borderWidth: 1, borderColor: '#3b82f6',
             }}
             accessible accessibilityRole="alert"
           >
             <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>
               👆 Consume · 👇 Reject · 👈 Save · 👉 Share
             </Text>
           </View>
         </View>
       )}

       {/* Health Profile Glucose Display - only show if tier config enables it and not tier1 */}
      {tierConfig?.showGlucose && healthProfile && !tierConfig?.tutorialMode && (
        <View style={{ position: 'absolute', top: 40, right: 20, zIndex: 100 }}>
          <TouchableOpacity
            onPress={() => setShowInsulinControl(true)}
            disabled={healthProfile.insulinType === 'none'}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              borderWidth: 2,
              borderColor: getGlucoseZone(healthProfile.currentGlucose).color,
              borderRadius: 12,
              padding: 12,
              minWidth: 120,
            }}
          >
            <Text style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4 }}>
              GLUCOSE
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ 
                fontSize: 20, 
                fontWeight: 'bold',
                color: getGlucoseZone(healthProfile.currentGlucose).color,
              }}>
                {Math.round(healthProfile.currentGlucose)}
              </Text>
              <Text style={{ fontSize: 10, color: '#9ca3af', marginLeft: 4 }}>
                mg/dL
              </Text>
            </View>
            <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 2 }}>
              {getGlucoseZone(healthProfile.currentGlucose).label}
            </Text>
            {healthProfile.insulinType !== 'none' && (
              <Text style={{ fontSize: 8, color: '#7c3aed', marginTop: 4, fontWeight: '600' }}>
                💉 Tap for insulin
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Castle gate line — visible "end zone" where missed food counts */}
      <View style={{
        position: 'absolute', bottom: 200, left: 0, right: 0, zIndex: 5,
        alignItems: 'center',
      }}>
        <View style={{
          width: '90%', height: 2, backgroundColor: 'rgba(251,191,36,0.3)',
          borderRadius: 1,
        }} />
        <Text style={{ color: 'rgba(251,191,36,0.3)', fontSize: 9, marginTop: 2 }}>🏰 CASTLE GATE 🏰</Text>
      </View>

      {/* Low stability hint — sugar isn't always bad */}
      {gameState.stability < 30 && gameState.gameMode === 'classic' && (
        <View style={{ position: 'absolute', bottom: 220, left: 20, right: 20, zIndex: 10, alignItems: 'center' }}>
          <View style={{ backgroundColor: 'rgba(6,182,212,0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
            <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold', textAlign: 'center' }}>
              ❄️ Harmony LOW — swipe UP on sugar to raise it!
            </Text>
          </View>
        </View>
      )}

      {/* Food cards */}
      {gameState.foods.map((food) => (
        <FoodCard
          key={food.id}
          food={food}
          onSwipe={onSwipe}
          controlMode={controlMode}
          gameMode={gameState.gameMode}
          showOptimalHint={gameState.gameMode === 'life'}
        />
      ))}

      {/* HUD overlay - conditional based on tier config */}
      {tierConfig?.showMetrics && gameState.gameMode === 'life' ? (
        <>
          {/* Side Panels - only show if body_metrics unlocked */}
          {hasMechanic('body_metrics') && <LeftSidePanel metrics={gameState.metrics} />}
          {hasMechanic('body_metrics') && <RightSidePanel metrics={gameState.metrics} />}
          
          {/* Top Header - Centered between side panels */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: SIDE_PANEL_WIDTH,
              right: SIDE_PANEL_WIDTH,
              zIndex: 50,
            }}
          >
            <LifeModeHeader
              score={gameState.score}
              timer={gameState.timer}
              timePhase={gameState.timePhase}
              comboCount={gameState.comboCount}
              comboTitle={COMBO_TIERS.find(t => t.count <= gameState.comboCount)?.title}
              morningCondition={gameState.morningCondition}
              activePlotTwist={gameState.activePlotTwist}
              plotTwistTimer={gameState.plotTwistTimer}
              isPaused={gameState.isPaused}
              onPause={onPause}
              savedFoods={gameState.savedFoods}
              onConsumeSaved={onConsumeSaved}
            />
            {/* Announcement overlay */}
            {gameState.announcement && (
              <View
                className="mx-2 mt-2 px-3 py-2 rounded-xl items-center"
                style={{
                  backgroundColor: gameState.announcementType === 'plot_twist'
                    ? 'rgba(168, 85, 247, 0.9)'
                    : gameState.announcementType === 'reflection'
                      ? 'rgba(34, 211, 238, 0.9)'
                      : gameState.announcementType === 'error'
                        ? 'rgba(239, 68, 68, 0.9)'
                        : gameState.announcementType === 'success'
                          ? 'rgba(34, 197, 94, 0.9)'
                          : 'rgba(0, 0, 0, 0.9)',
                  borderWidth: 2,
                  borderColor: gameState.announcementType === 'plot_twist'
                    ? '#a855f7'
                    : gameState.announcementType === 'reflection'
                      ? '#06b6d4'
                      : gameState.announcementType === 'error'
                        ? '#ef4444'
                        : gameState.announcementType === 'success'
                          ? '#22c55e'
                          : '#f59e0b',
                }}
              >
                <Text className="text-white text-base font-bold text-center">
                  {gameState.announcement}
                </Text>
                {gameState.announcementScience && (
                  <Text className="text-gray-100 text-xs text-center italic leading-4 mt-1">
                    {gameState.announcementScience}
                  </Text>
                )}
              </View>
            )}
          </View>
          
          {/* Saved Foods Panel - Life Mode only - REMOVED, now in header */}
          
          {/* Social Meter Display - Life Mode only */}
          {gameState.socialStats && hasMechanic('share_direction') && (
            <SocialMeterDisplay socialStats={gameState.socialStats} />
          )}
          
          {/* Bottom Footer - Centered between side panels */}
          <View
            style={{
              position: 'absolute',
              bottom: insets.bottom,
              left: SIDE_PANEL_WIDTH,
              right: SIDE_PANEL_WIDTH,
              zIndex: 100,
            }}
          >
            <LifeModeFooter
              exerciseCharges={gameState.exerciseCharges}
              rationCharges={gameState.rationCharges}
              onExercise={onExercise}
              onRations={onRations}
              morningCondition={gameState.morningCondition}
              announcement={gameState.announcement}
              announcementType={gameState.announcementType}
            />
          </View>
          
          {/* Pause Overlay */}
          <LifeModePauseOverlay
            isPaused={gameState.isPaused}
            onResume={onResume}
            onRestart={onRestart}
            onExit={onExit}
            controlMode={controlMode}
            onToggleControlMode={onToggleControlMode}
          />
        </>
      ) : (
        <BattleHUD
          score={gameState.score}
          stability={gameState.stability}
          timer={gameState.timer}
          comboCount={gameState.comboCount}
          exerciseCharges={gameState.exerciseCharges}
          rationCharges={gameState.rationCharges}
          announcement={gameState.announcement}
          announcementType={gameState.announcementType}
          onExercise={onExercise}
          onRations={onRations}
          isPaused={gameState.isPaused}
          onPause={onPause}
          onResume={onResume}
          onRestart={onRestart}
          showComboCounter={tierConfig?.showComboCounter ?? true}
          controlMode={controlMode}
          onToggleControlMode={onToggleControlMode}
          minimal={!hasMechanic('power_ups')}
        />
      )}
      
      {/* Insulin Control Modal */}
      {healthProfile && onAdministerInsulin && (
        <InsulinControl
          healthProfile={healthProfile}
          onAdministerInsulin={onAdministerInsulin}
          isVisible={showInsulinControl}
          onClose={() => setShowInsulinControl(false)}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  comboBurstContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 500,
  },
  burstRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
  },
  burstParticle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  screenFlash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 400,
  },
});
