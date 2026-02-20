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
import { COLORS, SPACING, ANIMATIONS } from '@/constants/designSystem';
import { createPulseAnimation, createGlowAnimation, createFloatingAnimation } from '@/utils/animations';
import { ProgressIndicator } from '@/components/game/ProgressIndicator';

const { width, height } = Dimensions.get('window');
const screenWidth = width;
const maxWidth = Math.min(screenWidth * 0.9, 400);

const FloatingFood: React.FC<{ emoji: string; delay: number; isAlly: boolean }> = ({ emoji, delay, isAlly }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(Math.random() * screenWidth)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      createFloatingAnimation(translateY, {
        duration: 8000,
        distance: 600,
        delay: delay,
      }).start(() => startAnimation());
      
      opacity.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 0.6, duration: 500, useNativeDriver: true }),
        Animated.delay(7000),
        Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
      
      translateX.setValue(40 + Math.random() * (screenWidth - 80));
    };

    startAnimation();
  }, []);

  const borderColor = isAlly ? COLORS.ALLY : COLORS.ENEMY;
  const bgColor = isAlly ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';

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
          borderColor,
          backgroundColor: bgColor,
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
  const [showTutorialSettings, setShowTutorialSettings] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const { progress, setUserMode, setPrivacyMode, updatePrivacySettings, setSkipOnboarding } = usePlayerProgress();
  const [showUserModeSelector, setShowUserModeSelector] = useState(userModeSelected === false);
  const [selectedRole, setSelectedRole] = useState<UserMode | null>(null);
  const [showMintModal, setShowMintModal] = useState(false);
  const { isConnected } = useWeb3();

  useEffect(() => {
    // Pulse animation for start button
    createPulseAnimation(pulseAnim, {
      duration: ANIMATIONS.DURATION.SLOWER,
      minScale: 1,
      maxScale: 1.05,
    }).start();

    // Glow animation
    createGlowAnimation(glowAnim, {
      duration: ANIMATIONS.DURATION.SLOWEST,
      minOpacity: 0,
      maxOpacity: 1,
    }).start();
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

  const getStreakStatus = () => {
    if (progress.gamesPlayed === 0) return { streak: 0, emoji: '🔥', message: 'Start your journey' };
    if (progress.gamesPlayed < 3) return { streak: progress.gamesPlayed, emoji: '🔥', message: 'Gaining momentum' };
    return { streak: Math.floor(progress.gamesPlayed / 2), emoji: '🔥', message: 'On a roll!' };
  };

  const streakStatus = getStreakStatus();

  const progressInfo = (
    <ProgressIndicator 
      currentTier={progress.currentTier || 'tier1'}
      unlockedTiers={[...(['tier1'] as const), ...(progress.maxTierUnlocked !== 'tier1' ? [progress.maxTierUnlocked] : [])]}
      variant="detailed"
      showLabel={true}
    />
  );

  if (showUserModeSelector) {
    return (
      <View className="flex-1" style={{ backgroundColor: COLORS.BG_DARK }}>
        {floatingFoods.map((food, i) => (
          <FloatingFood 
            key={i} 
            emoji={food.emoji} 
            delay={i * 1000} 
            isAlly={food.isAlly}
          />
        ))}

        <View className="absolute inset-0 bg-gradient-to-b from-purple-900/30 to-black/50" />

        <ScrollView 
          className="flex-1 z-10" 
          contentContainerStyle={{ paddingVertical: 24, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center mb-6">
            <Text className="text-6xl mb-3">👑</Text>
            <Text className="text-amber-400 text-4xl font-bold text-center">
              YOUR QUEST
            </Text>
            <Text className="text-white text-xl text-center mt-1">
              Choose Your Path to Mastery
            </Text>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ gap: 16, paddingHorizontal: 8 }} 
            className="mb-6 h-80"
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
                  <View className="items-center mb-3">
                    <Text className="text-5xl mb-2">{roleData.emblem}</Text>
                    <Text className="text-2xl">{config.icon}</Text>
                  </View>

                  <Text className={`text-xl font-bold text-center mb-2 ${mode === 'personal' ? 'text-red-300' : mode === 'caregiver' ? 'text-blue-300' : 'text-purple-300'}`}>
                    {config.name}
                  </Text>

                  <Text className="text-white text-sm text-center mb-3">
                    {config.description}
                  </Text>

                  <View className="bg-black/40 p-2 rounded-lg border border-white/20 mt-2">
                    <Text className="text-green-300 text-xs font-bold">LEARNING FOCUS:</Text>
                    <Text className="text-white text-xs mt-1">{roleData.learningFocus}</Text>
                  </View>

                  <View className="mt-3 items-center">
                    <Text className="text-amber-300 text-sm font-bold">→ Choose This Path</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View className="items-center">
            <View style={{ width: maxWidth }} className="bg-black/60 p-4 rounded-xl border border-cyan-700 mb-4">
              <Text className="text-cyan-400 text-xs font-bold mb-2">💡 WHY CHOOSE A ROLE?</Text>
              <Text className="text-white text-xs mb-1">• Personalizes your educational journey</Text>
              <Text className="text-white text-xs mb-1">• Tailors glucose management lessons</Text>
              <Text className="text-white text-xs">• Connects you with others on similar journeys</Text>
            </View>

            <Text style={{ width: maxWidth }} className="text-gray-500 text-xs text-center mb-4">
              🔧 You can explore other roles anytime in settings
            </Text>

            {isConnected && (
              <View style={{ width: maxWidth }} className="bg-black/60 p-4 rounded-xl border border-amber-700">
                <Text className="text-amber-400 text-xs font-bold mb-2">🏅 OPTIONAL BADGE</Text>
                <TouchableOpacity
                  onPress={() => setShowMintModal(true)}
                  className="px-4 py-2 rounded-lg border border-amber-400 bg-amber-600/20"
                >
                  <Text className="text-amber-300 text-xs text-center">
                    {selectedRole ? 'Mint Selected Role' : 'Learn About Badges'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        <RoleBadgeModal
          visible={showMintModal}
          onClose={() => setShowMintModal(false)}
          role={selectedRole}
          userMode={progress.userMode}
          onMintSuccess={() => setShowMintModal(false)}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: COLORS.BG_DARK }}>
      {floatingFoods.map((food, i) => (
        <FloatingFood 
          key={i} 
          emoji={food.emoji} 
          delay={i * 1000} 
          isAlly={food.isAlly}
        />
      ))}

      <View className="absolute inset-0 bg-gradient-to-b from-purple-900/30 to-black/50" />

      <ScrollView 
        className="flex-1 z-10 w-full" 
        contentContainerStyle={{ alignItems: 'center', paddingVertical: 48 }}
      >
         <View className="items-center mb-6">
           <Text className="text-6xl mb-2">🏰</Text>
           <Text className="text-amber-400 text-4xl font-bold text-center tracking-wider">GLUCOSE</Text>
           <Text className="text-white text-4xl font-bold text-center tracking-wider">WARS</Text>
           <Text className="text-purple-300 text-base text-center italic mt-1">Defend Your Kingdom</Text>
         </View>

         {progress.gamesPlayed > 0 && (
           <View style={{ width: maxWidth }} className="bg-gradient-to-r from-orange-600/30 to-red-600/20 p-4 rounded-xl border-2 border-orange-500 mb-6 items-center">
             <View className="flex-row items-center justify-center gap-2 mb-2">
               <Text className="text-3xl animate-bounce">{streakStatus.emoji}</Text>
               <Text className="text-white text-2xl font-bold">{streakStatus.streak}</Text>
               <Text className="text-orange-300 text-sm font-bold">GAME STREAK</Text>
             </View>
             <Text className="text-orange-200 text-xs">{streakStatus.message} 🎯</Text>
           </View>
         )}

         <View className="mb-6">
           <WalletConnectionButton />
         </View>

         {progressInfo}

        <View style={{ width: maxWidth }} className="bg-black/60 p-3 rounded-xl border border-cyan-700 mb-4 mt-6">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-cyan-400 text-xs font-bold mb-1">🔐 PRIVACY</Text>
              <PrivacyToggle
                currentMode={progress.privacyMode}
                onToggle={(mode) => setPrivacyMode(mode)}
              />
            </View>
            <TouchableOpacity
              className="p-2 ml-2 active:bg-cyan-400/20 rounded"
              onPress={() => setShowPrivacySettings(true)}
            >
              <Text className="text-cyan-400 text-2xl">⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tutorial Toggle */}
        <View style={{ width: maxWidth }} className="bg-black/60 p-3 rounded-xl border border-purple-700 mb-4">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-purple-400 text-xs font-bold mb-1">📚 TUTORIAL</Text>
              <TouchableOpacity
                onPress={() => {
                  // Toggle tutorial: if currently skipped, show tutorial; if not skipped, skip it
                  if (progress.skipOnboarding) {
                    setSkipOnboarding(false);
                  } else {
                    setSkipOnboarding(true);
                  }
                }}
                className={`flex-row items-center gap-2`}
              >
                <View className={`w-10 h-5 rounded-full p-1 ${progress.skipOnboarding ? 'bg-red-600' : 'bg-green-600'}`}>
                  <View className={`w-3 h-3 rounded-full bg-white ${progress.skipOnboarding ? 'ml-5' : 'ml-0'}`} />
                </View>
                <Text className="text-white text-xs">
                  {progress.skipOnboarding ? 'Skip Tutorial' : 'Show Tutorial'}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              className="p-2 ml-2 active:bg-purple-400/20 rounded"
              onPress={() => setShowTutorialSettings(true)}
            >
              <Text className="text-purple-400 text-2xl">ℹ️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ width: maxWidth }} className="bg-black/60 p-3 rounded-2xl border-2 border-purple-700 mb-4">
          <Text className="text-amber-400 text-xs font-bold text-center mb-2">🎮 CONTROLS</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setSelectedMode('swipe')}
              className={`flex-1 p-2 rounded-lg border ${selectedMode === 'swipe' ? 'bg-green-600/30 border-green-500' : 'bg-gray-800/50 border-gray-600'}`}
            >
              <Text className="text-xl text-center">👆</Text>
              <Text className={`text-center font-bold text-xs ${selectedMode === 'swipe' ? 'text-green-400' : 'text-gray-400'}`}>SWIPE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedMode('tap')}
              className={`flex-1 p-2 rounded-lg border ${selectedMode === 'tap' ? 'bg-blue-600/30 border-blue-500' : 'bg-gray-800/50 border-gray-600'}`}
            >
              <Text className="text-xl text-center">🖱️</Text>
              <Text className={`text-center font-bold text-xs ${selectedMode === 'tap' ? 'text-blue-400' : 'text-gray-400'}`}>TAP</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="w-full max-w-[350px] space-y-3 mt-4">
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              onPress={() => onStartGame(selectedMode)}
              className="px-6 py-5 rounded-2xl border-4 bg-green-600 border-green-400 w-full"
              style={{
                shadowColor: '#22c55e',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.9,
                shadowRadius: 25,
                elevation: 15,
              }}
            >
              <View className="flex-row items-center justify-center">
                <Text className="text-2xl mr-2">⚡</Text>
                <Text className="text-white text-base font-bold">QUICK START</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            onPress={() => onSelectGame?.()}
            className="px-6 py-4 rounded-2xl border-4 bg-amber-600 border-amber-400 w-full mt-3"
            style={{
              shadowColor: COLORS.ZONES.warningHigh,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.7,
              shadowRadius: 15,
              elevation: 8,
            }}
          >
            <View className="flex-row items-center justify-center">
              <Text className="text-2xl mr-2">🎮</Text>
              <Text className="text-white text-base font-bold">CUSTOMIZE BATTLE</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className="mt-6">
          <Text className="text-purple-400 text-xs text-center">💡 Chain correct actions for COMBO bonuses!</Text>
        </View>
      </ScrollView>

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

const WalletConnectionButton = () => {
  const { isConnected, address, connectWallet, disconnectWallet } = useWeb3();

  if (isConnected && address) {
    const truncatedAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    return (
      <TouchableOpacity
        className="bg-purple-600 px-3 py-2 rounded-full min-h-[36px] justify-center min-w-[100px]"
        onPress={disconnectWallet}
      >
        <Text className="text-white text-xs font-bold text-center">{truncatedAddress}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      className="bg-amber-600 px-3 py-2 rounded-full min-h-[36px] justify-center min-w-[80px]"
      onPress={connectWallet}
    >
      <Text className="text-white font-bold text-xs text-center">
        {Platform.OS === 'web' ? 'Connect' : 'Wallet'}
      </Text>
    </TouchableOpacity>
  );
};

interface MainMenuProps {
  onStartGame: (controlMode: ControlMode) => void;
  onSelectGame: () => void;
  onUserModeSelected?: (mode: string) => void;
  userModeSelected?: boolean;
  onViewStats?: () => void;
}
