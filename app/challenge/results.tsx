import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ResultsScroll } from '@/components/game/ResultsScroll';
import { useGameSession } from '@/context/GameSessionContext';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
import { ChallengeModifier, ChallengeScoreEntry, ChallengeTier } from '@/types/challenge';
import { track } from '@/utils/analytics';
import { SeededRandom } from '@/utils/random';
import { fetchChallengeLeaderboard, isGlobalLeaderboardEnabled, LeaderboardEntry } from '@/utils/challengeLeaderboard';

const SCORE_KEY_PREFIX = 'glucoseWars.challenge.scores.'; // + challengeId

function parseMods(mods?: string): ChallengeModifier[] {
  if (!mods) return [];
  return mods
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean) as ChallengeModifier[];
}

export default function ChallengeResults() {
  const params = useLocalSearchParams<{ tier?: string; seed?: string; mods?: string; name?: string; id?: string }>();
  const { battleGame, tierConfig, healthProfile, selectedTier, setChallenge } = useGameSession();
  const { progress } = usePlayerProgressContext();

  const { gameState } = battleGame;

  const tier = (params.tier as ChallengeTier) || (selectedTier as any) || 'tier1';
  const seed = params.seed || 'default';
  const mods = useMemo(() => parseMods(params.mods), [params.mods]);
  const challengeId = params.id || 'unknown';
  const challengeName = params.name || 'Challenge';

  const shareUrl = useMemo(() => {
    return Linking.createURL('/challenge/play', {
      queryParams: {
        tier,
        seed,
        mods: mods.join(','),
        name: challengeName,
        id: challengeId,
      },
    });
  }, [tier, seed, mods, challengeName, challengeId]);

  const [scores, setScores] = useState<ChallengeScoreEntry[]>([]);
  const [globalScores, setGlobalScores] = useState<LeaderboardEntry[] | null>(null);

  const copyShareLink = useCallback(async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch {
      // ignore
    }
  }, [shareUrl]);

  const downloadResultCard = useCallback(async () => {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;

    const w = 1200;
    const h = 630;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#0f0f1a');
    g.addColorStop(1, '#2b145f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Frame
    ctx.strokeStyle = 'rgba(167,139,250,0.6)';
    ctx.lineWidth = 8;
    ctx.strokeRect(32, 32, w - 64, h - 64);

    // Title
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 44px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.fillText('GLUCOSEWARS CHALLENGE', 70, 120);

    // Challenge name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    const name = (challengeName || 'Challenge').slice(0, 28);
    ctx.fillText(name, 70, 200);

    // Score
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 120px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.fillText(String(gameState.score || 0), 70, 350);

    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = 'bold 28px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.fillText(`Score • ${tier.toUpperCase()} • ${(mods || []).length} mods`, 70, 395);

    // Link (shortened)
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '20px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
    const urlText = shareUrl.replace(/^https?:\/\//, '').slice(0, 70);
    ctx.fillText(urlText, 70, 520);

    // Footer
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '18px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.fillText('Can you beat my run? Play the same seed via the link.', 70, 560);

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `glucosewars-${tier}-${challengeId}.png`;
    a.click();
  }, [challengeId, challengeName, gameState.score, mods, shareUrl, tier]);

  const globalDemo = useMemo(() => {
    // Demo “global” leaderboard derived from seed so the same link looks consistent.
    const seedStr = `${challengeId}|${seed}|${tier}|${mods.slice().sort().join(',')}`;
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0;
    const rng = new SeededRandom(hash || 1);

    const names = ['Sir Glucose', 'Lady Insulin', 'Knight Fiber', 'Alchemist Ben', 'Squire Sam', 'Mage Oats', 'Captain Kale'];
    const base = 650 + rng.nextInt(0, 400);
    const entries = names.map((n) => ({ name: n, score: base + rng.nextInt(-120, 220) }));
    entries.push({ name: 'YOU', score: gameState.score || 0 });
    entries.sort((a, b) => b.score - a.score);
    return entries.slice(0, 8).map((e, idx) => ({ ...e, rank: idx + 1, isPlayer: e.name === 'YOU' }));
  }, [challengeId, seed, tier, mods, gameState.score]);

  useEffect(() => {
    track('challenge_leaderboard_viewed', { challenge_id: challengeId, tier, modifiers_count: mods.length, privacy_mode: progress.privacyMode });
    const load = async () => {
      const raw = await AsyncStorage.getItem(`${SCORE_KEY_PREFIX}${challengeId}`);
      setScores(raw ? JSON.parse(raw) : []);
    };
    load();

    const loadGlobal = async () => {
      if (!isGlobalLeaderboardEnabled()) return;
      const top = await fetchChallengeLeaderboard(challengeId, 10);
      if (top) setGlobalScores(top);
    };
    loadGlobal();

    // Clear active challenge so normal mode remains clean
    setChallenge(null);
  }, [challengeId, tier, mods.length, progress.privacyMode, setChallenge]);

  return (
    <View className="flex-1 bg-[#0f0f1a]">
      <View className="flex-1">
        <ResultsScroll
          result={gameState.gameResult || 'defeat'}
          score={gameState.score}
          glucoseLevel={gameState.stability}
          correctSwipes={gameState.correctSwipes}
          incorrectSwipes={gameState.incorrectSwipes}
          timeInBalanced={gameState.timeInBalanced}
          comboMax={gameState.comboCount}
          onPlayAgain={() => {
            track('play_again_clicked', { tier, challenge_id: challengeId, privacy_mode: progress.privacyMode });
            router.replace({
              pathname: '/challenge/play' as any,
              params: { tier, seed, mods: mods.join(','), name: challengeName, id: challengeId },
            });
          }}
          onMainMenu={() => {
            track('main_menu_clicked', { from: 'challenge_results', tier, challenge_id: challengeId, privacy_mode: progress.privacyMode });
            router.replace('/challenge' as any);
          }}
          gameMode={tierConfig.gameMode}
          finalMetrics={gameState.metrics}
          morningCondition={gameState.morningCondition}
          gameState={gameState}
          healthProfile={tierConfig.healthProfile ? healthProfile.healthProfile : undefined}
          tier={tier as any}
          dexcomOption={tierConfig.dexcomOption}
          userMode={progress.userMode || undefined}
        />
      </View>

      <View className="px-4 pb-6">
        <View className="bg-black/60 border border-purple-700 rounded-2xl p-4 mb-3">
          <Text className="text-white font-bold" numberOfLines={1}>🏁 {challengeName}</Text>
          <Text className="text-gray-400 text-[10px]" numberOfLines={1}>{shareUrl}</Text>
          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity
              onPress={async () => {
                await copyShareLink();
                track('challenge_share_clicked', { surface: 'results', medium: 'copy_link' });
              }}
              className="flex-1 bg-purple-700/60 border border-purple-500 rounded-xl py-3 items-center"
            >
              <Text className="text-white font-bold">COPY LINK</Text>
            </TouchableOpacity>

            {Platform.OS === 'web' && (
              <TouchableOpacity
                onPress={async () => {
                  await downloadResultCard();
                  track('challenge_share_clicked', { surface: 'results', medium: 'download_card' });
                }}
                className="flex-1 bg-amber-600/30 border border-amber-400 rounded-xl py-3 items-center"
              >
                <Text className="text-amber-200 font-bold">DOWNLOAD CARD</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View className="bg-black/50 border border-purple-900 rounded-2xl p-4 mb-3">
          <Text className="text-white font-bold mb-2">
            🌍 Global Leaderboard {globalScores ? '' : '(Demo)'}
          </Text>

          {(globalScores || globalDemo).map((e: any) => (
            <View
              key={`${e.rank}-${e.playerId || e.name}`}
              className={`flex-row justify-between py-2 border-b border-gray-900 ${e.isPlayer ? 'bg-purple-700/20 rounded-lg px-2' : ''}`}
            >
              <Text className="text-gray-300 text-xs">#{e.rank}</Text>
              <Text className={`${e.isPlayer ? 'text-amber-300' : 'text-white'} text-xs font-bold`}>
                {e.displayName || e.name || (e.playerId ? String(e.playerId).slice(0, 6) : 'PLAYER')}
              </Text>
              <Text className="text-gray-200 text-xs">{e.score}</Text>
            </View>
          ))}

          {!globalScores && (
            <Text className="text-gray-500 text-[10px] mt-2">
              Configure EXPO_PUBLIC_LEADERBOARD_API_URL to enable real global scores.
            </Text>
          )}
        </View>

        <View className="bg-black/50 border border-gray-800 rounded-2xl p-4">
          <Text className="text-white font-bold mb-2">🏆 Local Leaderboard (MVP)</Text>
          {scores.length === 0 ? (
            <Text className="text-gray-400 text-sm">No saved scores yet on this device.</Text>
          ) : (
            <ScrollView style={{ maxHeight: 160 }} showsVerticalScrollIndicator={false}>
              {scores.slice(0, 10).map((s, idx) => (
                <View key={`${s.playerId}-${s.createdAt}-${idx}`} className="flex-row justify-between py-2 border-b border-gray-900">
                  <Text className="text-gray-300 text-xs">#{idx + 1}</Text>
                  <Text className="text-white text-xs font-bold">{s.score}</Text>
                  <Text className="text-gray-500 text-xs">{s.result}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
}
