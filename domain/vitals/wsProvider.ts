/**
 * WebSocket VitalsProvider — streams RGBA frames to the local SmartSpectra
 * Node service (server/vitals-node) and maps its metrics events into
 * VitalsReadings. Runs entirely on the user's machine: frames are processed
 * in memory and never stored.
 *
 * Wire protocol (matches server/vitals-node/src/server.mjs):
 *   -> text   {"type":"begin"} / {"type":"end"}
 *   -> binary [u32 width][u32 height][f64 tsUs][RGBA payload]
 *   <- text   {"type":"metrics"|"status"|"validation"|"error", ...}
 */
import type { VitalsProvider, VitalsReading, VitalsSessionStatus } from './types';

const HEADER_BYTES = 16;

export function createWsVitalsProvider(url: string): VitalsProvider {
  let ws: WebSocket | null = null;
  let readingCb: ((r: VitalsReading) => void) | null = null;
  let statusCb: ((s: VitalsSessionStatus) => void) | null = null;
  let errorCb: ((m: string) => void) | null = null;
  let stopped = false;

  const emitStatus = (s: VitalsSessionStatus) => statusCb?.(s);

  return {
    begin() {
      stopped = false;
      emitStatus('connecting');
      try {
        ws = new WebSocket(url);
      } catch {
        emitStatus('error');
        errorCb?.('Could not reach the vitals service. Is it running? (npm run serve in server/vitals-node)');
        return;
      }
      ws.binaryType = 'arraybuffer';
      ws.onopen = () => {
        ws?.send(JSON.stringify({ type: 'begin' }));
        emitStatus('measuring');
      };
      ws.onmessage = (e) => {
        if (typeof e.data !== 'string') return;
        let msg: any;
        try {
          msg = JSON.parse(e.data);
        } catch {
          return;
        }
        if (msg.type === 'metrics' && msg.data) {
          const pulse = msg.data.cardio?.pulseRate?.at(-1);
          const breath = msg.data.breathing?.rate?.at(-1);
          if (pulse != null || breath != null) {
            readingCb?.({
              pulseRate: pulse ?? undefined,
              breathingRate: breath ?? undefined,
              measuredAt: Date.now(),
              source: 'smartspectra',
            });
          }
        } else if (msg.type === 'error') {
          errorCb?.(msg.message ?? 'Vitals service error');
        }
      };
      ws.onerror = () => {
        emitStatus('error');
        errorCb?.('Vitals service connection failed. Start it with `npm run serve` in server/vitals-node.');
      };
      ws.onclose = () => {
        if (!stopped) emitStatus('error');
      };
    },
    sendFrame(rgba, width, height, timestampUs) {
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      const buf = new ArrayBuffer(HEADER_BYTES + rgba.byteLength);
      const v = new DataView(buf);
      v.setUint32(0, width, true);
      v.setUint32(4, height, true);
      v.setFloat64(8, timestampUs, true);
      new Uint8Array(buf, HEADER_BYTES).set(rgba);
      ws.send(buf);
    },
    onReading(cb) {
      readingCb = cb;
    },
    onStatus(cb) {
      statusCb = cb;
    },
    onError(cb) {
      errorCb = cb;
    },
    stop() {
      stopped = true;
      try {
        ws?.send(JSON.stringify({ type: 'end' }));
        ws?.close();
      } catch {
        /* already closed */
      }
      ws = null;
      emitStatus('idle');
    },
  };
}
