import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BattleScreen } from '@/components/game/BattleScreen';
import { useGameSession } from '@/context/GameSessionContext';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
import { ChallengeDefinition, ChallengeModifier, ChallengeScoreEntry, ChallengeTier } from '@/types/challenge';
import { SwipeDirection, SwipeAction } from '@/types/game';
import { getAnonymousId, track } from '@/utils/analytics';
import { submitChallengeScore } from '@/utils/challengeLeaderboard';

const SCORE_KEY_PREFIX = 'glucoseWars.challenge.scores.'; // + challengeId

function parseMods(mods?: string): ChallengeModifier[] {
  if (!mods) return [];
  return mods
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean) as ChallengeModifier[];
}

function stableChallengeId(tier: string, seed: string, mods: ChallengeModifier[]) {
  const key = `${tier}|${seed}|${mods.slice().sort().join(',')}`;
  // simple hash → base36
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return `c_${hash.toString(36)}`;
}

export default function ChallengePlay() {
  const params = useLocalSearchParams<{ tier?: string; seed?: string; mods?: string; name?: string; id?: string; featured?: string }>();

  const {
    battleGame,
    controlMode,
    setControlMode,
    tierConfig,
    healthProfile,
    startGameForTier,
    handleGameResult,
    selectedTier,
    setSelectedTier,
    setChallenge,
  } = useGameSession();

  const {
    progress,
    incrementGamesPlayed,
    updateBestScore,
    unlockNextTier,
  } = usePlayerProgressContext();

  const { gameState, handleSwipe: baseHandleSwipe, useExercise, useRations, pauseGame, resumeGame, consumeSavedFood } = battleGame;

  const tier = (params.tier as ChallengeTier) || 'tier1';
  const seed = params.seed || 'default';
  const mods = useMemo(() => parseMods(params.mods), [params.mods]);
  const challengeId = params.id || stableChallengeId(tier, seed, mods);

  const challenge: ChallengeDefinition = useMemo(
    () => ({
      id: challengeId,
      name: params.name || 'Challenge',
      tier,
      seed,
      modifiers: mods,
      createdAt: Date.now(),
      version: 1,
    }),
    [challengeId, params.name, tier, seed, mods],
  );

  const hasTransitionedToResults = useRef(false);
  const hasTrackedStart = useRef(false);
  const hasStarted = useRef(false);

  useEffect(() => {
    track('challenge_play_opened', {
      source: params.featured ? `featured_${params.featured}` : 'link_or_local',
      tier,
      modifiers_count: mods.length,
      privacy_mode: progress.privacyMode,
    });

    setSelectedTier(tier as any);
    setControlMode('swipe');
    setChallenge(challenge);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start only after tier/challenge state has applied
  useEffect(() => {
    if (hasStarted.current) return;
    if (selectedTier !== (tier as any)) return;
    if (!tierConfig) return;
    hasStarted.current = true;
    startGameForTier();
  }, [selectedTier, tier, tierConfig, startGameForTier]);

  useEffect(() => {
    if (gameState.isGameActive && !hasTrackedStart.current) {
      hasTrackedStart.current = true;
      track('challenge_started', { challenge_id: challengeId, tier, modifiers_count: mods.length, privacy_mode: progress.privacyMode });
    }
  }, [gameState.isGameActive, challengeId, tier, mods.length, progress.privacyMode]);

  const persistScore = useCallback(async () => {
    try {
      const playerId = await getAnonymousId();
      const entry: ChallengeScoreEntry = {
        challengeId,
        playerId,
        score: gameState.score,
        result: (gameState.gameResult || 'defeat') as any,
        createdAt: Date.now(),
      };
      const key = `${SCORE_KEY_PREFIX}${challengeId}`;
      const raw = await AsyncStorage.getItem(key);
      const list: ChallengeScoreEntry[] = raw ? JSON.parse(raw) : [];
      const next = [entry, ...list]
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);
      await AsyncStorage.setItem(key, JSON.stringify(next));

      // Also submit to global leaderboard backend if configured (prototype: no signature)
      await submitChallengeScore({
        challengeId,
        playerId,
        score: entry.score,
        result: entry.result,
        meta: {
          tier,
          seed,
          mods,
        },
      });
    } catch {
      // ignore leaderboard failures (MVP)
    }
  }, [challengeId, gameState.score, gameState.gameResult, tier, seed, mods]);

  useEffect(() => {
    if (!gameState.isGameActive && gameState.gameResult && !hasTransitionedToResults.current) {
      hasTransitionedToResults.current = true;

      track('challenge_completed', {
        challenge_id: challengeId,
        tier,
        score: gameState.score,
        result: gameState.gameResult,
        privacy_mode: progress.privacyMode,
      });

      persistScore();

      // Keep core progression stats consistent
      handleGameResult({
        incrementGamesPlayed,
        updateBestScore,
        unlockNextTier,
        currentTier: selectedTier,
        requiresWin: tierConfig.requiresWin,
      });

      router.replace({
        pathname: '/challenge/results' as any,
        params: { tier, seed, mods: mods.join(','), name: challenge.name, id: challengeId },
      });
    }
  }, [
    gameState.isGameActive,
    gameState.gameResult,
    gameState.score,
    challengeId,
    tier,
    seed,
    mods,
    progress.privacyMode,
    persistScore,
    handleGameResult,
    incrementGamesPlayed,
    updateBestScore,
    unlockNextTier,
    selectedTier,
    tierConfig.requiresWin,
    challenge.name,
  ]);

  useEffect(() => {
    if (gameState.isGameActive) {
      hasTransitionedToResults.current = false;
      hasTrackedStart.current = false;
    }
  }, [gameState.isGameActive]);

  const shareUrl = useMemo(() => {
    return Linking.createURL('/challenge/play', {
      queryParams: {
        tier,
        seed,
        mods: mods.join(','),
        name: challenge.name,
        id: challengeId,
      },
    });
  }, [tier, seed, mods, challenge.name, challengeId]);

  const copyShareLink = useCallback(async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch {
      // ignore
    }
  }, [shareUrl]);

  const handleSwipe = useCallback(
    (foodId: string, direction: SwipeDirection, action: SwipeAction) => {
      baseHandleSwipe(foodId, direction, action);
    },
    [baseHandleSwipe],
  );

  // Minimal overlay: show the challenge name + share link
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a12' }}>
      <View className="absolute top-0 left-0 right-0 z-50 px-4 pt-4">
        <View className="bg-black/60 border border-purple-700 rounded-2xl p-3">
          <Text className="text-white font-bold" numberOfLines={1}>{challenge.name}</Text>
          <Text className="text-gray-400 text-[10px]" numberOfLines={1}>{shareUrl}</Text>
          <View className="flex-row justify-between mt-2">
            <TouchableOpacity onPress={() => router.replace('/challenge' as any)} className="px-3 py-1 rounded-lg bg-gray-800/60">
              <Text className="text-gray-200 text-xs font-bold">EXIT</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                await copyShareLink();
                track('challenge_share_clicked', { surface: 'play', medium: 'copy_link' });
              }}
              className="px-3 py-1 rounded-lg bg-purple-700/60"
            >
              <Text className="text-white text-xs font-bold">SHARE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Challenges are ungated — all mechanics available regardless of progression */}
      <BattleScreen
        gameState={gameState}
        onSwipe={handleSwipe}
        onExercise={useExercise}
        onRations={useRations}
        controlMode={controlMode}
        onPause={pauseGame}
        onResume={resumeGame}
        onRestart={() => startGameForTier()}
        onConsumeSaved={consumeSavedFood}
        onExit={() => router.replace('/challenge' as any)}
        healthProfile={tierConfig.healthProfile ? healthProfile.healthProfile : undefined}
        onAdministerInsulin={healthProfile.administerInsulin}
        tierConfig={tierConfig}
        onToggleControlMode={() => setControlMode(controlMode === 'swipe' ? 'tap' : 'swipe')}
        hasMechanic={() => true}
      />
    </View>
  );
}
