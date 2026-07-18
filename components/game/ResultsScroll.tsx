 
// useScrollIntegration is resolved at runtime via Metro's platform-specific file resolution
import { KINGDOM_LORE } from '@/constants/gameConfig';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Share , useWindowDimensions } from 'react-native';
import { BodyMetrics, GameMode, MorningCondition, GameState, UserMode } from '@/types/game';
import { HealthProfile } from '@/types/health';
import { useScrollIntegration } from '@/hooks/useScrollIntegration';
import { ScrollIntegration } from './ScrollIntegration';
import { GameTier } from '@/constants/gameTiers';
import { getUserModeConfig } from '@/constants/userModes';
import { WeeklyLeaderboard } from './WeeklyLeaderboard';
import { getWeeklySeed } from '@/utils/random';
import { useCGMConnection } from '@/hooks/useCGMConnection';
import { useBeam } from '@/context/BeamContext';
import { ShareCard } from './ShareCard';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
import { buildTransfer } from '@/domain/programme';
import { buildSupportInvite, supportShareMessage } from '@/domain/invite';
import { track } from '@/utils/analytics';
import { MetabolicField } from '@/components/atmosphere/MetabolicField';
import { PressableScale } from '@/components/ui/PressableScale';
import { COLORS, FONTS } from '@/constants/designSystem';

const P = COLORS.PROGRAMME;

// Kingdom Lore and Wisdom
// MOVED TO constants/gameConfig.ts

// Funny share messages based on performance
const getShareMessage = (score: number, accuracy: number, grade: string, challengeId?: string) => {
  const messages = {
    S: `🏆 ${score} pts in Glucose Wars! ${accuracy}% accuracy. My pancreas is PROUD!`,
    A: `⚔️ ${score} pts in Glucose Wars! ${accuracy}% accuracy. Glucose game STRONG 💪`,
    B: `🎮 ${score} pts in Glucose Wars! Vegetables ARE allies 🥦`,
    C: `🍩 ${score} pts in Glucose Wars! Donuts won some battles...`,
    D: `💀 ${score} pts in Glucose Wars. The sugar horde showed no mercy!`,
  };
  
  let baseMessage = messages[grade as keyof typeof messages] || messages.D;
  if (challengeId) {
    baseMessage += `\n\nI challenge YOU to beat my score in the Alchemist's Lab! Seed: #${challengeId} 🧪`;
  }
  
  return baseMessage;
};

// Get mode-specific message after results
function getModeSpecificMessage(userMode: UserMode | undefined, tier: GameTier | undefined): string {
  if (!userMode || !tier) return '';
  
  const modeConfig = getUserModeConfig(userMode);
  if (!modeConfig) return '';

  if (tier === 'tier2') {
    return modeConfig.narrative.tier2ResultsHero;
  }
  if (tier === 'tier3') {
    return modeConfig.narrative.tier3ResultsHero;
  }
  return '';
}


interface ResultsScrollProps {
  result: 'victory' | 'defeat';
  score: number;
  glucoseLevel: number;
  correctSwipes?: number;
  incorrectSwipes?: number;
  timeInBalanced?: number;
  comboMax?: number;
  onPlayAgain: () => void;
  onMainMenu: () => void;
  gameMode?: GameMode;
  finalMetrics?: BodyMetrics;
  morningCondition?: MorningCondition;
  gameState?: GameState;
  healthProfile?: HealthProfile;
  tier?: GameTier;
  dexcomOption?: boolean;
  userMode?: UserMode;
}

export const ResultsScroll: React.FC<ResultsScrollProps> = ({
  result,
  score,
  glucoseLevel,
  correctSwipes = 0,
  incorrectSwipes = 0,
  onPlayAgain,
  onMainMenu,
  gameMode = 'classic',
  finalMetrics,
  gameState,
  healthProfile,
  tier,
  userMode,
}) => {
  const isVictory = result === 'victory';
  const scrollAnim = useRef(new Animated.Value(-500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [showTipsCard, setShowTipsCard] = useState(false);
  const [showScrollPanel, setShowScrollPanel] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [randomLore] = useState(() => KINGDOM_LORE[Math.floor(Math.random() * KINGDOM_LORE.length)]);
  const { evaluateAchievements } = useScrollIntegration();
  const {
    getSlowMoAnalytics,
    progress,
    markMissionPracticed,
    completeActiveMission,
  } = usePlayerProgressContext();
  const beamContext = useBeam();
  const cgm = useCGMConnection();
  const playerAnalytics = getSlowMoAnalytics();
  const isFirstVictory = isVictory && progress.gamesPlayed <= 1;
  const transfer = buildTransfer(progress.activeMission, {
    result,
    correctSwipes,
    incorrectSwipes,
    score,
  });
  const [missionMarked, setMissionMarked] = useState(
    progress.activeMission?.status === 'completed',
  );

  // Evaluate achievements when game ends + mark mission practiced (transfer beat)
  useEffect(() => {
    if (gameState && isVictory) {
      const unlockedIds = evaluateAchievements(gameState);
      if (unlockedIds.length > 0) {
        setShowScrollPanel(true);
      }
    }
    if (cgm.connection.isConnected) {
      cgm.syncReadings(10);
    }
    if (transfer?.practiced && progress.activeMission?.status === 'assigned') {
      markMissionPracticed(transfer.mission);
      track('mission_transfer_shown', {
        template_id: transfer.mission.templateId,
        result,
        privacy_mode: progress.privacyMode,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Scroll unfurl animation
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(scrollAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 40,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 6,
        }),
      ]),
    ]).start();
  }, [fadeAnim, scaleAnim, scrollAnim]);

  const accuracy = correctSwipes + incorrectSwipes > 0 
    ? Math.round((correctSwipes / (correctSwipes + incorrectSwipes)) * 100) 
    : 0;

  const isWeeklyChallenge = tier === 'weekly';

  const getGrade = () => {
    if (score >= 500 && accuracy >= 90) return { grade: 'S', color: '#fbbf24', title: 'LEGENDARY!' };
    if (score >= 400 && accuracy >= 80) return { grade: 'A', color: '#22c55e', title: 'EXCELLENT!' };
    if (score >= 300 && accuracy >= 70) return { grade: 'B', color: '#3b82f6', title: 'GREAT!' };
    if (score >= 200 && accuracy >= 60) return { grade: 'C', color: '#a855f7', title: 'GOOD' };
    return { grade: 'D', color: '#ef4444', title: 'KEEP TRYING' };
  };

  const gradeInfo = getGrade();
  const weeklySeed = getWeeklySeed();

  const getAlchemistObservation = () => {
    if (!gameState) return null;
    
    // Alchemist's Lab specific advice
    if (isWeeklyChallenge) {
      return {
        icon: '🧪',
        title: 'ALCHEMIST\'S OBSERVATION',
        message: 'This seeded run tests your consistency. Everyone faces the same foods this week! To rank higher, focus on maintaining a Harmony streak (40-60%) for score multipliers.',
      };
    }

    // Personalized Kingdom Decree based on health analytics (EDUCATIVE & ENHANCEMENT FIRST)
    if (playerAnalytics && playerAnalytics.totalSessions > 0 && playerAnalytics.recommendations.length > 0) {
      const randomRecommendation = playerAnalytics.recommendations[Math.floor(Math.random() * playerAnalytics.recommendations.length)];
      return {
        icon: '📜',
        title: 'KINGDOM DECREE',
        message: `The Alchemist has analyzed your recent feats: "${randomRecommendation}" Use this wisdom to better defend your Harmony in the next battle!`,
      };
    }

    // Find most frequent food types in incorrect swipes
    // (In a real app, we'd track which foods were missed/wrongly swiped)
    // For now, let's provide a generic tip based on the game result
    if (result === 'defeat') {
      return {
        icon: '👨‍🔬',
        title: 'ALCHEMIST\'S WARNING',
        message: 'When Harmony drops, focus on the Green Aegis (🥦) and avoid the Sugar Horde (🍩). The Knight\'s March (Exercise Power-up) can also help calm the sugar tide.',
      };
    }
    
    return {
      icon: '🤴',
      title: 'ROYAL COMMENDATION',
      message: 'Your mastery of the 4-way swipe shows great tactical awareness. Remember: Saving healthy snacks for later (👈) is the mark of a true Guardian!',
    };
  };

  const observation = getAlchemistObservation();
  
  // Share functionality
  const handleShare = async () => {
    // Apply privacy settings to the share message
    let message = getShareMessage(score, accuracy, gradeInfo.grade, isWeeklyChallenge ? String(weeklySeed) : undefined);

    // Check if achievements should be shared based on privacy settings
    if (healthProfile?.privacySettings?.achievements === 'private') {
      // Modify the message to be more generic when achievements are private
      message = `Fought well in Glucose Wars! ${score} pts. ${accuracy}% accuracy.`;
    }

    const url = process.env.EXPO_PUBLIC_APP_URL || 'https://glucosewars.app';

    try {
      setShowShareCard(true);
      await Share.share({
        message: `${message}\n\n🎮 Play: ${url}`,
        title: 'Glucose Wars',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  // Tips card content
  const TipsCard = () => (
    <View style={{ 
      backgroundColor: 'rgba(0,0,0,0.9)',
      padding: 16,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: '#3b82f6',
    }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#60a5fa' }}>💡 DID YOU KNOW?</Text>
        <TouchableOpacity onPress={() => setShowTipsCard(false)} style={{ padding: 8, backgroundColor: 'rgba(107,114,128,0.3)', borderRadius: 8 }}>
          <Text style={{ color: '#d1d5db', fontSize: 14, fontWeight: 'bold' }}>✕ Close</Text>
        </TouchableOpacity>
      </View>

      {/* Glucose Fact */}
      <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', padding: 12, borderRadius: 10, marginBottom: 10 }}>
        <Text style={{ fontSize: 24, textAlign: 'center', marginBottom: 6 }}>{randomLore.emoji}</Text>
        <Text style={{ color: '#93c5fd', fontSize: 13, textAlign: 'center', fontWeight: 'bold' }}>{randomLore.fact}</Text>
        <Text style={{ color: '#60a5fa', fontSize: 11, textAlign: 'center', marginTop: 4 }}>💡 {randomLore.tip}</Text>
      </View>

      {/* Fun message */}
      <View style={{ backgroundColor: 'rgba(251, 191, 36, 0.15)', padding: 10, borderRadius: 10, marginBottom: 10 }}>
        <Text style={{ color: '#fde68a', fontSize: 11, textAlign: 'center' }}>
          {gradeInfo.grade === 'S' && '🏆 Your pancreas is sending a thank-you card!'}
          {gradeInfo.grade === 'A' && '⭐ Blood sugar more stable than WiFi!'}
          {gradeInfo.grade === 'B' && '💪 Glucose game getting stronger!'}
          {gradeInfo.grade === 'C' && '🍩 Those donuts put up a fight!'}
          {gradeInfo.grade === 'D' && '😅 Sugar horde won... revenge awaits!'}
        </Text>
      </View>

      {/* Awareness */}
      <Text style={{ color: '#9ca3af', fontSize: 10, textAlign: 'center', marginBottom: 12 }}>
        🎗️ 1 in 10 people have diabetes. Spread awareness!
      </Text>

      {/* Share button */}
      <TouchableOpacity
        onPress={handleShare}
        style={{
          backgroundColor: '#22c55e',
          paddingVertical: 12,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: '#4ade80',
        }}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 16, marginRight: 6 }}>📤</Text>
          <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>SHARE SCORE</Text>
        </View>
      </TouchableOpacity>
      
      {showShareCard && (
        <View style={{ alignItems: 'center', marginTop: 12, padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12 }}>
          <ShareCard
            score={score}
            grade={gradeInfo.grade}
            accuracy={accuracy}
            result={result}
            tier={tier}
            comboMax={gameState?.comboCount}
            missionLabel={progress.activeMission?.realmCopy}
            supportAction={progress.activeMission?.caregiverSupportAction}
          />
          <Text style={{ color: '#6b7280', fontSize: 9, marginTop: 6 }}>📸 Screenshot this card to share!</Text>
          <TouchableOpacity onPress={() => setShowShareCard(false)} style={{ marginTop: 4 }}>
            <Text style={{ color: '#6b7280', fontSize: 10 }}>Close</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={{ color: '#6b7280', fontSize: 10, textAlign: 'center', marginTop: 8 }}>
        Challenge friends to beat {score} pts! 🎮
      </Text>
    </View>
  );

  const { width: screenWidth } = useWindowDimensions();
  const cardMaxWidth = Math.min(screenWidth * 0.9, 380);

  return (
    <View style={{ flex: 1, backgroundColor: P.ink, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <MetabolicField band={isVictory ? 'in_range' : 'high'} intensity={isVictory ? 0.4 : 0.7} />

      {/* Scroll Integration Panel (Victory only) — demoted optional persistence */}
      {isVictory && (
        <View style={{ position: 'absolute', top: 40, left: 16, right: 16, maxWidth: cardMaxWidth, alignSelf: 'center', zIndex: 20 }}>
          <ScrollIntegration 
            visible={showScrollPanel}
            onDismiss={() => setShowScrollPanel(false)}
          />
        </View>
      )}

      <Animated.View 
        style={{
          transform: [
            { translateY: scrollAnim },
            { scale: scaleAnim },
          ],
          opacity: fadeAnim,
          width: cardMaxWidth,
          marginTop: showScrollPanel ? 200 : 0,
          alignSelf: 'center',
          zIndex: 10,
        }}
      >
        {showTipsCard ? (
          <TipsCard />
        ) : (
          /* Stats Card */
          <View style={{ 
            backgroundColor: 'rgba(11,18,16,0.88)',
            padding: 18,
            borderRadius: 2,
            borderWidth: 1,
            borderColor: P.line,
          }}>
            {/* Result header */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontFamily: FONTS.display, fontSize: 22, color: P.text, letterSpacing: -0.3 }}>
                Glucose Wars
              </Text>
              <Text style={{
                fontFamily: FONTS.display,
                fontSize: 26,
                color: isVictory ? P.accent : P.danger,
                marginTop: 6,
              }}>
                {isVictory ? 'Practice complete' : 'Field collapsed'}
              </Text>
              {isVictory && getModeSpecificMessage(userMode, tier) ? (
                <Text style={{
                  fontFamily: FONTS.body,
                  fontSize: 13,
                  color: P.textMuted,
                  marginTop: 6,
                  lineHeight: 18,
                }}>
                  {getModeSpecificMessage(userMode, tier)}
                </Text>
              ) : null}
            </View>

            {/* Transfer beat — hero of results */}
            {transfer ? (
              <View style={{
                backgroundColor: P.mist,
                padding: 16,
                borderRadius: 2,
                borderWidth: 1,
                borderColor: P.accent,
                marginBottom: 14,
              }}>
                <Text style={{
                  fontFamily: FONTS.bodyMedium,
                  color: P.accent,
                  fontSize: 11,
                  letterSpacing: 1.4,
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}>
                  {transfer.headline}
                </Text>
                <Text style={{
                  fontFamily: FONTS.display,
                  color: P.text,
                  fontSize: 18,
                  lineHeight: 24,
                  marginBottom: 10,
                }}>
                  {transfer.realWorldAction}
                </Text>
                <Text style={{
                  fontFamily: FONTS.body,
                  color: P.textSoft,
                  fontSize: 13,
                  lineHeight: 19,
                  marginBottom: 14,
                }}>
                  {transfer.body}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {!missionMarked && progress.activeMission?.status !== 'completed' ? (
                    <PressableScale
                      onPress={() => {
                        completeActiveMission();
                        setMissionMarked(true);
                        track('mission_marked_done', {
                          from: 'results',
                          template_id: transfer.mission.templateId,
                          privacy_mode: progress.privacyMode,
                        });
                      }}
                      style={{
                        backgroundColor: P.accent,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        borderRadius: 2,
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Mark real-world mission done"
                    >
                      <Text style={{ color: P.ink, fontFamily: FONTS.bodyBold, fontSize: 13 }}>I did it</Text>
                    </PressableScale>
                  ) : null}
                  <PressableScale
                    onPress={async () => {
                      const invite = buildSupportInvite(transfer.mission);
                      const msg = supportShareMessage(invite);
                      track('caregiver_invite_shared', {
                        template_id: invite.templateId,
                        privacy_mode: progress.privacyMode,
                      });
                      await Share.share({ message: msg });
                    }}
                    style={{
                      borderWidth: 1,
                      borderColor: P.line,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderRadius: 2,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Share support ask with caregiver"
                  >
                    <Text style={{ color: P.textSoft, fontFamily: FONTS.bodyMedium, fontSize: 13 }}>
                      Invite support
                    </Text>
                  </PressableScale>
                </View>
                {missionMarked || progress.activeMission?.status === 'completed' ? (
                  <Text style={{
                    fontFamily: FONTS.body,
                    color: P.accent,
                    fontSize: 12,
                    marginTop: 10,
                  }}>
                    Mission marked complete
                  </Text>
                ) : null}
              </View>
            ) : null}

            {/* Grade — secondary */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ 
                width: 40, height: 40, borderRadius: 2, alignItems: 'center', justifyContent: 'center',
                borderWidth: 1, borderColor: gradeInfo.color, backgroundColor: gradeInfo.color + '20', marginRight: 10,
              }}>
                <Text style={{ fontFamily: FONTS.display, fontSize: 20, color: gradeInfo.color }}>{gradeInfo.grade}</Text>
              </View>
              <Text style={{ fontFamily: FONTS.bodyMedium, fontSize: 13, color: P.textSoft }}>{gradeInfo.title}</Text>
            </View>

            {/* Alchemist Observation */}
            {observation && (
              <View style={{ 
                backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                padding: 10, 
                borderRadius: 12, 
                borderWidth: 1, 
                borderColor: 'rgba(59, 130, 246, 0.3)',
                marginBottom: 10
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ fontSize: 16, marginRight: 6 }}>{observation.icon}</Text>
                  <Text style={{ color: '#93c5fd', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>{observation.title}</Text>
                </View>
                <Text style={{ color: '#d1d5db', fontSize: 11, lineHeight: 15 }}>{observation.message}</Text>
              </View>
            )}

            {/* Weekly Leaderboard - NEW */}
            {isWeeklyChallenge && (
              <WeeklyLeaderboard 
                playerScore={score} 
                playerTitle={gradeInfo.title}
                seed={weeklySeed}
              />
            )}

            {/* Stats */}
            <View style={{ marginBottom: 10 }}>
              {/* Score */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(217, 119, 6, 0.5)', marginBottom: 5 }}>
                <Text style={{ color: '#fde68a', fontWeight: 'bold', fontSize: 13 }}>⚔️ Score</Text>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>{score.toLocaleString()}</Text>
              </View>

              {/* Life Mode metrics */}
              {gameMode === 'life' && finalMetrics && (
                <View style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(147, 51, 234, 0.5)', marginBottom: 5 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                      <Text style={{ fontSize: 14 }}>⚡</Text>
                      <Text style={{ color: '#facc15', fontWeight: 'bold', fontSize: 11 }}>{Math.round(finalMetrics.energy)}%</Text>
                    </View>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                      <Text style={{ fontSize: 14 }}>💧</Text>
                      <Text style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: 11 }}>{Math.round(finalMetrics.hydration)}%</Text>
                    </View>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                      <Text style={{ fontSize: 14 }}>🥗</Text>
                      <Text style={{ color: '#4ade80', fontWeight: 'bold', fontSize: 11 }}>{Math.round(finalMetrics.nutrition)}%</Text>
                    </View>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                      <Text style={{ fontSize: 14 }}>💓</Text>
                      <Text style={{ color: '#f472b6', fontWeight: 'bold', fontSize: 11 }}>{Math.round(finalMetrics.stability)}%</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Classic mode stability */}
              {gameMode === 'classic' && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(217, 119, 6, 0.5)', marginBottom: 5 }}>
                  <Text style={{ color: '#fde68a', fontWeight: 'bold', fontSize: 13 }}>⚖️ Stability</Text>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: glucoseLevel >= 40 && glucoseLevel <= 60 ? '#10b981' : '#ef4444' }}>
                    {Math.round(glucoseLevel)}%
                  </Text>
                </View>
              )}

              {/* Health Profile Summary - Respects Privacy Settings */}
              {healthProfile && (
                <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.5)', marginBottom: 5 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ color: '#93c5fd', fontWeight: 'bold', fontSize: 11 }}>💉 HEALTH PROFILE</Text>
                    {healthProfile.privacySettings?.glucoseLevels !== 'private' ? (
                      <Text style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: 12 }}>{healthProfile.currentGlucose} mg/dL</Text>
                    ) : (
                      <Text style={{ color: '#6b7280', fontWeight: 'bold', fontSize: 12 }}>🔒 Private</Text>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 4 }}>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ color: '#9ca3af', fontSize: 10, marginBottom: 2 }}>Diagnosis</Text>
                      {healthProfile.privacySettings?.healthProfile !== 'private' ? (
                        <Text style={{ color: '#d1d5db', fontWeight: '600', fontSize: 10, textAlign: 'center', textTransform: 'capitalize' }}>
                          {healthProfile.diabetesType.replace('_', ' ')}
                        </Text>
                      ) : (
                        <Text style={{ color: '#6b7280', fontWeight: '600', fontSize: 10, textAlign: 'center' }}>🔒</Text>
                      )}
                    </View>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ color: '#9ca3af', fontSize: 10, marginBottom: 2 }}>Insulin</Text>
                      {healthProfile.privacySettings?.insulinDoses !== 'private' ? (
                        <Text style={{ color: '#d1d5db', fontWeight: '600', fontSize: 10, textAlign: 'center', textTransform: 'capitalize' }}>
                          {healthProfile.insulinType === 'none' ? 'None' : healthProfile.insulinType}
                        </Text>
                      ) : (
                        <Text style={{ color: '#6b7280', fontWeight: '600', fontSize: 10, textAlign: 'center' }}>🔒</Text>
                      )}
                    </View>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ color: '#9ca3af', fontSize: 10, marginBottom: 2 }}>Sleep</Text>
                      {healthProfile.privacySettings?.healthProfile !== 'private' ? (
                        <Text style={{ color: '#d1d5db', fontWeight: '600', fontSize: 10, textAlign: 'center' }}>
                          {Math.round(healthProfile.sleepHours)}h
                        </Text>
                      ) : (
                        <Text style={{ color: '#6b7280', fontWeight: '600', fontSize: 10, textAlign: 'center' }}>🔒</Text>
                      )}
                    </View>
                  </View>
                </View>
              )}

              {/* Accuracy & Swipes row */}
              <View style={{ flexDirection: 'row', gap: 5 }}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(217, 119, 6, 0.5)' }}>
                  <Text style={{ color: '#fde68a', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>🎯 Accuracy</Text>
                  <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold', textAlign: 'center' }}>{accuracy}%</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(217, 119, 6, 0.5)' }}>
                  <Text style={{ color: '#fde68a', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>✓ / ✗</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                    <Text style={{ color: '#4ade80', fontWeight: 'bold', fontSize: 14 }}>{correctSwipes}</Text>
                    <Text style={{ color: '#9ca3af', marginHorizontal: 2, fontSize: 14 }}>/</Text>
                    <Text style={{ color: '#f87171', fontWeight: 'bold', fontSize: 14 }}>{incorrectSwipes}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Tier-specific content */}
            {tier && tier === 'tier1' && gameState && (
              <View style={{ marginVertical: 16, padding: 12, backgroundColor: 'rgba(79, 70, 229, 0.2)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(79, 70, 229, 0.4)' }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#fff', marginBottom: 8, textAlign: 'center' }}>
                  🎯 Warm-Up Complete!
                </Text>
                <Text style={{ fontSize: 12, color: '#cbd5e1', textAlign: 'center', marginBottom: 8 }}>
                  Score: {gameState.score} • Accuracy: {Math.round((gameState.correctSwipes / (gameState.correctSwipes + gameState.incorrectSwipes)) * 100 || 0)}%
                </Text>
                <Text style={{ fontSize: 12, color: '#cbd5e1', textAlign: 'center', marginBottom: 8 }}>
                  {healthProfile ?
                    (healthProfile.privacySettings?.glucoseLevels !== 'private' ?
                      `Glucose: ${Math.round(healthProfile.currentGlucose)} mg/dL` :
                      'Glucose: 🔒 Private') :
                    'No glucose data'
                  }
                </Text>
                <Text style={{ fontSize: 12, color: '#cbd5e1', textAlign: 'center' }}>
                  💡 Tip: In Challenge 1, you&apos;ll manage real glucose levels!
                </Text>
              </View>
            )}

            {tier && tier === 'tier2' && (
              <View style={{ marginVertical: 16, padding: 12, backgroundColor: 'rgba(124, 58, 237, 0.2)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(124, 58, 237, 0.4)' }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#fff', marginBottom: 8, textAlign: 'center' }}>
                  💡 Your Glucose Reality Check
                </Text>
                {cgm.latestReading ? (
                  <>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 }}>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: '#a78bfa', fontSize: 10, fontWeight: 'bold' }}>GAME HARMONY</Text>
                        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{Math.round(healthProfile?.currentGlucose || 120)}</Text>
                        <Text style={{ color: '#9ca3af', fontSize: 10 }}>mg/dL (simulated)</Text>
                      </View>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: '#22c55e', fontSize: 10, fontWeight: 'bold' }}>YOUR REAL CGM</Text>
                        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{cgm.latestReading.value} {cgm.latestReading.trendArrow}</Text>
                        <Text style={{ color: '#9ca3af', fontSize: 10 }}>mg/dL (Dexcom)</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 10, color: '#6b7280', textAlign: 'center', fontStyle: 'italic' }}>
                      ⚕️ For educational comparison only — not medical advice
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={{ fontSize: 12, color: '#cbd5e1', textAlign: 'center', marginBottom: 8 }}>
                      In this game, you managed {Math.round(healthProfile?.currentGlucose || 120)} mg/dL. In real life, your glucose changes based on:
                    </Text>
                    <Text style={{ fontSize: 11, color: '#cbd5e1', textAlign: 'center', marginBottom: 8 }}>
                      🍽️ When you eat • ⏰ Time of day • 🏃 Exercise • 😴 Sleep • 😰 Stress
                    </Text>
                    <Text style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', fontStyle: 'italic' }}>
                      Connect your Dexcom CGM to see your real glucose alongside the game.
                    </Text>
                    <TouchableOpacity
                      onPress={() => cgm.connect()}
                      style={{ backgroundColor: 'rgba(59,130,246,0.3)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#3b82f6', marginTop: 8, alignSelf: 'center' }}
                      accessibilityLabel="Connect Dexcom CGM" accessibilityRole="button"
                    >
                      <Text style={{ color: '#93c5fd', fontSize: 11, fontWeight: 'bold' }}>📡 Connect Dexcom</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {tier && tier === 'tier3' && (
              <View style={{ marginVertical: 16, padding: 12, backgroundColor: 'rgba(16, 185, 129, 0.2)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#fff', marginBottom: 8, textAlign: 'center' }}>
                  🏆 Advanced Play Mastered!
                </Text>
                <Text style={{ fontSize: 12, color: '#cbd5e1', textAlign: 'center', marginBottom: 8 }}>
                  You&apos;ve learned advanced glucose management. Keep practicing these skills:
                </Text>
                <Text style={{ fontSize: 11, color: '#cbd5e1', textAlign: 'center' }}>
                  ✓ Timing matters (meals, exercise, sleep)
                  ✓ Balance, not restriction
                  ✓ Listen to your body&apos;s signals
                </Text>
              </View>
            )}

            {/* #10: Replay highlight — best moment from the game */}
            {gameState && (
              <View style={{ backgroundColor: 'rgba(251,191,36,0.1)', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)', marginBottom: 10 }}>
                <Text style={{ color: '#fbbf24', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>
                  ⚡ {gameState.comboCount >= 5 ? `Best combo: ${gameState.comboCount}x streak!` :
                      gameState.timeInBalanced > (gameState.timeInWarning + gameState.timeInCritical) ? `Stayed balanced ${gameState.timeInBalanced}s — impressive!` :
                      `Survived ${gameState.plotTwistsTriggered || 0} plot twists`}
                </Text>
              </View>
            )}

            {/* Optional identity — demoted */}
            {isFirstVictory && !beamContext?.playerAccount && (
              <TouchableOpacity
                onPress={() => beamContext?.login?.()}
                style={{
                  backgroundColor: P.mist,
                  padding: 12,
                  borderRadius: 2,
                  borderWidth: 1,
                  borderColor: P.line,
                  marginBottom: 10,
                }}
                accessibilityLabel="Optional: save progress with social login"
                accessibilityRole="button"
              >
                <Text style={{ color: P.textMuted, fontSize: 11, fontFamily: FONTS.bodyMedium, textAlign: 'center' }}>
                  Optional: sync progress with social login
                </Text>
              </TouchableOpacity>
            )}

            {/* Buttons */}
            <View>
              <TouchableOpacity
                onPress={onPlayAgain}
                style={{
                  backgroundColor: P.accent,
                  paddingVertical: 14,
                  borderRadius: 2,
                  marginBottom: 8,
                }}
                activeOpacity={0.85}
              >
                <Text style={{ color: P.ink, fontSize: 15, fontFamily: FONTS.bodyBold, textAlign: 'center' }}>
                  {!isVictory ? 'Practice again' : tier === 'tier3' ? 'Practice again' : 'Continue'}
                </Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  onPress={onMainMenu}
                  style={{
                    flex: 1,
                    backgroundColor: P.mist,
                    paddingVertical: 12,
                    borderRadius: 2,
                    borderWidth: 1,
                    borderColor: P.line,
                  }}
                  activeOpacity={0.85}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: P.textSoft, fontSize: 13, fontFamily: FONTS.bodyMedium }}>Realm Home</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowTipsCard(true)}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(59, 130, 246, 0.3)',
                    paddingVertical: 10,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: '#3b82f6',
                  }}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 14, marginRight: 4 }}>💡</Text>
                    <Text style={{ color: '#93c5fd', fontSize: 13, fontWeight: 'bold' }}>TIPS</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
};
