import React from 'react';
import { useRouter } from 'expo-router';
import { WelcomeBack } from '@/components/game/WelcomeBack';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
import { GameTier } from '@/constants/gameTiers';

type SelectableTier = Exclude<GameTier, 'slowmo'>;

export default function WelcomeRoute() {
  const router = useRouter();
  const { progress } = usePlayerProgressContext();

  return (
    <WelcomeBack
      maxTierUnlocked={(progress.maxTierUnlocked as SelectableTier) || 'tier1'}
      currentTier={(progress.currentTier as SelectableTier) || 'tier1'}
      onResume={() => router.replace('/(game)/battle')}
      onSkipToTier={(tier) => {
        router.push({
          pathname: '/(game)/onboarding',
          params: { tier },
        });
      }}
      onPlayAgain={() => router.replace('/')}
    />
  );
}
