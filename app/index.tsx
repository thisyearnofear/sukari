import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MainMenu } from '@/components/game/MainMenu';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
import { ControlMode } from '@/types/game';

export default function MenuScreen() {
  const router = useRouter();
  const { progress, hydrated } = usePlayerProgressContext();

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff' }}>Loading Kingdom...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a2e' }}>
      <MainMenu
        onStartGame={(controlMode: ControlMode) => {
          router.push({
            pathname: '/(game)/onboarding',
            params: { controlMode },
          });
        }}
        onSelectGame={() => {
          router.push('/game-selection');
        }}
        onViewStats={() => {
          router.push('/slowmo/stats');
        }}
        onUserModeSelected={() => {
          router.push('/(game)/onboarding');
        }}
        userModeSelected={progress.userMode !== null}
      />
    </SafeAreaView>
  );
}
