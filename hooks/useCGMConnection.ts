/**
 * useCGMConnection — Manages real CGM device connection.
 * Enhances useHealthProfile with real glucose data when available.
 *
 * MODULAR: Independent hook, composable with useHealthProfile.
 * CLEAN: Separates CGM concerns from game simulation.
 */
import { useState, useCallback, useEffect } from 'react';
import { Linking } from 'react-native';
import { GlucoseReading, CGMConnection, CGMProvider } from '@/types/health';
import * as Dexcom from '@/utils/dexcomService';
import { track } from '@/utils/analytics';

export function useCGMConnection() {
  const [connection, setConnection] = useState<CGMConnection>({
    provider: 'dexcom',
    isConnected: false,
    lastSyncAt: null,
    consentGivenAt: null,
  });
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [latestReading, setLatestReading] = useState<GlucoseReading | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check existing connection on mount
  useEffect(() => {
    Dexcom.isConnected().then(connected => {
      if (connected) {
        setConnection(prev => ({ ...prev, isConnected: true }));
      }
    });
  }, []);

  /**
   * Start OAuth flow — opens Dexcom login in browser.
   * User must explicitly consent before any data is accessed.
   */
  const connect = useCallback(async (provider: CGMProvider = 'dexcom') => {
    if (provider !== 'dexcom') {
      setError(`${provider} integration coming soon`);
      return;
    }

    if (!process.env.EXPO_PUBLIC_DEXCOM_CLIENT_ID) {
      setError('Dexcom integration not configured');
      return;
    }

    track('cgm_connect_started', { provider });
    const url = Dexcom.getDexcomAuthUrl();
    await Linking.openURL(url);
  }, []);

  /**
   * Complete OAuth — called after redirect with auth code.
   */
  const handleAuthCode = useCallback(async (code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await Dexcom.exchangeCode(code);
      setConnection({
        provider: 'dexcom',
        isConnected: true,
        lastSyncAt: Date.now(),
        consentGivenAt: Date.now(),
      });
      track('cgm_connected', { provider: 'dexcom' });
    } catch (err: any) {
      setError(err?.message || 'Connection failed');
      track('cgm_connect_error', { provider: 'dexcom', error: err?.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch recent readings from connected CGM.
   */
  const syncReadings = useCallback(async (minutes: number = 180) => {
    if (!connection.isConnected) return [];

    setIsLoading(true);
    setError(null);
    try {
      const data = await Dexcom.fetchRecentReadings(minutes);
      setReadings(data);
      if (data.length > 0) {
        setLatestReading(data[data.length - 1]);
      }
      setConnection(prev => ({ ...prev, lastSyncAt: Date.now() }));
      track('cgm_sync_completed', { readings_count: data.length });
      return data;
    } catch (err: any) {
      setError(err?.message || 'Sync failed');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [connection.isConnected]);

  /**
   * Disconnect and clear all stored tokens/data.
   */
  const disconnect = useCallback(async () => {
    await Dexcom.disconnect();
    setConnection({ provider: 'dexcom', isConnected: false, lastSyncAt: null, consentGivenAt: null });
    setReadings([]);
    setLatestReading(null);
    track('cgm_disconnected', { provider: 'dexcom' });
  }, []);

  return {
    connection,
    readings,
    latestReading,
    isLoading,
    error,
    connect,
    handleAuthCode,
    syncReadings,
    disconnect,
  };
}
