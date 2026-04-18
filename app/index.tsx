import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MainMenu } from '@/components/game/MainMenu';
import { HeroIntro } from '@/components/game/HeroIntro';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
import { ControlMode } from '@/types/game';
import { track } from '@/utils/analytics';

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

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a12', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fbbf24', fontSize: 48 }}>🏰</Text>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a12' }}>
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
  );
}
