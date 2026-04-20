/**
 * Mechanic discovery messages — "aha" moments when new mechanics unlock.
 */
import { GameMechanic } from '@/hooks/usePlayerProgress';

export const MECHANIC_DISCOVERY_MESSAGES: Record<GameMechanic, { emoji: string; title: string; sub: string }> = {
  swipe_basic: { emoji: '👆', title: 'SWIPE TO DEFEND!', sub: 'Rally allies up, banish enemies down.' },
  stability_bar: { emoji: '💚', title: 'HARMONY UNLOCKED!', sub: 'Keep the green bar balanced to win.' },
  combo: { emoji: '⚡', title: 'COMBOS UNLOCKED!', sub: 'Chain correct swipes for bonus points!' },
  power_ups: { emoji: '⚔️', title: 'POWER-UPS UNLOCKED!', sub: 'Use Exercise and Rations to control Harmony.' },
  save_direction: { emoji: '👈', title: 'SAVE UNLOCKED!', sub: 'Swipe LEFT to save food for later.' },
  share_direction: { emoji: '👉', title: 'SHARE UNLOCKED!', sub: 'Swipe RIGHT to share with allies for bonus points.' },
  body_metrics: { emoji: '📊', title: 'BODY METRICS UNLOCKED!', sub: 'Manage Vigor, Purity, and Vitality.' },
  morning_conditions: { emoji: '🌅', title: 'MORNING CONDITIONS!', sub: 'Each day starts differently. Adapt your strategy.' },
  plot_twists: { emoji: '🎭', title: 'PLOT TWISTS UNLOCKED!', sub: 'Random events will challenge your kingdom.' },
  cgm_comparison: { emoji: '📡', title: 'CGM READY!', sub: 'Connect your Dexcom to see real glucose on results.' },
};
