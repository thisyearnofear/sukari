import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, Platform, ScrollView } from 'react-native';
import { ControlMode, UserMode } from '@/types/game';
import { usePlayerProgress } from '@/hooks/usePlayerProgress';
import { USER_MODE_CONFIGS } from '@/constants/userModes';
import { PrivacyToggle } from '@/components/PrivacyToggle';
import { PrivacySettingsModal } from '@/components/PrivacySettings';
import { useWeb3 } from '@/context/Web3Context';
import { RoleBadgeModal } from '@/components/game/RoleBadgeModal';
import { GAME_TIERS } from '@/constants/gameTiers';

const { width, height } = Dimensions.get('window');
const screenWidth = width;
const maxWidth = Math.min(screenWidth * 0.9, 400);

interface MainMenuProps {
  onStartGame: (controlMode: ControlMode) => void;
  onSelectGame: () => void;
  onUserModeSelected?: (mode: string) => void;
  userModeSelected?: boolean;
  onViewStats?: () => void;
}

const FloatingFood: React.FC<{ emoji: string; delay: number; isAlly: boolean }> = ({ emoji, delay, isAlly }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(Math.random() * screenWidth)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      translateY.setValue(-50);
      translateX.setValue(40 + Math.random() * (screenWidth - 80));
      opacity.setValue(0);

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0.6, duration: 500, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 600, duration: 8000, useNativeDriver: true }),
        ]),
        Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start(() => startAnimation());
    };

    startAnimation();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        transform: [{ translateX }, { translateY }],
        opacity,
      }}
    >
      <View 
        className="w-12 h-12 rounded-full items-center justify-center border-2"
        style={{
          borderColor: isAlly ? '#22c55e' : '#ef4444',
          backgroundColor: isAlly ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
        }}
      >
        <Text className="text-2xl">{emoji}</Text>
      </View>
    </Animated.View>
  );
};

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, onSelectGame, onUserModeSelected, userModeSelected, onViewStats }) => {
  const [selectedMode, setSelectedMode] = useState<ControlMode>('swipe');
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const { progress, setUserMode, setPrivacyMode, updatePrivacySettings } = usePlayerProgress();
  const [showUserModeSelector, setShowUserModeSelector] = useState(userModeSelected === false);
  const [selectedRole, setSelectedRole] = useState<UserMode | null>(null);
  const [showMintModal, setShowMintModal] = useState(false);
  const { isConnected } = useWeb3();

  useEffect(() => {
    // Pulse animation for start button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const floatingFoods = [
    { emoji: '🥦', isAlly: true },
    { emoji: '🍩', isAlly: false },
    { emoji: '🥕', isAlly: true },
    { emoji: '🍬', isAlly: false },
    { emoji: '🐟', isAlly: true },
    { emoji: '🍔', isAlly: false },
    { emoji: '🍎', isAlly: true },
    { emoji: '🥤', isAlly: false },
  ];

  const progressInfo = progress.maxTierUnlocked !== 'tier1' ? (
    <View style={{ width: maxWidth }} className="bg-black/60 p-3 rounded-xl border border-amber-700 mb-4">
      <Text className="text-amber-400 text-xs font-bold text-center mb-1">
        🏆 YOUR PROGRESS
      </Text>
      <Text className="text-white text-sm text-center">
        Unlocked: {GAME_TIERS[progress.maxTierUnlocked].name}
      </Text>
      {progress.bestScore > 0 && (
        <Text className="text-green-400 text-xs text-center mt-1">
          Best Score: {progress.bestScore}
        </Text>
      )}
    </View>
  ) : null;

  if (showUserModeSelector) {
    return (
      <View className="flex-1 bg-[#0f0f1a] items-center justify-center">
        {/* Animated background foods */}
        {floatingFoods.map((food, i) => (
          <FloatingFood 
            key={i} 
            emoji={food.emoji} 
            delay={i * 1000} 
            isAlly={food.isAlly}
          />
        ))}

        {/* Dark overlay */}
        <View className="absolute inset-0 bg-gradient-to-b from-purple-900/30 to-black/50" />

        {/* User Mode Selector */}
        <View className="items-center z-10 px-4">
          {/* Hero Title with Medieval Theme */}
          <View className="items-center mb-6">
            <Text className="text-6xl mb-3">👑</Text>
            <Text className="text-amber-400 text-4xl font-bold text-center">
              YOUR QUEST
            </Text>
            <Text className="text-white text-xl text-center mt-1">
              Choose Your Path to Mastery
            </Text>
            <Text className="text-purple-300 text-sm text-center mt-3">
              Each journey teaches valuable glucose management skills
            </Text>
          </View>

          {/* Enhanced Role Cards with Educational Previews */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ gap: 16, paddingHorizontal: 8 }} 
            className="mb-6"
          >
            {(Object.keys(USER_MODE_CONFIGS) as UserMode[]).map((mode) => {
              const config = USER_MODE_CONFIGS[mode];
              const roleData = {
                personal: { 
                  emblem: '🏰', 
                  color: 'border-red-400', 
                  bg: 'bg-red-600/20',
                  learningFocus: 'Self-management mastery'
                },
                caregiver: { 
                  emblem: '🛡️', 
                  color: 'border-blue-400', 
                  bg: 'bg-blue-600/20',
                  learningFocus: 'Support techniques'
                },
                curious: { 
                  emblem: '📜', 
                  color: 'border-purple-400', 
                  bg: 'bg-purple-600/20',
                  learningFocus: 'Comprehensive understanding'
                }
              }[mode];

              return (
                <TouchableOpacity
                  key={mode}
                  onPress={() => {
                    setSelectedRole(mode);
                    setUserMode(mode);
                    setShowUserModeSelector(false);
                    onUserModeSelected?.(mode);
                  }}
                  className={`w-64 h-72 rounded-2xl border-2 p-4 ${roleData.color} ${roleData.bg}`}
                >
                  {/* Role Emblem */}
                  <View className="items-center mb-3">
                    <Text className="text-5xl mb-2">{roleData.emblem}</Text>
                    <Text className="text-2xl">{config.icon}</Text>
                  </View>

                  {/* Role Title */}
                  <Text className={`text-xl font-bold text-center mb-2 ${mode === 'personal' ? 'text-red-300' : mode === 'caregiver' ? 'text-blue-300' : 'text-purple-300'}`}>
                    {config.name}
                  </Text>

                  {/* Description */}
                  <Text className="text-white text-sm text-center mb-3">
                    {config.description}
                  </Text>

                  {/* Learning Focus */}
                  <View className="bg-black/40 p-2 rounded-lg border border-white/20 mt-2">
                    <Text className="text-green-300 text-xs font-bold">LEARNING FOCUS:</Text>
                    <Text className="text-white text-xs mt-1">{roleData.learningFocus}</Text>
                  </View>

                  {/* CTA */}
                  <View className="mt-3 items-center">
                    <Text className="text-amber-300 text-sm font-bold">→ Choose This Path</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Educational Context */}
          <View style={{ width: maxWidth }} className="bg-black/60 p-4 rounded-xl border border-cyan-700 mb-4">
            <Text className="text-cyan-400 text-xs font-bold mb-2">💡 WHY CHOOSE A ROLE?</Text>
            <View className="flex-row items-start">
              <Text className="text-cyan-300 mr-2">•</Text>
              <Text className="text-white text-xs flex-1">
                Personalizes your educational journey and unlocks role-specific achievements
              </Text>
            </View>
            <View className="flex-row items-start mt-1">
              <Text className="text-cyan-300 mr-2">•</Text>
              <Text className="text-white text-xs flex-1">
                Tailors glucose management lessons to your needs and goals
              </Text>
            </View>
            <View className="flex-row items-start mt-1">
              <Text className="text-cyan-300 mr-2">•</Text>
              <Text className="text-white text-xs flex-1">
                Connects you with others on similar health journeys
              </Text>
            </View>
          </View>

          {/* Settings Note */}
          <Text style={{ width: maxWidth }} className="text-gray-500 text-xs text-center mb-4">
            🔧 You can explore other roles anytime in settings
          </Text>

          {/* Optional Onchain Badge (only show if wallet connected) */}
          {isConnected && (
            <View style={{ width: maxWidth }} className="bg-black/60 p-4 rounded-xl border border-amber-700">
              <Text className="text-amber-400 text-xs font-bold mb-2">🏅 OPTIONAL BADGE</Text>
              <Text className="text-white text-xs text-center mb-3">
                Mint your role as an onchain badge to carry through your journey
              </Text>
              <TouchableOpacity
                onPress={() => setShowMintModal(true)}
                className="px-4 py-2 rounded-lg border border-amber-400 bg-amber-600/20"
              >
                <Text className="text-amber-300 text-xs text-center">
                  {selectedRole ? 'Mint Selected Role' : 'Learn About Badges'}
                </Text>
              </TouchableOpacity>
              <Text className="text-gray-500 text-xs text-center mt-2">
                Completely optional - works without minting!
              </Text>
            </View>
          )}
        </View>

        {/* Onchain Badge Minting Modal */}
        <RoleBadgeModal
          visible={showMintModal}
          onClose={() => setShowMintModal(false)}
          role={selectedRole}
          userMode={progress.userMode}
          onMintSuccess={() => {
            setShowMintModal(false);
            // Role selection continues normally
          }}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0f0f1a] items-center justify-center">
      {/* Animated background foods */}
      {floatingFoods.map((food, i) => (
        <FloatingFood 
          key={i} 
          emoji={food.emoji} 
          delay={i * 1000} 
          isAlly={food.isAlly}
        />
      ))}

      {/* Dark overlay */}
      <View className="absolute inset-0 bg-gradient-to-b from-purple-900/30 to-black/50" />

      {/* Content */}
      <View className="items-center z-10 px-6">
        {/* Title */}
        <View className="items-center mb-6">
          <Text className="text-6xl mb-2">🏰</Text>
          <Text className="text-amber-400 text-4xl font-bold text-center tracking-wider">
            GLUCOSE
          </Text>
          <Text className="text-white text-4xl font-bold text-center tracking-wider">
            WARS
          </Text>
          <Text className="text-purple-300 text-base text-center italic mt-1">
            Defend Your Kingdom
          </Text>
        </View>

        {/* Wallet Connection Button (in content area) - cross-platform */}
        <View className="mb-6">
          <WalletConnectionButton />
        </View>

        {/* Progress Info (only for returning players) */}
        {progressInfo}

        {/* Privacy Controls */}
        <View style={{ width: maxWidth }} className="bg-black/60 p-3 rounded-xl border border-cyan-700 mb-4">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-cyan-400 text-xs font-bold mb-1">
                🔐 PRIVACY
              </Text>
              <PrivacyToggle
                currentMode={progress.privacyMode}
                onToggle={(mode) => {
                  setPrivacyMode(mode);
                }}
              />
            </View>
            <TouchableOpacity
              className="p-2 ml-2 active:bg-cyan-400/20 rounded"
              onPress={() => setShowPrivacySettings(true)}
              hitSlop={8}
            >
              <Text className="text-cyan-400 text-2xl">⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Control Mode Selector */}
        <View style={{ width: maxWidth }} className="bg-black/60 p-3 rounded-2xl border-2 border-purple-700 mb-4">
          <Text className="text-amber-400 text-xs font-bold text-center mb-2">
            🎮 CONTROLS
          </Text>
          
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setSelectedMode('swipe')}
              className={`flex-1 p-2 rounded-lg border ${
                selectedMode === 'swipe' 
                  ? 'bg-green-600/30 border-green-500' 
                  : 'bg-gray-800/50 border-gray-600'
              }`}
            >
              <Text className="text-xl text-center">👆</Text>
              <Text className={`text-center font-bold text-xs ${
                selectedMode === 'swipe' ? 'text-green-400' : 'text-gray-400'
              }`}>
                SWIPE
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedMode('tap')}
              className={`flex-1 p-2 rounded-lg border ${
                selectedMode === 'tap' 
                  ? 'bg-blue-600/30 border-blue-500' 
                  : 'bg-gray-800/50 border-gray-600'
              }`}
            >
              <Text className="text-xl text-center">🖱️</Text>
              <Text className={`text-center font-bold text-xs ${
                selectedMode === 'tap' ? 'text-blue-400' : 'text-gray-400'
              }`}>
                TAP
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick tips */}
        <View style={{ width: maxWidth }} className="bg-black/60 p-3 rounded-2xl border-2 border-amber-700 mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Text className="text-lg mr-1">👆</Text>
              <Text className="text-green-400 text-xs font-bold">RALLY</Text>
              <Text className="text-gray-400 text-xs ml-1">🥦🥕</Text>
            </View>
            <View className="flex-row items-center flex-1">
              <Text className="text-lg mr-1">👇</Text>
              <Text className="text-red-400 text-xs font-bold">BANISH</Text>
              <Text className="text-gray-400 text-xs ml-1">🍩🍔</Text>
            </View>
          </View>
        </View>

        {/* Start buttons - now with two options */}
        <View className="w-full max-w-[350px] space-y-3">
          {/* Quick Start button */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              onPress={() => onStartGame(selectedMode)}
              className={`px-6 py-4 rounded-2xl border-4 bg-green-600 border-green-400 w-full`}
              style={{
                shadowColor: '#10b981',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 20,
                elevation: 10,
              }}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center justify-center">
                <Text className="text-2xl mr-2">⚡</Text>
                <Text className="text-white text-base font-bold">
                  QUICK START
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Game Selection button */}
          <TouchableOpacity
            onPress={() => onSelectGame?.()}
            className={`px-6 py-4 rounded-2xl border-4 bg-amber-600 border-amber-400 w-full`}
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
              <Text className="text-2xl mr-2">🎮</Text>
              <Text className="text-white text-base font-bold">
                SELECT GAME MODE
              </Text>
            </View>
          </TouchableOpacity>

          {/* Stats button */}
          {onViewStats && (
            <TouchableOpacity
              onPress={() => onViewStats?.()}
              className="px-6 py-3 rounded-2xl border-2 border-purple-500 bg-purple-600/20 mt-3"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-center">
                <Text className="text-xl mr-2">📊</Text>
                <Text className="text-purple-300 text-sm font-bold">YOUR STATS</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Tip */}
        <View className="mt-3 px-4">
          <Text className="text-purple-400 text-xs text-center">
            💡 Chain correct actions for COMBO bonuses!
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View className="absolute bottom-4">
        <Text className="text-gray-600 text-xs text-center">
          A 60-Second Medieval Battle
        </Text>
      </View>

      {/* Privacy Settings Modal */}
      <PrivacySettingsModal
        settings={progress.privacySettings || {
          mode: 'standard',
          encryptHealthData: false,
          glucoseLevels: 'public',
          insulinDoses: 'public',
          achievements: 'public',
          gameStats: 'public',
          healthProfile: 'public',
        }}
        onSave={(settings) => {
          updatePrivacySettings(settings);
          setShowPrivacySettings(false);
        }}
        onClose={() => setShowPrivacySettings(false)}
        visible={showPrivacySettings}
      />
    </View>
  );
};

// Cross-platform wallet connection button
const WalletConnectionButton = () => {
  const { isConnected, address, connectWallet, disconnectWallet } = useWeb3();

  if (isConnected && address) {
    // Show connected state with truncated address
    const truncatedAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;

    return (
      <TouchableOpacity
        className="bg-purple-600 px-3 py-2 rounded-full min-h-[36px] justify-center min-w-[100px]"
        onPress={disconnectWallet}
        activeOpacity={0.7}
      >
        <Text className="text-white text-xs font-bold truncate text-center">
          {truncatedAddress}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      className="bg-amber-600 px-3 py-2 rounded-full min-h-[36px] justify-center min-w-[80px]"
      onPress={connectWallet}
      activeOpacity={0.7}
    >
      <Text className="text-white font-bold text-xs text-center">
        {Platform.OS === 'web' ? 'Connect' : 'Wallet'}
      </Text>
    </TouchableOpacity>
  );
};