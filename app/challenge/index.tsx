import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ChallengeDefinition } from '@/types/challenge';
import { track } from '@/utils/analytics';

const MY_CHALLENGES_KEY = 'glucoseWars.challenge.myChallenges';

export default function ChallengeHub() {
  const [myChallenges, setMyChallenges] = useState<ChallengeDefinition[]>([]);

  useEffect(() => {
    track('challenge_hub_viewed');
    const load = async () => {
      const raw = await AsyncStorage.getItem(MY_CHALLENGES_KEY);
      setMyChallenges(raw ? JSON.parse(raw) : []);
    };
    load();
  }, []);

  const sorted = useMemo(
    () => [...myChallenges].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [myChallenges],
  );

  return (
    <View className="flex-1 bg-[#0f0f1a]">
      <View className="w-full flex-row items-center justify-between p-4 border-b border-purple-800">
        <TouchableOpacity onPress={() => router.replace('/')} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#fbbf24" />
        </TouchableOpacity>
        <Text className="text-amber-400 text-lg font-bold">CHALLENGES</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="bg-black/50 border border-purple-700 rounded-2xl p-4 mb-4">
          <Text className="text-white text-base font-bold mb-2">Programme challenges</Text>
          <Text className="text-purple-300 text-xs leading-5">
            Share seeded practice runs tied to metabolic habits — protein-first, ban liquid sugar, twilight patrol. Growth after adherence, not instead of it.
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            track('challenge_create_opened', { source: 'hub' });
            router.push('/challenge/create' as any);
          }}
          className="bg-green-600 border-2 border-green-400 rounded-2xl py-4 items-center mb-4"
        >
          <Text className="text-white font-bold">➕ CREATE A CHALLENGE</Text>
        </TouchableOpacity>

        <View className="flex-row gap-3 mb-3">
          <TouchableOpacity
            onPress={() => {
              const d = new Date();
              const seed = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-protein`;
              router.push({
                pathname: '/challenge/play' as any,
                params: {
                  tier: 'tier2',
                  seed,
                  mods: 'thin_margins',
                  name: 'Protein Vanguard',
                  featured: 'programme',
                },
              });
            }}
            className="flex-1 bg-green-600/15 border border-green-500 rounded-2xl p-4"
          >
            <Text className="text-green-300 text-xs font-bold mb-1">PROGRAMME</Text>
            <Text className="text-white font-bold">Protein Vanguard</Text>
            <Text className="text-gray-300 text-xs mt-1">Practice protein-first choices</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              const d = new Date();
              const seed = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-soda`;
              router.push({
                pathname: '/challenge/play' as any,
                params: {
                  tier: 'tier2',
                  seed,
                  mods: 'fast_spawn',
                  name: 'Ban the Potion',
                  featured: 'programme',
                },
              });
            }}
            className="flex-1 bg-red-600/15 border border-red-400 rounded-2xl p-4"
          >
            <Text className="text-red-300 text-xs font-bold mb-1">PROGRAMME</Text>
            <Text className="text-white font-bold">Ban the Potion</Text>
            <Text className="text-gray-300 text-xs mt-1">Reject liquid sugar under pressure</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            onPress={() => {
              // Featured = deterministic daily seed (YYYY-MM-DD)
              const d = new Date();
              const seed = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              router.push({
                pathname: '/challenge/play' as any,
                params: { tier: 'tier1', seed, mods: '', name: 'Daily Proclamation', featured: 'daily' },
              });
            }}
            className="flex-1 bg-amber-600/20 border border-amber-400 rounded-2xl p-4"
          >
            <Text className="text-amber-300 text-xs font-bold mb-1">FEATURED</Text>
            <Text className="text-white font-bold">Daily Proclamation</Text>
            <Text className="text-gray-300 text-xs mt-1">Fast Tier 1 run</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/game-selection')}
            className="flex-1 bg-purple-600/15 border border-purple-500 rounded-2xl p-4"
          >
            <Text className="text-purple-300 text-xs font-bold mb-1">PRACTICE</Text>
            <Text className="text-white font-bold">Back to Modes</Text>
            <Text className="text-gray-300 text-xs mt-1">Classic / Life / Weekly</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-white font-bold mb-2">MY CHALLENGES</Text>
        {sorted.length === 0 ? (
          <View className="bg-black/40 border border-gray-800 rounded-2xl p-4">
            <Text className="text-gray-400 text-sm">No challenges yet. Create one to get a share link.</Text>
          </View>
        ) : (
          sorted.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => {
                track('challenge_play_opened', { source: 'my_challenges', tier: c.tier, modifiers_count: c.modifiers?.length || 0 });
                router.push({
                  pathname: '/challenge/play' as any,
                  params: { tier: c.tier, seed: c.seed, mods: (c.modifiers || []).join(','), name: c.name, id: c.id },
                });
              }}
              className="bg-black/50 border border-purple-700 rounded-2xl p-4 mb-3"
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-white font-bold">{c.name}</Text>
                  <Text className="text-gray-400 text-xs mt-1">
                    {c.tier.toUpperCase()} • {(c.modifiers || []).length} mods
                  </Text>
                </View>
                <Ionicons name="play" size={20} color="#22c55e" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
