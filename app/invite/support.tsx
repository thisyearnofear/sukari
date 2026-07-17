/**
 * Caregiver invite landing — sets caregiver mode + forced support mission.
 * URL carries template id only (no raw glucose).
 */
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
import { track } from '@/utils/analytics';

export default function CaregiverSupportInvite() {
  const params = useLocalSearchParams<{ templateId?: string; invite?: string }>();
  const { setUserMode, ensureTodayMission, progress } = usePlayerProgressContext();

  useEffect(() => {
    track('caregiver_invite_opened', {
      template_id: params.templateId || 'caregiver_support',
      invite: params.invite || '',
    });
    setUserMode('caregiver');
    ensureTodayMission(null, params.templateId || 'caregiver_support');
  }, [params.templateId, params.invite, setUserMode, ensureTodayMission]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a12', padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>🏰</Text>
      <Text style={{ color: '#fbbf24', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 }}>
        Guardian invite
      </Text>
      <Text style={{ color: '#d1d5db', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 16 }}>
        You’ve been asked to support someone’s metabolic Realm tonight. No clinical data is shared — just one clear support action.
      </Text>
      {progress.activeMission && (
        <View
          style={{
            backgroundColor: 'rgba(34,197,94,0.12)',
            borderWidth: 1,
            borderColor: 'rgba(34,197,94,0.4)',
            borderRadius: 14,
            padding: 14,
            marginBottom: 20,
          }}
        >
          <Text style={{ color: '#86efac', fontSize: 10, fontWeight: 'bold', marginBottom: 6 }}>SUPPORT ASK</Text>
          <Text style={{ color: '#fff', fontSize: 14, lineHeight: 20 }}>
            {progress.activeMission.caregiverSupportAction}
          </Text>
        </View>
      )}
      <TouchableOpacity
        onPress={() => router.replace('/')}
        style={{ backgroundColor: '#16a34a', padding: 16, borderRadius: 14, marginBottom: 10 }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Enter as Guardian</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: '/(game)/onboarding',
            params: { controlMode: 'swipe' },
          })
        }
        style={{
          borderWidth: 1,
          borderColor: '#a78bfa',
          padding: 14,
          borderRadius: 14,
        }}
      >
        <Text style={{ color: '#c4b5fd', fontWeight: 'bold', textAlign: 'center' }}>
          Empathy practice battle
        </Text>
      </TouchableOpacity>
    </View>
  );
}
