import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Animated } from 'react-native';
import { GameTier, GAME_TIERS } from '@/constants/gameTiers';
import { ControlMode, GameMode } from '@/types/game';
import { usePlayerProgress } from '@/hooks/usePlayerProgress';
import { Ionicons } from '@expo/vector-icons';

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
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  
  // Available tiers based on player progress
  const availableTiers: GameTier[] = ['tier1'];
  if (progress.maxTierUnlocked === 'tier2' || progress.maxTierUnlocked === 'tier3') {
    availableTiers.push('tier2');
  }
  if (progress.maxTierUnlocked === 'tier3') {
    availableTiers.push('tier3');
  }

  const tierData = availableTiers.map(tier => GAME_TIERS[tier]);

  return (
    <View className="flex-1 bg-[#0f0f1a] items-center justify-center">
      {/* Header */}
      <View className="w-full flex-row items-center justify-between p-4 absolute top-0">
        <TouchableOpacity onPress={() => onBack?.()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#fbbf24" />
        </TouchableOpacity>
        <Text className="text-amber-400 text-lg font-bold">SELECT GAME</Text>
        <TouchableOpacity 
          onPress={() => setShowAdvancedOptions(!showAdvancedOptions)} 
          className="p-2"
        >
          <Ionicons name={showAdvancedOptions ? "settings" : "settings-outline"} size={24} color="#fbbf24" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View className="items-center z-10 px-4 flex-1 justify-center">
        <Text className="text-white text-2xl font-bold mb-2">Choose Your Challenge</Text>
        <Text className="text-purple-300 text-sm mb-6">Select difficulty and game mode</Text>

        {/* Game Mode Selection */}
        <View className="mb-4">
          <Text className="text-white text-sm mb-2">Game Mode:</Text>
          <View className="flex-row gap-2 mb-6">
            <TouchableOpacity
              onPress={() => setGameMode('classic')}
              className={`flex-1 p-3 rounded-lg border ${
                gameMode === 'classic' ? 'bg-amber-600/30 border-amber-400' : 'bg-black/40 border-purple-700'
              }`}
            >
              <Text className="text-white text-center font-bold">CLASSIC</Text>
              <Text className="text-gray-400 text-xs text-center">Fast-paced</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setGameMode('life')}
              className={`flex-1 p-3 rounded-lg border ${
                gameMode === 'life' ? 'bg-amber-600/30 border-amber-400' : 'bg-black/40 border-purple-700'
              }`}
            >
              <Text className="text-white text-center font-bold">LIFE</Text>
              <Text className="text-gray-400 text-xs text-center">Simulation</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setGameMode('slowmo')}
              className={`flex-1 p-3 rounded-lg border ${
                gameMode === 'slowmo' ? 'bg-amber-600/30 border-amber-400' : 'bg-black/40 border-purple-700'
              }`}
            >
              <Text className="text-white text-center font-bold">SLOW MO</Text>
              <Text className="text-gray-400 text-xs text-center">Educational</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tier Selection */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ paddingHorizontal: 10, gap: 12 }} 
          className="mb-6"
        >
          {tierData.map((tier) => (
            <TouchableOpacity
              key={tier.tier}
              onPress={() => setSelectedTier(tier.tier)}
              className={`w-40 h-48 rounded-2xl border-2 p-4 items-center justify-center ${
                selectedTier === tier.tier 
                  ? 'bg-amber-600/20 border-amber-400' 
                  : 'bg-black/40 border-purple-700'
              }`}
            >
              <View className="items-center">
                <Text className="text-3xl mb-2">
                  {tier.tier === 'tier1' ? '🏰' : tier.tier === 'tier2' ? '⚔️' : '👑'}
                </Text>
                <Text className={`text-lg font-bold mb-1 ${selectedTier === tier.tier ? 'text-amber-400' : 'text-white'}`}>
                  {tier.name}
                </Text>
                <Text className={`text-xs text-center ${selectedTier === tier.tier ? 'text-amber-300' : 'text-gray-300'}`}>
                  {tier.description}
                </Text>
                <View className="mt-3 flex-row items-center">
                  <Ionicons name="time" size={14} color={selectedTier === tier.tier ? "#fbbf24" : "#9ca3af"} />
                  <Text className={`text-xs ml-1 ${selectedTier === tier.tier ? 'text-amber-300' : 'text-gray-300'}`}>
                    {tier.duration}s
                  </Text>
                </View>
                <View className="mt-1 flex-row items-center">
                  <Ionicons name="star" size={14} color={selectedTier === tier.tier ? "#fbbf24" : "#9ca3af"} />
                  <Text className={`text-xs ml-1 ${selectedTier === tier.tier ? 'text-amber-300' : 'text-gray-300'}`}>
                    {tier.gameMode === 'classic' ? 'Classic' : 'Life Mode'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Control Mode Selection */}
        <View style={{ width: maxWidth }} className="bg-black/60 p-4 rounded-2xl border-2 border-purple-700 mb-4">
          <Text className="text-amber-400 text-xs font-bold text-center mb-3">🎮 CONTROL METHOD</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setSelectedControlMode('swipe')}
              className={`flex-1 p-3 rounded-lg border items-center ${
                selectedControlMode === 'swipe'
                  ? 'bg-green-600/30 border-green-500'
                  : 'bg-gray-800/50 border-gray-600'
              }`}
            >
              <Text className="text-2xl mb-1">👆</Text>
              <Text className={`text-xs font-bold ${selectedControlMode === 'swipe' ? 'text-green-400' : 'text-gray-400'}`}>
                SWIPE
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedControlMode('tap')}
              className={`flex-1 p-3 rounded-lg border items-center ${
                selectedControlMode === 'tap'
                  ? 'bg-blue-600/30 border-blue-500'
                  : 'bg-gray-800/50 border-gray-600'
              }`}
            >
              <Text className="text-2xl mb-1">🖱️</Text>
              <Text className={`text-xs font-bold ${selectedControlMode === 'tap' ? 'text-blue-400' : 'text-gray-400'}`}>
                TAP
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Advanced Options (expandable) */}
        {showAdvancedOptions && (
          <View style={{ width: maxWidth }} className="bg-black/60 p-4 rounded-2xl border-2 border-cyan-700 mb-4">
            <Text className="text-cyan-400 text-xs font-bold mb-3">⚙️ ADVANCED OPTIONS</Text>
            
            <View className="space-y-3">
              {/* Difficulty Slider */}
              <View>
                <Text className="text-white text-xs mb-1">Game Speed</Text>
                <View className="flex-row items-center">
                  <Text className="text-gray-400 text-xs">🐢</Text>
                  <View className="flex-1 h-1 bg-gray-700 mx-2 rounded">
                    <View className="h-1 bg-cyan-400 rounded w-1/2" />
                  </View>
                  <Text className="text-gray-400 text-xs">🐇</Text>
                </View>
              </View>

              {/* Tutorial Toggle */}
              <View className="flex-row items-center justify-between">
                <Text className="text-white text-xs">Show Tutorial</Text>
                <TouchableOpacity className="w-10 h-5 bg-gray-600 rounded-full p-1">
                  <View className="w-3 h-3 bg-white rounded-full" />
                </TouchableOpacity>
              </View>

              {/* Health Profile Selection */}
              {selectedTier !== 'tier1' && (
                <View>
                  <Text className="text-white text-xs mb-1">Health Profile</Text>
                  <View className="flex-row gap-2">
                    <TouchableOpacity className="flex-1 p-2 bg-gray-800/50 border border-gray-600 rounded">
                      <Text className="text-gray-400 text-xs text-center">Auto</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-1 p-2 bg-gray-800/50 border border-gray-600 rounded">
                      <Text className="text-gray-400 text-xs text-center">Custom</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Start Button */}
        <TouchableOpacity
          onPress={() => onStartGame(selectedTier, selectedControlMode, gameMode)}
          className={`px-8 py-4 rounded-2xl border-4 bg-amber-600 border-amber-400 w-full max-w-[350px]`}
          style={{
            shadowColor: '#f59e0b',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 20,
            elevation: 10,
          }}
          activeOpacity={0.8}
        >
          <View className="flex-row items-center justify-center">
            <Text className="text-3xl mr-2">⚔️</Text>
            <Text className="text-white text-base font-bold">
              START {GAME_TIERS[selectedTier].name.toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Quick Stats */}
        <View className="mt-4">
          <Text className="text-purple-400 text-xs text-center">
            🏆 Best Score: {progress.bestScore} | 🎮 Games Played: {progress.gamesPlayed}
          </Text>
        </View>
      </View>
    </View>
  );
};