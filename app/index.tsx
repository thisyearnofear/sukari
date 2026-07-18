import React from 'react';
import { View, Text, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MainMenu } from '@/components/game/MainMenu';
import { HeroIntro } from '@/components/game/HeroIntro';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
import { ControlMode } from '@/types/game';
import { track } from '@/utils/analytics';
import { COLORS, FONTS } from '@/constants/designSystem';

function getAmbientColor(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) return '#121810';
  if (hour >= 10 && hour < 16) return COLORS.PROGRAMME.ink;
  if (hour >= 16 && hour < 20) return '#14120e';
  return '#0a1012';
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
    return (
      <View style={{ flex: 1, backgroundColor: ambientBg, justifyContent: 'center', alignItems: 'center' }}>
        <QuietLoader />
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

function QuietLoader() {
  const anim = React.useRef(new Animated.Value(0.35)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.35, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, [anim]);
  return (
    <Animated.View style={{ opacity: anim, alignItems: 'center', paddingHorizontal: 32 }}>
      <Text
        style={{
          fontFamily: FONTS.display,
          color: COLORS.PROGRAMME.text,
          fontSize: 28,
          letterSpacing: -0.3,
        }}
      >
        Glucose Wars
      </Text>
      <Text
        style={{
          fontFamily: FONTS.body,
          color: COLORS.PROGRAMME.textMuted,
          fontSize: 13,
          marginTop: 10,
        }}
      >
        Opening your programme…
      </Text>
    </Animated.View>
  );
}
