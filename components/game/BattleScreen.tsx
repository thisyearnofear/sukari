import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FoodCard } from './FoodCard';
import { BattleHUD } from './BattleHUD';
import { BattleTutorialModal } from './BattleTutorialModal';
import { LifeModeHeader, LifeModeFooter, LeftSidePanel, RightSidePanel, SIDE_PANEL_WIDTH, LifeModePauseOverlay, SocialMeterDisplay } from './LifeModeHUD';
import { InsulinControl } from './InsulinControl';
import { GameState, StabilityZone, ControlMode, SwipeDirection, SwipeAction } from '@/types/game';
import type { GameMechanic } from '@/hooks/usePlayerProgress';
import { HealthProfile } from '@/types/health';
import { COMBO_TIERS } from '@/constants/gameConfig';
import { getGlucoseZone } from '@/constants/healthScenarios';
import { TierConfig } from '@/constants/gameTiers';
import { getStabilityZone } from '@/utils/gameLogic';
import { MetabolicField, type MetabolicBand } from '@/components/atmosphere/MetabolicField';
import { COLORS, FONTS } from '@/constants/designSystem';

const P = COLORS.PROGRAMME;

function zoneToBand(zone: StabilityZone): MetabolicBand {
  switch (zone) {
    case 'critical-low':
    case 'warning-low':
      return 'low';
    case 'critical-high':
    case 'warning-high':
      return 'high';
    case 'balanced':
      return 'in_range';
    default:
      return 'unknown';
  }
}

function zoneIntensity(zone: StabilityZone): number {
  if (zone === 'critical-low' || zone === 'critical-high') return 0.9;
  if (zone === 'warning-low' || zone === 'warning-high') return 0.7;
  return 0.45;
}

// Screen-wide combo burst effect
export const ComboBurst: React.FC<{
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
export const ScreenFlash: React.FC<{
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
  hasMechanic?: (m: GameMechanic) => boolean;
  /** Real-world mission being rehearsed */
  missionAction?: string | null;
  /** Bounded focus derived from the approved mission template. */
  missionPracticeFocus?: string | null;
  missionTone?: string | null;
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
  missionAction = null,
  missionPracticeFocus = null,
  missionTone = null,
}) => {
  const hasMechanic = hasMechanicProp || (() => true); // Default: show everything

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
   // Legacy life-mode chrome remains type-compatible while all shipped tiers use the compact HUD.
   const insets = useSafeAreaInsets();
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
  
  const fieldBand = zoneToBand(zone);
  const fieldIntensity = zoneIntensity(zone);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: P.ink,
        alignSelf: 'center',
        width: '100%',
        maxWidth: Platform.OS === 'web' ? 960 : 500,
      }}
    >
      <MetabolicField band={fieldBand} intensity={fieldIntensity} />

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
         <View style={{ position: 'absolute', top: 180, left: 20, right: 20, zIndex: 60, alignItems: 'center' }}>
           <View
             style={{
               backgroundColor: 'rgba(11,18,16,0.92)',
               paddingHorizontal: 16, paddingVertical: 10,
               borderRadius: 2, borderWidth: 1, borderColor: P.warn,
             }}
             accessible accessibilityRole="alert"
             accessibilityLabel="Contextual food: this food's effect depends on the time of day"
           >
             <Text style={{ color: P.text, fontSize: 12, fontFamily: FONTS.bodyMedium, textAlign: 'center' }}>
               Context matters — this food’s effect depends on the time of day
             </Text>
           </View>
         </View>
       )}

       {/* Life Mode 4-direction hint */}
       {shownLifeModeTip && (
         <View style={{ position: 'absolute', top: 180, left: 20, right: 20, zIndex: 60, alignItems: 'center' }}>
           <View
             style={{
               backgroundColor: 'rgba(11,18,16,0.92)',
               paddingHorizontal: 16, paddingVertical: 10,
               borderRadius: 2, borderWidth: 1, borderColor: P.line,
             }}
             accessible accessibilityRole="alert"
           >
             <Text style={{ color: P.textSoft, fontSize: 12, fontFamily: FONTS.bodyMedium, textAlign: 'center' }}>
               Up steady · Down refuse · Left save · Right share
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

      {/* Decision threshold — end zone for foods */}
      <View style={{
        position: 'absolute', bottom: 200, left: 0, right: 0, zIndex: 5,
        alignItems: 'center',
      }}>
        <View style={{
          width: '88%', height: 1,
          backgroundColor: P.line,
          borderRadius: 1,
        }} />
        <Text style={{ color: P.textMuted, fontSize: 10, marginTop: 4, fontFamily: FONTS.body, letterSpacing: 1.2, textTransform: 'uppercase' }}>
          Decision line
        </Text>
      </View>

      {/* Low stability hint — sugar isn't always bad */}
      {gameState.stability < 30 && gameState.gameMode === 'classic' && (
        <View style={{ position: 'absolute', bottom: 220, left: 20, right: 20, zIndex: 10, alignItems: 'center' }}>
          <View style={{ backgroundColor: 'rgba(11,18,16,0.9)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 2, borderWidth: 1, borderColor: P.cool }}>
            <Text style={{ color: P.text, fontSize: 11, fontFamily: FONTS.bodyMedium, textAlign: 'center' }}>
              Field low — swipe up on steadying foods
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
          showOptimalHint={false}
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
          missionAction={missionAction}
          missionPracticeFocus={missionPracticeFocus}
          missionTone={missionTone}
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
    </View>
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
