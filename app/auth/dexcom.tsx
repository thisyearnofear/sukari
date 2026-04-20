/**
 * Dexcom OAuth callback handler.
 * Redirect URI: glucosewars://auth/dexcom
 * Web: /auth/dexcom?code=...
 */
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useCGMConnection } from '@/hooks/useCGMConnection';

export default function DexcomAuthCallback() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const cgm = useCGMConnection();

  useEffect(() => {
    if (!code) {
      router.replace('/');
      return;
    }
    cgm.handleAuthCode(code).then(() => {
      router.replace('/');
    }).catch(() => {
      router.replace('/');
    });
  }, [code, cgm]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a12', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={{ color: '#9ca3af', marginTop: 16, fontSize: 14 }}>Connecting to Dexcom...</Text>
    </View>
  );
}
