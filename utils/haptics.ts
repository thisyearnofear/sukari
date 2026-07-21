/**
 * Haptics — quiet physical punctuation for the conversation loop.
 * Silence is the default expression of respect (docs/PRODUCT_DESIGN.md §7).
 * Each pattern is intentional and tied to a meaningful moment, not noise.
 */
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/** Fires once when a mission is marked done in real life. Web: no-op. */
export function completionHeartbeat(): void {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}

/** Gentle pulse when Mira offers a mission — "here's something." */
export function offerPulse(): void {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

/** Soft pulse when the patient accepts a mission — commitment registered. */
export function acceptPulse(): void {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
}

/** Warm, slow pulse when the patient completes — settlement. */
export function completePulse(): void {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}

/** Double pulse for the first noticed-difference milestone — "you felt it." */
export function milestonePulse(): void {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
    .then(() => setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => undefined), 180))
    .catch(() => undefined);
}

/** Subtle tick when the orb notices the patient — app open or attention. */
export function noticeTick(): void {
  if (Platform.OS === 'web') return;
  Haptics.selectionAsync().catch(() => undefined);
}
