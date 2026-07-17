import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Ionicons } from '@expo/vector-icons';
import { ChallengeDefinition, ChallengeModifier, ChallengeTier } from '@/types/challenge';
import { getAnonymousId, track } from '@/utils/analytics';

const MY_CHALLENGES_KEY = 'glucoseWars.challenge.myChallenges';

const MODS: Array<{ id: ChallengeModifier; title: string; desc: string }> = [
  { id: 'fast_spawn', title: 'Fast Spawns', desc: 'More pressure, more decisions.' },
  { id: 'slow_spawn', title: 'Slow Spawns', desc: 'More time to think.' },
  { id: 'fast_fall', title: 'Fast Fall', desc: 'Faster food movement.' },
  { id: 'thin_margins', title: 'Thin Margins', desc: 'Balanced zone is narrower.' },
  { id: 'short_combo_window', title: 'Short Combo', desc: 'Tighter combo timing.' },
  { id: 'no_powerups', title: 'No Power-ups', desc: 'Exercise/Rations disabled.' },
];

function normalizeModifiers(mods: ChallengeModifier[]) {
  const unique = Array.from(new Set(mods));
  unique.sort();
  // Prevent contradictory modifiers
  if (unique.includes('fast_spawn') && unique.includes('slow_spawn')) {
    return unique.filter((m) => m !== 'slow_spawn');
  }
  return unique;
}

export default function ChallengeCreate() {
  const [tier, setTier] = useState<ChallengeTier>('tier1');
  const [mods, setMods] = useState<ChallengeModifier[]>(['fast_spawn']);

  const normalizedMods = useMemo(() => normalizeModifiers(mods), [mods]);

  const toggle = (m: ChallengeModifier) => {
    setMods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };

  const create = async () => {
    track('challenge_created', { tier, modifiers: normalizedMods, modifiers_count: normalizedMods.length, seeded_type: 'random' });

    const seed = Crypto.randomUUID().slice(0, 8);
    const id = `${tier}-${seed}-${normalizedMods.join('.') || 'none'}`;
    const anon = await getAnonymousId();

    const challenge: ChallengeDefinition = {
      id,
      name: `Challenge ${seed.toUpperCase()}`,
      tier,
      seed,
      modifiers: normalizedMods,
      createdAt: Date.now(),
      createdBy: anon,
      version: 1,
    };

    const raw = await AsyncStorage.getItem(MY_CHALLENGES_KEY);
    const list: ChallengeDefinition[] = raw ? JSON.parse(raw) : [];
    await AsyncStorage.setItem(MY_CHALLENGES_KEY, JSON.stringify([challenge, ...list].slice(0, 50)));

    track('challenge_share_clicked', { surface: 'create', medium: 'copy_link' });

    router.replace({
      pathname: '/challenge/play' as any,
      params: { tier: challenge.tier, seed: challenge.seed, mods: challenge.modifiers.join(','), name: challenge.name, id: challenge.id },
    });
  };

  return (
    <View className="flex-1 bg-[#0f0f1a]">
      <View className="w-full flex-row items-center justify-between p-4 border-b border-purple-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#fbbf24" />
        </TouchableOpacity>
        <Text className="text-amber-400 text-lg font-bold">CREATE CHALLENGE</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-white font-bold mb-2">Tier</Text>
        <View className="flex-row gap-2 mb-5">
          {(['tier1', 'tier2', 'tier3'] as ChallengeTier[]).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTier(t)}
              className={`flex-1 py-3 rounded-xl border ${tier === t ? 'bg-amber-600/30 border-amber-400' : 'bg-black/40 border-purple-700'}`}
            >
              <Text className={`text-center font-bold ${tier === t ? 'text-amber-200' : 'text-gray-300'}`}>{t.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-white font-bold mb-2">Modifiers</Text>
        <View className="gap-3">
          {MODS.map((m) => {
            const selected = normalizedMods.includes(m.id);
            return (
              <TouchableOpacity
                key={m.id}
                onPress={() => toggle(m.id)}
                className={`rounded-2xl p-4 border ${selected ? 'bg-green-600/15 border-green-400' : 'bg-black/40 border-gray-800'}`}
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className={`font-bold ${selected ? 'text-white' : 'text-gray-300'}`}>{m.title}</Text>
                    <Text className="text-gray-400 text-xs mt-1">{m.desc}</Text>
                  </View>
                  <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={selected ? '#22c55e' : '#6b7280'} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity onPress={create} className="bg-green-600 border-2 border-green-400 rounded-2xl py-4 items-center mt-6">
          <Text className="text-white font-bold">⚡ CREATE & PLAY</Text>
          <Text className="text-green-200 text-xs mt-1">A share link will be available on results</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
