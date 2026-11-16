// Spike 2: pipeline verification without a camera — feeds a recorded clip.
// Run: SMARTSPECTRA_API_KEY=... npm run smoke:file -- ./test-assets/face.mp4
import {
  SmartSpectraSDK,
  ProcessingStatus,
  breathingMetrics,
  cardioMetrics,
} from '@smartspectra/node-sdk';
import { decodeMetrics } from '@smartspectra/node-sdk/messages';

const sdk = new SmartSpectraSDK({
  apiKey: process.env.SMARTSPECTRA_API_KEY,
  requestedMetrics: [...breathingMetrics, ...cardioMetrics],
});

let sawPulse = false;
let sawBreathing = false;

sdk.on('metrics', (buf) => {
  const m = decodeMetrics(buf);
  if (m.cardio?.pulseRate?.length) sawPulse = true;
  if (m.breathing?.rate?.length) sawBreathing = true;
  console.log('metrics:', JSON.stringify(m).slice(0, 300));
});
sdk.on('error', (code, message, retryable) => {
  console.error(`error ${code}: ${message} (retryable=${retryable})`);
  process.exitCode = 1;
});

const settled = new Promise((resolve) => {
  let started = false;
  sdk.on('processingStatus', (status) => {
    if (status === ProcessingStatus.kRunning) started = true;
    if (started && (status === ProcessingStatus.kIdle || status === ProcessingStatus.kError)) {
      resolve();
    }
  });
});

sdk.useFile(process.argv[2] ?? './test-assets/face.mp4');
sdk.start();
await settled;
await sdk.destroy();

if (!sawPulse || !sawBreathing) {
  console.error('FAIL: no pulse/breathing readings produced');
  process.exit(1);
}
console.log('OK: pulse and breathing readings appeared');
