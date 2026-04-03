import React from 'react';
import { useRouter } from 'expo-router';
import { SlowMoStats } from '@/components/game/SlowMoStats';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';

export default function SlowMoStatsRoute() {
  const router = useRouter();
  const { getSlowMoAnalytics } = usePlayerProgressContext();

  return (
    <SlowMoStats
      analytics={getSlowMoAnalytics()}
      onClose={() => router.back()}
    />
  );
}
