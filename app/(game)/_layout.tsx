import React from 'react';
import { Stack } from 'expo-router';
import { GameSessionProvider } from '@/context/GameSessionContext';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';

export default function GameLayout() {
  const { progress } = usePlayerProgressContext();

  return (
    <GameSessionProvider userMode={progress.userMode || undefined}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 250,
        }}
      >
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="battle" options={{ animation: 'fade' }} />
        <Stack.Screen name="results" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
    </GameSessionProvider>
  );
}
