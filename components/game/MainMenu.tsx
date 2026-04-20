import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Platform, ScrollView, Modal, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ControlMode, UserMode } from '@/types/game';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
import { USER_MODE_CONFIGS } from '@/constants/userModes';
import { PrivacyToggle } from '@/components/PrivacyToggle';
import { PrivacySettingsModal } from '@/components/PrivacySettings';
import { useWeb3 } from '@/context/Web3Context';
import { useBeam } from '@/context/BeamContext';
import { RoleBadgeModal } from '@/components/game/RoleBadgeModal';
import { COLORS, ANIMATIONS } from '@/constants/designSystem';
import { createPulseAnimation, createGlowAnimation, createFloatingAnimation } from '@/utils/animations';
import { ProgressIndicator } from '@/components/game/ProgressIndicator';
import { DailyQuests } from '@/components/game/DailyQuests';
import { GrandLibrary } from '@/components/game/GrandLibrary';
import { BeamAssets } from '@/components/game/BeamAssets';
import { track } from '@/utils/analytics';
import { useCGMConnection } from '@/hooks/useCGMConnection';
import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';

const maxWidth = 400;

const FloatingFood: React.FC<{ emoji: string; delay: number; isAlly: boolean }> = ({ emoji, delay, isAlly }) => {
  const { width: screenWidth } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(Math.random() * (screenWidth || 400))).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;

    const startAnimation = () => {
      if (!mounted) return;
      createFloatingAnimation(translateY, {
        duration: 8000,
        distance: 600,
        delay: delay,
      }).start(() => { if (mounted) startAnimation(); });
      
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

    return () => {
      mounted = false;
      translateY.stopAnimation();
      opacity.stopAnimation();
    };
  }, [delay, opacity, screenWidth, translateX, translateY]);

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
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [selectedMode, setSelectedMode] = useState<ControlMode>('swipe');
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showTutorialSettings, setShowTutorialSettings] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const { progress, setUserMode, setPrivacyMode, updatePrivacySettings, setSkipOnboarding, getKingdomTitle, discoverLore } = usePlayerProgressContext();
  /* eslint-enable @typescript-eslint/no-unused-vars */
  const kingdomTitle = getKingdomTitle();
  const [showUserModeSelector, setShowUserModeSelector] = useState(userModeSelected === false);
  const [selectedRole, setSelectedRole] = useState<UserMode | null>(null);
  const [showMintModal, setShowMintModal] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showTreasury, setShowTreasury] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCGMDisclaimer, setShowCGMDisclaimer] = useState(false);
  const cgm = useCGMConnection();
  const { isConnected, address, connectWallet, disconnectWallet } = useWeb3();
  const beamContext = useBeam();
  const playerAccount = beamContext?.playerAccount;
  const showSyncFeedback = beamContext?.showSyncFeedback;
  const [showWelcome, setShowWelcome] = useState(false);
  const welcomeAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (showUserModeSelector) {
      track('user_mode_selector_shown', { privacy_mode: progress.privacyMode });
    }
  }, [showUserModeSelector, progress.privacyMode]);

  useEffect(() => {
    if (playerAccount && !showWelcome) {
      setShowWelcome(true);
      Animated.sequence([
        Animated.timing(welcomeAnim, { toValue: 50, duration: 500, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(welcomeAnim, { toValue: -100, duration: 500, useNativeDriver: true }),
      ]).start(() => setShowWelcome(false));
    }
  }, [playerAccount, showWelcome, welcomeAnim]);

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
  }, [glowAnim, pulseAnim]);

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
    // Real streak: consecutive days played (approximate via lastPlayedAt)
    const daysSinceLastPlay = progress.lastPlayedAt
      ? Math.floor((Date.now() - progress.lastPlayedAt) / 86400000)
      : 999;
    if (daysSinceLastPlay <= 1) {
      return { streak: progress.gamesPlayed, emoji: '🔥', message: 'On fire!' };
    }
    return { streak: 1, emoji: '🔥', message: 'Welcome back!' };
  };

  const isNewUser = progress.gamesPlayed === 0;

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
            <Text className="text-amber-400 text-3xl font-bold text-center">
              HOW DO YOU PLAY?
            </Text>
          </View>

          <View style={{ gap: 12, paddingHorizontal: 16, maxWidth: 400, alignSelf: 'center', width: '100%' }}>
            {(Object.keys(USER_MODE_CONFIGS) as UserMode[]).map((mode) => {
              const config = USER_MODE_CONFIGS[mode];
              const roleData = {
                personal: { 
                  emblem: '🛡️', 
                  color: 'border-amber-400', 
                  bg: 'bg-amber-600/20',
                  learningFocus: 'Personal mastery'
                },
                caregiver: { 
                  emblem: '🏰', 
                  color: 'border-cyan-400', 
                  bg: 'bg-cyan-600/20',
                  learningFocus: 'Realm-wide protection'
                },
                curious: { 
                  emblem: '🧪', 
                  color: 'border-emerald-400', 
                  bg: 'bg-emerald-600/20',
                  learningFocus: 'Universal wisdom'
                }
              }[mode];

              return (
                <TouchableOpacity
                  key={mode}
                  onPress={() => {
                    setSelectedRole(mode);
                    setUserMode(mode);
                    setShowUserModeSelector(false);
                    track('user_mode_selected', { user_mode: mode, privacy_mode: progress.privacyMode });
                    onUserModeSelected?.(mode);
                  }}
                  accessibilityLabel={`${config.name} role. ${config.description}`}
                  accessibilityRole="button"
                  style={{
                    flexDirection: 'row', alignItems: 'center', padding: 16,
                    borderRadius: 16, borderWidth: 2,
                    borderColor: mode === 'personal' ? '#f59e0b' : mode === 'caregiver' ? '#22d3ee' : '#34d399',
                    backgroundColor: mode === 'personal' ? 'rgba(245,158,11,0.1)' : mode === 'caregiver' ? 'rgba(34,211,238,0.1)' : 'rgba(52,211,153,0.1)',
                  }}
                >
                  <Text style={{ fontSize: 36, marginRight: 14 }}>{roleData.emblem}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: mode === 'personal' ? '#fcd34d' : mode === 'caregiver' ? '#67e8f9' : '#6ee7b7' }}>
                      {config.name}
                    </Text>
                    <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>{config.subtitle}</Text>
                  </View>
                  <Text style={{ color: '#6b7280', fontSize: 18 }}>→</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="items-center">
            <Text style={{ width: maxWidth }} className="text-gray-500 text-xs text-center mb-4">
              🔧 You can change your role anytime
            </Text>
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
      {/* Welcome Toast */}
      {showWelcome && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 20,
            right: 20,
            backgroundColor: 'rgba(88, 28, 135, 0.95)',
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#a78bfa',
            zIndex: 100,
            flexDirection: 'row',
            alignItems: 'center',
            transform: [{ translateY: welcomeAnim }],
            shadowColor: '#a78bfa',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.5,
            shadowRadius: 10,
          }}
        >
          <Text style={{ fontSize: 24, marginRight: 12 }}>👑</Text>
          <View>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Welcome back, Hero!</Text>
            <Text style={{ color: '#c4b5fd', fontSize: 12 }}>Your Kingdom progress is secured.</Text>
          </View>
        </Animated.View>
      )}

      {/* Kingdom Renown Header */}
      <View style={{ width: '100%', paddingTop: 48, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View 
            style={{ 
              backgroundColor: 'rgba(217, 119, 6, 0.2)', 
              padding: 8, 
              borderRadius: 20, 
              borderWidth: 1, 
              borderColor: showSyncFeedback ? '#a78bfa' : 'rgba(245, 158, 11, 0.3)', 
              marginRight: 12,
              shadowColor: '#a78bfa',
              shadowRadius: showSyncFeedback ? 15 : 0,
              shadowOpacity: showSyncFeedback ? 1 : 0,
            }}
          >
            <Text style={{ fontSize: 20 }}>{kingdomTitle.icon}</Text>
            {showSyncFeedback && (
              <View 
                style={{ 
                  position: 'absolute', 
                  top: -2, 
                  right: -2, 
                  width: 8, 
                  height: 8, 
                  borderRadius: 4, 
                  backgroundColor: '#a78bfa' 
                }} 
              />
            )}
          </View>
          <View>
            <Text style={{ color: '#f59e0b', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' }}>{kingdomTitle.title}</Text>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>{progress.kingdomRenown} RENOWN</Text>
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => setShowTreasury(true)}
          accessibilityLabel="Open Royal Treasury"
          accessibilityRole="button"
          style={{ backgroundColor: 'rgba(88, 28, 135, 0.4)', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(167, 139, 250, 0.3)' }}
        >
          <Ionicons name="trophy-outline" size={20} color="#a78bfa" />
        </TouchableOpacity>
      </View>

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

         {!isNewUser && progress.gamesPlayed > 0 && (
           <View style={{ width: maxWidth }} className="bg-gradient-to-r from-orange-600/30 to-red-600/20 p-4 rounded-xl border-2 border-orange-500 mb-6 items-center">
             <View className="flex-row items-center justify-center gap-2 mb-2">
               <Text className="text-3xl animate-bounce">{streakStatus.emoji}</Text>
               <Text className="text-white text-2xl font-bold">{streakStatus.streak}</Text>
               <Text className="text-orange-300 text-sm font-bold">GAME STREAK</Text>
             </View>
             <Text className="text-orange-200 text-xs">{streakStatus.message} 🎯</Text>
           </View>
         )}

         {!isNewUser && (
           <View className="mb-4">
             <BeamWalletButton 
               isConnected={isConnected}
               address={address}
               connectWallet={connectWallet}
               disconnectWallet={disconnectWallet}
             />
           </View>
         )}

        {/* ═══ ACTION BUTTONS — front and center ═══ */}
        <View style={{ width: maxWidth }} className="space-y-3 mb-6">
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              onPress={() => onStartGame(selectedMode)}
              activeOpacity={0.7}
              accessibilityLabel="Quick start game"
              accessibilityRole="button"
              style={{
                backgroundColor: '#16a34a', borderWidth: 3, borderColor: '#22c55e',
                paddingVertical: 18, borderRadius: 16, width: '100%',
                shadowColor: '#22c55e', shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.9, shadowRadius: 25, elevation: 15,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 22, marginRight: 8 }}>⚡</Text>
                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>DEFEND THE REALM</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {!isNewUser && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => onSelectGame?.()}
              accessibilityLabel="Customize battle" accessibilityRole="button"
              style={{ flex: 1, backgroundColor: 'rgba(217,119,6,0.3)', borderWidth: 2, borderColor: '#f59e0b', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 16 }}>🎮</Text>
              <Text style={{ color: '#fde68a', fontSize: 10, fontWeight: 'bold', marginTop: 2 }}>CUSTOMIZE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { track('challenge_hub_viewed', { source: 'main_menu' }); router.push('/challenge' as any); }}
              accessibilityLabel="Open challenges" accessibilityRole="button"
              style={{ flex: 1, backgroundColor: 'rgba(139,92,246,0.2)', borderWidth: 2, borderColor: '#a78bfa', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 16 }}>🧩</Text>
              <Text style={{ color: '#c4b5fd', fontSize: 10, fontWeight: 'bold', marginTop: 2 }}>CHALLENGES</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowLibrary(true)}
              accessibilityLabel="Open Grand Library" accessibilityRole="button"
              style={{ flex: 1, backgroundColor: 'rgba(59,130,246,0.2)', borderWidth: 2, borderColor: '#3b82f6', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 16 }}>📜</Text>
              <Text style={{ color: '#93c5fd', fontSize: 10, fontWeight: 'bold', marginTop: 2 }}>LIBRARY</Text>
            </TouchableOpacity>
          </View>
          )}
        </View>

        {!isNewUser && (
          <>
            <WeeklyCountdown />
            {progressInfo}
            <View style={{ width: maxWidth }} className="mt-4">
              <DailyQuests 
                quests={progress.dailyQuests} 
                renown={progress.kingdomRenown} 
           />
         </View>
          </>
        )}

        {/* ═══ COLLAPSIBLE SETTINGS ═══ */}
        {!isNewUser && (<>
        <TouchableOpacity
          onPress={() => setShowSettings(!showSettings)}
          style={{ width: maxWidth, marginTop: 12, marginBottom: 4 }}
          accessibilityLabel={`${showSettings ? 'Hide' : 'Show'} settings`}
          accessibilityRole="button"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#6b7280', fontSize: 12 }}>⚙️ Settings {showSettings ? '▲' : '▼'}</Text>
          </View>
        </TouchableOpacity>

        {showSettings && (
          <>
        <View style={{ width: maxWidth }} className="bg-black/60 p-3 rounded-xl border border-cyan-700 mb-3">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-cyan-400 text-xs font-bold mb-1">🔐 PRIVACY</Text>
              <PrivacyToggle currentMode={progress.privacyMode} onToggle={(mode) => setPrivacyMode(mode)} />
            </View>
            <TouchableOpacity className="p-2 ml-2" onPress={() => setShowPrivacySettings(true)} accessibilityLabel="Open privacy settings" accessibilityRole="button">
              <Text className="text-cyan-400 text-2xl">⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ width: maxWidth }} className="bg-black/60 p-3 rounded-xl border border-purple-700 mb-3">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-purple-400 text-xs font-bold mb-1">📚 TUTORIAL</Text>
              <TouchableOpacity
                onPress={() => setSkipOnboarding(!progress.skipOnboarding)}
                accessibilityLabel={`Tutorial ${progress.skipOnboarding ? 'disabled' : 'enabled'}`}
                accessibilityRole="switch"
                className="flex-row items-center gap-2"
              >
                <View className={`w-10 h-5 rounded-full p-1 ${progress.skipOnboarding ? 'bg-red-600' : 'bg-green-600'}`}>
                  <View className={`w-3 h-3 rounded-full bg-white ${progress.skipOnboarding ? 'ml-5' : 'ml-0'}`} />
                </View>
                <Text className="text-white text-xs">{progress.skipOnboarding ? 'Skip Tutorial' : 'Show Tutorial'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ width: maxWidth }} className="bg-black/60 p-3 rounded-xl border border-purple-700 mb-3">
          <Text className="text-amber-400 text-xs font-bold text-center mb-2">🎮 CONTROLS</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={() => setSelectedMode('swipe')} accessibilityLabel={`Swipe controls${selectedMode === 'swipe' ? ', selected' : ''}`} accessibilityRole="radio" accessibilityState={{ selected: selectedMode === 'swipe' }} className={`flex-1 p-2 rounded-lg border ${selectedMode === 'swipe' ? 'bg-green-600/30 border-green-500' : 'bg-gray-800/50 border-gray-600'}`}>
              <Text className="text-xl text-center">👆</Text>
              <Text className={`text-center font-bold text-xs ${selectedMode === 'swipe' ? 'text-green-400' : 'text-gray-400'}`}>SWIPE</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedMode('tap')} accessibilityLabel={`Tap controls${selectedMode === 'tap' ? ', selected' : ''}`} accessibilityRole="radio" accessibilityState={{ selected: selectedMode === 'tap' }} className={`flex-1 p-2 rounded-lg border ${selectedMode === 'tap' ? 'bg-blue-600/30 border-blue-500' : 'bg-gray-800/50 border-gray-600'}`}>
              <Text className="text-xl text-center">🖱️</Text>
              <Text className={`text-center font-bold text-xs ${selectedMode === 'tap' ? 'text-blue-400' : 'text-gray-400'}`}>TAP</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CGM Connection */}
        <View style={{ width: maxWidth }} className="bg-black/60 p-3 rounded-xl border border-blue-700 mb-3">
          <Text style={{ color: '#60a5fa', fontSize: 11, fontWeight: 'bold', marginBottom: 6 }}>📡 CGM DEVICE</Text>
          {cgm.connection.isConnected ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: '#22c55e', fontSize: 12, fontWeight: 'bold' }}>
                  ✓ {cgm.connection.provider === 'libre' ? 'Apple Health' : 'Dexcom'} Connected
                </Text>
                {cgm.latestReading && (
                  <Text style={{ color: '#9ca3af', fontSize: 10 }}>Latest: {cgm.latestReading.value} mg/dL {cgm.latestReading.trendArrow}</Text>
                )}
              </View>
              <TouchableOpacity onPress={cgm.disconnect} accessibilityLabel="Disconnect CGM" accessibilityRole="button">
                <Text style={{ color: '#ef4444', fontSize: 11 }}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 6 }}>
              <TouchableOpacity
                onPress={() => setShowCGMDisclaimer(true)}
                style={{ backgroundColor: 'rgba(59,130,246,0.2)', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#3b82f6' }}
                accessibilityLabel="Connect Dexcom CGM" accessibilityRole="button"
              >
                <Text style={{ color: '#93c5fd', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>Connect Dexcom</Text>
              </TouchableOpacity>
              {cgm.healthKitAvailable && (
                <TouchableOpacity
                  onPress={() => cgm.connect('libre')}
                  style={{ backgroundColor: 'rgba(239,68,68,0.15)', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#f87171' }}
                  accessibilityLabel="Connect via Apple Health" accessibilityRole="button"
                >
                  <Text style={{ color: '#fca5a5', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>Connect via Apple Health</Text>
                </TouchableOpacity>
              )}
              <Text style={{ color: '#6b7280', fontSize: 9, textAlign: 'center' }}>See real glucose on results screen</Text>
            </View>
          )}
        </View>
          </>
        )}
        </>)}

        <View style={{ marginTop: 12 }}>
          <Text style={{ color: '#6b7280', fontSize: 11, textAlign: 'center' }}>
            {isNewUser ? '🏰 Swipe to rally allies and banish the Sugar Horde!' : '💡 Chain correct actions for COMBO bonuses!'}
          </Text>
        </View>
      </ScrollView>

      {/* CGM Disclaimer Modal */}
      <Modal visible={showCGMDisclaimer} transparent animationType="fade" onRequestClose={() => setShowCGMDisclaimer(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <MedicalDisclaimer
            onAccept={() => { setShowCGMDisclaimer(false); cgm.connect(); }}
            onDecline={() => setShowCGMDisclaimer(false)}
          />
        </View>
      </Modal>

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

      <Modal
        visible={showLibrary}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowLibrary(false)}
      >
        <GrandLibrary 
          discoveredLoreIds={progress.discoveredLoreIds}
          onClose={() => setShowLibrary(false)}
        />
      </Modal>

      <Modal
        visible={showTreasury}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTreasury(false)}
      >
        <View className="flex-1 justify-end">
          <BeamAssets onClose={() => setShowTreasury(false)} />
        </View>
      </Modal>
    </View>
  );
};

const BeamWalletButton: React.FC<{
  isConnected: boolean;
  address: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}> = ({ isConnected, address, connectWallet, disconnectWallet }) => {
  const beamContext = useBeam();
  const playerAccount = beamContext?.playerAccount;
  const login = beamContext?.login;
  const logout = beamContext?.logout;
  const isLoading = beamContext?.isLoading;

  if (playerAccount) {
    const truncatedAddress = `${playerAccount.address.substring(0, 6)}...${playerAccount.address.substring(playerAccount.address.length - 4)}`;
    return (
      <View className="flex-row gap-2">
        <TouchableOpacity
          className="bg-purple-600 px-4 py-2 rounded-full min-h-[36px] justify-center"
          onPress={logout}
          disabled={isLoading}
        >
          <Text className="text-white text-xs font-bold text-center">
            {truncatedAddress} (Beam)
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

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
    <View className="flex-row gap-2">
      <TouchableOpacity
        className="bg-amber-600 px-4 py-2 rounded-full min-h-[36px] justify-center"
        onPress={connectWallet}
        accessibilityLabel="Connect crypto wallet"
        accessibilityRole="button"
      >
        <Text className="text-white font-bold text-xs text-center">
          {Platform.OS === 'web' ? 'Connect Wallet' : 'Wallet'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        className="bg-blue-600 px-4 py-2 rounded-full min-h-[36px] justify-center border border-blue-400"
        onPress={() => {
          if (login) login();
          // Tooltip explanation - logic to show it would be here
        }}
        disabled={isLoading}
        accessibilityLabel="Sign in with social account"
        accessibilityRole="button"
      >
        <Text className="text-white font-bold text-xs text-center">
          {isLoading ? '...' : 'Play with Social'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// #14: Weekly challenge countdown
const WeeklyCountdown: React.FC = () => {
  const now = new Date();
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + ((8 - now.getDay()) % 7 || 7));
  nextMonday.setHours(0, 0, 0, 0);
  const diff = nextMonday.getTime() - now.getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);

  return (
    <View style={{ width: 350, marginTop: 8, marginBottom: 4, alignSelf: 'center' }}>
      <Text style={{ color: '#6b7280', fontSize: 10, textAlign: 'center' }}>
        🧪 Weekly Challenge resets in {days}d {hours}h
      </Text>
    </View>
  );
};

interface MainMenuProps {
  onStartGame: (controlMode: ControlMode) => void;
  onSelectGame: () => void;
  onUserModeSelected?: (mode: string) => void;
  userModeSelected?: boolean;
  onViewStats?: () => void;
}
