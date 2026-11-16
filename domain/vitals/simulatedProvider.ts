/**
 * Simulated VitalsProvider — emits plausible pulse/breathing readings on a
 * timer. Always labelled `source: 'simulated'` and disclosed in the UI; it
 * exists so the check-in experience is testable and demoable without an
 * API key or camera frames.
 */
import type { VitalsProvider, VitalsSessionStatus } from './types';

export function createSimulatedVitalsProvider(): VitalsProvider {
  let timer: ReturnType<typeof setInterval> | null = null;
  let readingCb: Parameters<VitalsProvider['onReading']>[0] | null = null;
  let statusCb: ((s: VitalsSessionStatus) => void) | null = null;
  let tick = 0;

  return {
    begin() {
      statusCb?.('measuring');
      // Warm-up pause, then a reading roughly every 2s — like the real SDK.
      timer = setInterval(() => {
        tick += 1;
        if (tick < 2) return;
        readingCb?.({
          pulseRate: Math.round(64 + Math.sin(tick / 3) * 6 + Math.random() * 3),
          breathingRate: Math.round(13 + Math.sin(tick / 4) * 2 + Math.random()),
          measuredAt: Date.now(),
          source: 'simulated',
        });
      }, 2000);
    },
    sendFrame() {
      /* simulated — frames ignored */
    },
    onReading(cb) {
      readingCb = cb;
    },
    onStatus(cb) {
      statusCb = cb;
    },
    onError() {
      /* simulated — never errors */
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
      statusCb?.('idle');
    },
  };
}
