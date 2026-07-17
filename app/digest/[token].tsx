/**
 * Weekly care-team digest — shareable proclamation (no dosing advice).
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Share } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchWeeklyDigest, WeeklyDigestPayload } from '@/domain/digest';
import { track } from '@/utils/analytics';

const LOCAL_DIGEST_KEY = 'glucoseWars.lastDigest';

export default function WeeklyDigestScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [digest, setDigest] = useState<WeeklyDigestPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    track('weekly_digest_opened', { token: token || '' });
    const load = async () => {
      if (!token) {
        setError('Missing digest token');
        return;
      }
      const remote = await fetchWeeklyDigest(token);
      if (remote?.ok && remote.digest) {
        setDigest(remote.digest);
        return;
      }
      const localRaw = await AsyncStorage.getItem(LOCAL_DIGEST_KEY);
      if (localRaw) {
        const parsed = JSON.parse(localRaw) as WeeklyDigestPayload & { token?: string };
        if (!parsed.token || parsed.token === token || String(token).startsWith('local-')) {
          setDigest(parsed);
          return;
        }
      }
      setError('Digest not found or expired');
    };
    load();
  }, [token]);

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a12', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: '#f87171', textAlign: 'center', marginBottom: 16 }}>{error}</Text>
        <TouchableOpacity onPress={() => router.replace('/')} style={{ padding: 14 }}>
          <Text style={{ color: '#93c5fd', textAlign: 'center' }}>Back to Realm</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!digest) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a12', justifyContent: 'center' }}>
        <Text style={{ color: '#9ca3af', textAlign: 'center' }}>Loading proclamation…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a12' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ color: '#fbbf24', fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>
          Weekly Proclamation
        </Text>
        <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 16 }}>
          Week of {digest.weekKey} · For care team review · Not medical advice
        </Text>

        <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(245,158,11,0.35)' }}>
          <Text style={{ color: '#fde68a', fontWeight: 'bold', marginBottom: 8 }}>Adherence</Text>
          <Text style={{ color: '#e5e7eb', fontSize: 13 }}>
            {digest.missionsCompleted}/{Math.max(digest.missionsAssigned, 1)} missions completed ·{' '}
            {digest.practiceSessions} practice sessions
          </Text>
          {digest.adherence?.relapses != null && Number(digest.adherence.relapses) > 0 && (
            <Text style={{ color: '#fca5a5', fontSize: 12, marginTop: 6 }}>
              Soft relapses: {String(digest.adherence.relapses)} (recovery coaching recommended)
            </Text>
          )}
        </View>

        {digest.narrative ? (
          <Text style={{ color: '#d1d5db', fontSize: 13, lineHeight: 20, marginBottom: 14 }}>
            {digest.narrative}
          </Text>
        ) : null}

        <Text style={{ color: '#86efac', fontWeight: 'bold', marginBottom: 6 }}>Wins</Text>
        {digest.wins.map((w, i) => (
          <Text key={i} style={{ color: '#e5e7eb', fontSize: 12, marginBottom: 4 }}>• {w}</Text>
        ))}

        {digest.concerns.length > 0 && (
          <>
            <Text style={{ color: '#fbbf24', fontWeight: 'bold', marginTop: 14, marginBottom: 6 }}>
              Notes
            </Text>
            {digest.concerns.map((c, i) => (
              <Text key={i} style={{ color: '#e5e7eb', fontSize: 12, marginBottom: 4 }}>• {c}</Text>
            ))}
          </>
        )}

        {digest.topBehaviours.length > 0 && (
          <>
            <Text style={{ color: '#93c5fd', fontWeight: 'bold', marginTop: 14, marginBottom: 6 }}>
              Focus behaviours
            </Text>
            <Text style={{ color: '#d1d5db', fontSize: 12 }}>
              {digest.topBehaviours.join(' · ')}
            </Text>
          </>
        )}

        <TouchableOpacity
          onPress={async () => {
            await Share.share({
              message: `Glucose Wars weekly proclamation (${digest.weekKey}): ${digest.missionsCompleted} missions completed. ${digest.narrative || ''}`,
            });
            track('weekly_digest_shared', { week: digest.weekKey });
          }}
          style={{ backgroundColor: '#16a34a', padding: 14, borderRadius: 12, marginTop: 24 }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Share with care team</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/')} style={{ padding: 14, marginTop: 8 }}>
          <Text style={{ color: '#9ca3af', textAlign: 'center' }}>Back to Realm</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
