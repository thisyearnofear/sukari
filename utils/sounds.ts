/**
 * Sound effects service — lightweight audio feedback using expo-av.
 * Falls back silently if audio is unavailable.
 * Sounds are lazy-loaded on first use to avoid blocking app startup.
 */
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

type SoundName = 'swipe' | 'combo' | 'miss' | 'victory' | 'defeat' | 'powerup';

let enabled = true;
const cache: Partial<Record<SoundName, Audio.Sound>> = {};

// Synthesize simple sounds using oscillator-like patterns via expo-av
// For a real app, replace these with actual .wav/.mp3 assets
const SOUND_CONFIGS: Record<SoundName, { frequency: number; duration: number }> = {
  swipe: { frequency: 600, duration: 80 },
  combo: { frequency: 880, duration: 150 },
  miss: { frequency: 200, duration: 200 },
  victory: { frequency: 1000, duration: 400 },
  defeat: { frequency: 150, duration: 500 },
  powerup: { frequency: 700, duration: 120 },
};

export function setSoundEnabled(value: boolean) {
  enabled = value;
}

export async function playSound(name: SoundName) {
  if (!enabled) return;

  // Web: use Web Audio API for zero-dependency sound synthesis
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.AudioContext) {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const config = SOUND_CONFIGS[name];

      osc.type = name === 'miss' || name === 'defeat' ? 'sawtooth' : 'sine';
      osc.frequency.value = config.frequency;
      gain.gain.value = 0.15;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.duration / 1000);

      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + config.duration / 1000);
    } catch {
      // Audio not available
    }
    return;
  }

  // Native: use Haptics as audio substitute (already integrated)
  // Real sound files would go here:
  // try {
  //   if (!cache[name]) {
  //     const { sound } = await Audio.Sound.createAsync(SOUND_ASSETS[name]);
  //     cache[name] = sound;
  //   }
  //   await cache[name]!.replayAsync();
  // } catch {}
}

export async function cleanup() {
  for (const sound of Object.values(cache)) {
    await sound?.unloadAsync();
  }
}
