/**
 * Vitals domain — the seam camera-derived signals enter Sukari through.
 *
 * A `VitalsProvider` is the only contract the UI knows. Today it is backed
 * by the local SmartSpectra Node service over WebSocket (web surface); on
 * iOS/Android the same interface will be implemented by the native
 * SmartSpectra bindings via an Expo module. The demo/simulated provider
 * exists so the experience is testable without an API key — it is always
 * labelled as simulated in the UI.
 */

export interface VitalsReading {
  /** Beats per minute, most recent estimate. */
  pulseRate?: number;
  /** Breaths per minute, most recent estimate. */
  breathingRate?: number;
  /** When this estimate was produced (epoch ms). */
  measuredAt: number;
  /** Where the numbers came from. 'simulated' is always disclosed. */
  source: 'smartspectra' | 'simulated';
}

export type VitalsSessionStatus =
  | 'idle'
  | 'connecting'
  | 'measuring'
  | 'settled'
  | 'error';

export interface VitalsProvider {
  /** Prepare a measurement session (open transport, start the pipeline). */
  begin(): void;
  /** Push one RGBA video frame. */
  sendFrame(rgba: Uint8Array, width: number, height: number, timestampUs: number): void;
  onReading(cb: (reading: VitalsReading) => void): void;
  onStatus(cb: (status: VitalsSessionStatus) => void): void;
  onError(cb: (message: string) => void): void;
  /** End the session and release resources. Idempotent. */
  stop(): void;
}

export const VITALS_SERVICE_URL =
  process.env.EXPO_PUBLIC_VITALS_WS_URL ?? 'ws://localhost:8765';
