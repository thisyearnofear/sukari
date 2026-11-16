// Spike 1: end-to-end smoke test using the Mac's built-in camera.
// Proves the SDK authenticates, opens the camera, and emits vitals.
// Run: SMARTSPECTRA_API_KEY=... npm run smoke:camera
import {
  SmartSpectraSDK,
  CameraSelection,
  breathingMetrics,
  cardioMetrics,
} from '@smartspectra/node-sdk';
import { decodeMetrics } from '@smartspectra/node-sdk/messages';

const sdk = new SmartSpectraSDK({
  apiKey: process.env.SMARTSPECTRA_API_KEY,
  requestedMetrics: [...breathingMetrics, ...cardioMetrics],
});

sdk.on('processingStatus', (status) => console.log('status:', status));
sdk.on('validationStatus', (code, ts, hint) =>
  console.log('validation:', code, hint ?? '', 'at', ts, 'µs'));
sdk.on('metrics', (buf, ts) => {
  const m = decodeMetrics(buf);
  const pulse = m.cardio?.pulseRate?.at(-1);
  const breath = m.breathing?.rate?.at(-1);
  console.log(`metrics @${ts}µs  pulse=${pulse ?? '-'}  breathing=${breath ?? '-'}`);
});
sdk.on('error', (code, message, retryable) =>
  console.error(`error ${code}: ${message} (retryable=${retryable})`));

console.log('cameras:', SmartSpectraSDK.availableCameras());
sdk.useCamera(CameraSelection.default);
sdk.start();
console.log('Measuring — sit still, face the camera. Ctrl+C to stop.');

process.on('SIGINT', async () => {
  await sdk.stopAsync();
  await sdk.destroy();
  process.exit(0);
});
