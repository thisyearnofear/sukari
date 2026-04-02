import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Animated } from 'react-native';
import { GameTier, GAME_TIERS } from '@/constants/gameTiers';
import { ControlMode, GameMode } from '@/types/game';
import { usePlayerProgress } from '@/hooks/usePlayerProgress';
import { Ionicons } from '@expo/vector-icons';
import { createPulseAnimation } from '@/utils/animations';

const { width } = Dimensions.get('window');
const maxWidth = Math.min(width * 0.9, 400);

interface GameSelectionScreenProps {
  onStartGame: (tier: GameTier, controlMode: ControlMode, gameMode?: GameMode) => void;
  onBack?: () => void;
}

export const GameSelectionScreen: React.FC<GameSelectionScreenProps> = ({ onStartGame, onBack }) => {
  const { progress } = usePlayerProgress();
  const [selectedTier, setSelectedTier] = useState<GameTier>(progress.currentTier || 'tier1');
  const [selectedControlMode, setSelectedControlMode] = useState<ControlMode>('swipe');
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [showQuickStart, setShowQuickStart] = useState(true);
  const [showTierInfo, setShowTierInfo] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    createPulseAnimation(pulseAnim, {
      duration: 2000,
      minScale: 1,
      maxScale: 1.08,
    }).start();
  }, [pulseAnim]);
  
  const availableTiers: GameTier[] = ['tier1'];
  if (progress.maxTierUnlocked === 'tier2' || progress.maxTierUnlocked === 'tier3' || progress.maxTierUnlocked === 'weekly') {
    availableTiers.push('tier2');
  }
  if (progress.maxTierUnlocked === 'tier3' || progress.maxTierUnlocked === 'weekly') {
    availableTiers.push('tier3');
  }
  // Weekly Challenge is always available as the "Alchemist's Lab"
  availableTiers.push('weekly');

  const tierData = availableTiers.map(tier => GAME_TIERS[tier]);

  const getQuickStartMessage = () => {
    if (progress.gamesPlayed === 0) return "🎯 New player? Start here!";
    if (progress.gamesPlayed < 3) return "⚡ 2 min quick battle";
    return "🔥 Next challenge awaits";
  };

  if (showQuickStart) {
    return (
      <View className="flex-1 bg-[#0f0f1a]">
        <View className="w-full flex-row items-center justify-between p-4 border-b border-purple-800">
          <TouchableOpacity onPress={() => onBack?.()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#fbbf24" />
          </TouchableOpacity>
          <Text className="text-amber-400 text-lg font-bold">YOUR NEXT BATTLE</Text>
          <TouchableOpacity 
            onPress={() => setShowQuickStart(false)} 
            className="p-2"
          >
            <Ionicons name="settings-outline" size={24} color="#fbbf24" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 16 }}>
          <Text className="text-5xl mb-3">⚔️</Text>
          <Text className="text-white text-3xl font-bold text-center mb-2">Ready to Battle?</Text>
          <Text className="text-purple-300 text-base text-center mb-8">{getQuickStartMessage()}</Text>

          <View className="w-full max-w-sm mb-6">
            <View className="bg-gradient-to-r from-amber-600/30 to-orange-600/20 rounded-2xl border-2 border-amber-400 p-6 items-center">
              <Text className="text-5xl mb-3">
                {selectedTier === 'tier1' ? '🏰' : selectedTier === 'tier2' ? '⚔️' : selectedTier === 'tier3' ? '👑' : '🧪'}
              </Text>
              <Text className="text-amber-300 text-sm font-bold mb-1">RECOMMENDED</Text>
              <Text className="text-white text-2xl font-bold text-center mb-2">
                {GAME_TIERS[selectedTier].name}
              </Text>
              <Text className="text-gray-300 text-sm text-center mb-4">
                {GAME_TIERS[selectedTier].description}
              </Text>
              
              <View className="flex-row gap-4 mb-4 w-full justify-center">
                <View className="items-center">
                  <Text className="text-2xl mb-1">⏱️</Text>
                  <Text className="text-xs text-gray-400">{GAME_TIERS[selectedTier].duration}s</Text>
                </View>
                <View className="items-center">
                  <Text className="text-2xl mb-1">🎮</Text>
                  <Text className="text-xs text-gray-400">
                    {GAME_TIERS[selectedTier].gameMode === 'classic' ? 'Fast' : 'Tactical'}
                  </Text>
                </View>
              </View>

              <View className="w-full bg-black/40 rounded-lg p-2 border border-amber-600/40">
                <Text className="text-amber-300 text-xs font-bold text-center mb-1">YOUR RECORD</Text>
                <Text className="text-white text-xs text-center">
                  🏆 {progress.bestScore} points | 🎯 {progress.gamesPlayed} played
                </Text>
              </View>
            </View>
          </View>

          <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%', maxWidth: 320 }}>
            <TouchableOpacity
              onPress={() => onStartGame(selectedTier, selectedControlMode, 'classic')}
              className="bg-green-600 border-4 border-green-400 rounded-2xl py-5 items-center"
              style={{
                shadowColor: '#22c55e',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.9,
                shadowRadius: 25,
                elevation: 15,
              }}
            >
              <Text className="text-white text-lg font-bold">⚡ START BATTLE NOW</Text>
              <Text className="text-green-200 text-xs mt-1">Press to begin!</Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            onPress={() => setShowQuickStart(false)}
            className="flex-row items-center justify-center gap-2 mt-8"
          >
            <Text className="text-purple-400 text-sm font-bold">⚙️ Customize Options</Text>
            <Ionicons name="chevron-forward" size={16} color="#a78bfa" />
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0f0f1a]">
      <View className="w-full flex-row items-center justify-between p-4 border-b border-purple-800">
        <TouchableOpacity onPress={() => setShowQuickStart(true)} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#fbbf24" />
        </TouchableOpacity>
        <Text className="text-amber-400 text-lg font-bold">CUSTOMIZE</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 48, flexGrow: 1 }} className="flex-1 px-4">
        <View className="items-center z-10 mt-6 w-full">
          <Text className="text-white text-2xl font-bold mb-2">Fine-Tune Your Battle</Text>
          <Text className="text-purple-300 text-sm mb-6">Pick your tier and mode</Text>

          {/* Game Mode Selection - Compact Line */}
          <View className="w-full max-w-sm mb-6">
            <Text className="text-white text-xs font-bold mb-2 uppercase tracking-widest text-center">Game Mode</Text>
            <View className="flex-row gap-2">
              {(['classic', 'life', 'slowmo'] as GameMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setGameMode(mode)}
                  className={`flex-1 py-3 rounded-xl border ${
                    gameMode === mode ? 'bg-amber-600/30 border-amber-400' : 'bg-black/40 border-purple-700'
                  }`}
                >
                  <Text className={`text-center font-bold text-[10px] ${gameMode === mode ? 'text-amber-300' : 'text-gray-400'}`}>
                    {mode.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tier Selection - Compact Line */}
          <View className="w-full max-w-sm mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white text-xs font-bold uppercase tracking-widest text-center">Difficulty Tier</Text>
              <TouchableOpacity 
                onPress={() => setShowTierInfo(!showTierInfo)}
                className="p-1"
              >
                <Text className="text-cyan-400 text-lg">ℹ️</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-2">
              {tierData.map((tier) => (
                <TouchableOpacity
                  key={tier.tier}
                  onPress={() => setSelectedTier(tier.tier)}
                  className={`flex-1 py-4 rounded-xl border-2 items-center justify-center ${
                    selectedTier === tier.tier 
                      ? 'bg-purple-600/30 border-amber-400' 
                      : 'bg-black/40 border-purple-700'
                  }`}
                >
                  <Text className="text-xl mb-1">
                    {tier.tier === 'tier1' ? '🏰' : tier.tier === 'tier2' ? '⚔️' : tier.tier === 'tier3' ? '👑' : '🧪'}
                  </Text>
                  <Text className={`text-[10px] font-bold ${selectedTier === tier.tier ? 'text-amber-300' : 'text-white'}`}>
                    {tier.name.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tier Comparison Tooltip */}
          {showTierInfo && (
            <View className="w-full max-w-sm mb-4 bg-black/80 rounded-xl border border-cyan-700 p-3">
              <Text className="text-cyan-400 text-xs font-bold mb-2">📊 TIER COMPARISON</Text>
              <View className="gap-2">
                <View className="flex-row justify-between">
                  <Text className="text-green-400 text-xs">🏰 Warm-Up (Tier 1)</Text>
                  <Text className="text-gray-400 text-xs">30s • Learn mechanics • Gentle penalties</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-amber-400 text-xs">⚔️ Challenge (Tier 2)</Text>
                  <Text className="text-gray-400 text-xs">60s • Real glucose • Harder penalties</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-purple-400 text-xs">👑 Master (Tier 3)</Text>
                  <Text className="text-gray-400 text-xs">90s • Full simulation • Maximum challenge</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-pink-400 text-xs">🧪 Alchemist (Weekly)</Text>
                  <Text className="text-gray-400 text-xs">120s • Seeded Run • Global Leaderboard</Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => setShowTierInfo(false)}
                className="mt-2"
              >
                <Text className="text-gray-500 text-xs text-center">Tap to close</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            onPress={() => onStartGame(selectedTier, selectedControlMode, gameMode)}
            className="px-8 py-5 rounded-2xl border-4 bg-amber-600 border-amber-400 w-full max-w-[320px]"
            style={{
              shadowColor: '#f59e0b',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <View className="flex-row items-center justify-center">
              <Text className="text-2xl mr-2">⚔️</Text>
              <Text className="text-white text-lg font-bold">START BATTLE</Text>
            </View>
          </TouchableOpacity>

          <View className="mt-6">
            <Text className="text-purple-400 text-xs text-center">
              🏆 Best: {progress.bestScore} | 🎮 Played: {progress.gamesPlayed}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};
