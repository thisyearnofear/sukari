import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * One-time migration of AsyncStorage keys from the legacy `glucoseWars.*`
 * namespace to the `sukari.*` namespace, performed as part of the
 * glucosewars -> sukari rebrand.
 *
 * Runs once per install and is idempotent. Must complete before any provider
 * or service reads the new keys, so it is awaited in the root layout before
 * the provider tree mounts.
 */
const MIGRATION_FLAG_KEY = 'sukari.rebrandMigratedV1';

const KEY_MAP: readonly (readonly [string, string])[] = [
  ['glucoseWars.dexcom', 'sukari.dexcom'],
  ['glucoseWars.analytics.anonymousId', 'sukari.analytics.anonymousId'],
  ['glucoseWars.demoMaya', 'sukari.demoMaya'],
  ['glucoseWars.demoMayaDay', 'sukari.demoMayaDay'],
  ['glucoseWars.missionDeferred', 'sukari.missionDeferred'],
  ['glucoseWars.lastDigest', 'sukari.lastDigest'],
  ['glucoseWars.playerProgress', 'sukari.playerProgress'],
  ['glucoseWars.digestHistory', 'sukari.digestHistory'],
];

export async function migrateLegacyStorageKeys(): Promise<void> {
  try {
    const alreadyMigrated = await AsyncStorage.getItem(MIGRATION_FLAG_KEY);
    if (alreadyMigrated) return;

    for (const [oldKey, newKey] of KEY_MAP) {
      const value = await AsyncStorage.getItem(oldKey);
      if (value === null) continue;
      // Don't clobber a value already written to the new key (e.g. a fresh
      // install that wrote before migration ran); just drop the legacy copy.
      const existing = await AsyncStorage.getItem(newKey);
      if (existing === null) {
        await AsyncStorage.setItem(newKey, value);
      }
      await AsyncStorage.removeItem(oldKey);
    }

    await AsyncStorage.setItem(MIGRATION_FLAG_KEY, '1');
  } catch {
    // Migration is best-effort; never block app startup on a failure.
  }
}
