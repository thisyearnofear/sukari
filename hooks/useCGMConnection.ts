/**
 * useCGMConnection — Manages real CGM device connection.
 * Enhances useHealthProfile with real glucose data when available.
 *
 * MODULAR: Independent hook, composable with useHealthProfile.
 * CLEAN: Separates CGM concerns from game simulation.
 */
import { useState, useCallback, useEffect } from 'react';
import { Linking, Platform } from 'react-native';
import { GlucoseReading, CGMConnection, CGMProvider } from '@/types/health';
import * as Dexcom from '@/utils/dexcomService';
import * as HealthKit from '@/utils/healthKitService';
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
  const [healthKitAvailable, setHealthKitAvailable] = useState(false);

  // Check existing connections on mount
  useEffect(() => {
    Dexcom.isConnected().then(connected => {
      if (connected) setConnection(prev => ({ ...prev, provider: 'dexcom', isConnected: true }));
    });
    HealthKit.isAvailable().then(setHealthKitAvailable);
  }, []);

  /**
   * Start OAuth flow — opens Dexcom login in browser.
   * User must explicitly consent before any data is accessed.
   */
  const connect = useCallback(async (provider: CGMProvider = 'dexcom') => {
    if (provider === 'libre') {
      // Apple HealthKit path
      if (!healthKitAvailable) {
        setError('Apple Health not available on this device');
        return;
      }
      setIsLoading(true);
      setError(null);
      track('cgm_connect_started', { provider: 'libre' });
      try {
        const granted = await HealthKit.requestPermission();
        if (granted) {
          setConnection({ provider: 'libre', isConnected: true, lastSyncAt: Date.now(), consentGivenAt: Date.now() });
          track('cgm_connected', { provider: 'libre' });
        } else {
          setError('Health permission not granted');
        }
      } catch (err: any) {
        setError(err?.message || 'HealthKit connection failed');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Dexcom OAuth path
    if (!process.env.EXPO_PUBLIC_DEXCOM_CLIENT_ID) {
      setError('Dexcom integration not configured');
      return;
    }
    track('cgm_connect_started', { provider: 'dexcom' });
    const url = Dexcom.getDexcomAuthUrl();
    await Linking.openURL(url);
  }, [healthKitAvailable]);

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
      const data = connection.provider === 'libre'
        ? await HealthKit.fetchRecentReadings(minutes)
        : await Dexcom.fetchRecentReadings(minutes);
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
    if (connection.provider === 'dexcom') await Dexcom.disconnect();
    else await HealthKit.disconnect();
    setConnection({ provider: 'dexcom', isConnected: false, lastSyncAt: null, consentGivenAt: null });
    setReadings([]);
    setLatestReading(null);
    track('cgm_disconnected', { provider: connection.provider });
  }, [connection.provider]);

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
    healthKitAvailable,
  };
}
