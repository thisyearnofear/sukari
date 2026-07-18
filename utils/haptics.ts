/**
 * Haptics — one quiet heartbeat on real-world completion.
 * Silence is the default expression of respect (docs/PRODUCT_DESIGN.md §7).
 */
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/** Fires once when a mission is marked done in real life. Web: no-op. */
export function completionHeartbeat(): void {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}
