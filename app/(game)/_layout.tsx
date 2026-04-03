import React from 'react';
import { Slot } from 'expo-router';
import { GameSessionProvider } from '@/context/GameSessionContext';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';

export default function GameLayout() {
  const { progress } = usePlayerProgressContext();

  return (
    <GameSessionProvider userMode={progress.userMode || undefined}>
      <Slot />
    </GameSessionProvider>
  );
}
