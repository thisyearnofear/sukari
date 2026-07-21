import React from 'react';
import { View, Text, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainMenu } from '@/components/game/MainMenu';
import { HeroIntro } from '@/components/game/HeroIntro';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
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
      <HeroIntro onComplete={(source) => {
        setShowIntro(false);
        track('value_proposition_completed', { source, privacy_mode: progress.privacyMode });
      }} />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: ambientBg, alignItems: 'center' }}>
    <SafeAreaView style={{ flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 960 : 500 }}>
      <MainMenu
        onUserModeSelected={() => {
          track('value_to_role_completed', { privacy_mode: progress.privacyMode });
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
        Sukari
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
