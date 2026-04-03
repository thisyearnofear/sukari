import React from 'react';
import { useRouter } from 'expo-router';
import { SlowMoMode } from '@/components/game/SlowMoMode';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';

export default function SlowMoRoute() {
  const router = useRouter();
  const { progress } = usePlayerProgressContext();

  return (
    <SlowMoMode
      onStartGame={() => {
        router.replace('/');
      }}
      onBack={() => router.back()}
      onComplete={() => {
        const lastSession = progress.slowMoSessions?.[progress.slowMoSessions.length - 1];
        if (lastSession) {
          router.replace({
            pathname: '/slowmo/results',
            params: {
              sessionIndex: String((progress.slowMoSessions?.length ?? 1) - 1),
            },
          });
        } else {
          router.replace('/');
        }
      }}
    />
  );
}
