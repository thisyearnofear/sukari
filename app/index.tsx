import React from 'react';
import { View, Text, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MainMenu } from '@/components/game/MainMenu';
import { HeroIntro } from '@/components/game/HeroIntro';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
import { ControlMode } from '@/types/game';
import { track } from '@/utils/analytics';

// #19: Time-of-day ambient tint
function getAmbientColor(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) return '#1a150a';   // warm morning
  if (hour >= 10 && hour < 16) return '#0a0a12';  // neutral day
  if (hour >= 16 && hour < 20) return '#12080a';  // warm evening
  return '#0a0a14';                                 // cool night
}

export default function MenuScreen() {
  const router = useRouter();
  const { progress, hydrated } = usePlayerProgressContext();
  const [showIntro, setShowIntro] = React.useState(false);

  React.useEffect(() => {
    if (!hydrated) return;
    // Show intro only on very first visit (no games played, no mode selected)
    if (progress.gamesPlayed === 0 && !progress.userMode) {
      setShowIntro(true);
    }
    track('screen_view', { screen: 'main_menu', privacy_mode: progress.privacyMode });
  }, [hydrated, progress.privacyMode, progress.gamesPlayed, progress.userMode]);

  const ambientBg = getAmbientColor();

  if (!hydrated) {
    // #17: Pulsing castle loading skeleton
    return (
      <View style={{ flex: 1, backgroundColor: ambientBg, justifyContent: 'center', alignItems: 'center' }}>
        <PulsingCastle />
      </View>
    );
  }

  if (showIntro) {
    return (
      <HeroIntro onComplete={() => {
        setShowIntro(false);
        track('hero_intro_completed');
      }} />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: ambientBg, alignItems: 'center' }}>
    <SafeAreaView style={{ flex: 1, width: '100%', maxWidth: 500 }}>
      <MainMenu
        onStartGame={(controlMode: ControlMode) => {
          track('start_game_clicked', { from: 'main_menu', control_mode: controlMode, privacy_mode: progress.privacyMode });
          router.push({
            pathname: '/(game)/onboarding',
            params: { controlMode },
          });
        }}
        onSelectGame={() => {
          track('customize_battle_clicked', { from: 'main_menu', privacy_mode: progress.privacyMode });
          router.push('/game-selection');
        }}
        onViewStats={() => {
          track('view_stats_clicked', { from: 'main_menu', privacy_mode: progress.privacyMode });
          router.push('/slowmo/stats');
        }}
        onUserModeSelected={() => {
          track('user_mode_selected_navigate', { to: 'onboarding', privacy_mode: progress.privacyMode });
          router.push('/(game)/onboarding');
        }}
        userModeSelected={progress.userMode !== null}
      />
    </SafeAreaView>
    </View>
  );
}

// #17: Pulsing castle loading skeleton
function PulsingCastle() {
  const anim = React.useRef(new Animated.Value(0.4)).current;
  React.useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
    ])).start();
  }, [anim]);
  return (
    <Animated.View style={{ opacity: anim, alignItems: 'center' }}>
      <Text style={{ fontSize: 64 }}>🏰</Text>
      <Text style={{ color: '#fbbf2480', fontSize: 12, marginTop: 8 }}>Entering the Realm...</Text>
    </Animated.View>
  );
}
