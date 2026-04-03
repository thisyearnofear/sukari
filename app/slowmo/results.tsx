import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SlowMoResults } from '@/components/game/SlowMoResults';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';

export default function SlowMoResultsRoute() {
  const router = useRouter();
  const { sessionIndex } = useLocalSearchParams<{ sessionIndex?: string }>();
  const { progress } = usePlayerProgressContext();

  const sessions = progress.slowMoSessions ?? [];
  const idx = sessionIndex != null ? Number(sessionIndex) : sessions.length - 1;
  const session = sessions[idx];

  if (!session) {
    router.replace('/');
    return null;
  }

  return (
    <SlowMoResults
      session={session}
      sessionNumber={idx + 1}
      onContinue={() => router.replace('/')}
    />
  );
}
