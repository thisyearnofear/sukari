// Sukari vitals service: browser frames in over WebSocket, SmartSpectra
// metrics out. Everything runs on this machine — video frames are processed
// in memory and never stored or sent anywhere; only derived vitals leave
// the SDK.
//
// Protocol (single ws, default :8765):
//   client -> text  {"type":"begin"}                    start a measurement
//   client -> binary [u32 width][u32 height][f64 tsµs][RGBA payload]
//   client -> text  {"type":"end"}                      stop measurement
//   server -> text  {"type":"status"|"metrics"|"error", ...}
//
// Run: SMARTSPECTRA_API_KEY=... npm run serve
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { WebSocketServer } from 'ws';
import {
  SmartSpectraSDK,
  PixelFormat,
  FrameTransform,
  breathingMetrics,
  cardioMetrics,
} from '@smartspectra/node-sdk';
import { decodeMetrics } from '@smartspectra/node-sdk/messages';

const PORT = Number(process.env.VITALS_PORT ?? 8765);
const HEADER_BYTES = 16;
const __dir = dirname(fileURLToPath(import.meta.url));

let sdk = null;
let measuring = false;

const http = createServer(async (req, res) => {
  if (req.url === '/' || req.url === '/test-client.html') {
    res.setHeader('content-type', 'text/html');
    res.end(await readFile(join(__dir, 'test-client.html')));
    return;
  }
  res.writeHead(404).end();
});

const wss = new WebSocketServer({ server: http });

const broadcast = (msg) => {
  const s = JSON.stringify(msg);
  for (const c of wss.clients) if (c.readyState === 1) c.send(s);
};

function ensureSdk() {
  if (sdk) return;
  sdk = new SmartSpectraSDK({
    apiKey: process.env.SMARTSPECTRA_API_KEY,
    requestedMetrics: [...breathingMetrics, ...cardioMetrics],
  });
  sdk.on('processingStatus', (status) => broadcast({ type: 'status', status }));
  sdk.on('validationStatus', (code, ts, hint) =>
    broadcast({ type: 'validation', code, hint, ts }));
  sdk.on('metrics', (buf, ts) =>
    broadcast({ type: 'metrics', ts, data: decodeMetrics(buf) }));
  sdk.on('error', (code, message, retryable) =>
    broadcast({ type: 'error', code, message, retryable }));
}

async function begin() {
  ensureSdk();
  if (measuring) return;
  sdk.useCustomInput(FrameTransform.kNone);
  sdk.start();
  measuring = true;
}

async function end() {
  if (!measuring || !sdk) return;
  measuring = false;
  await sdk.stopAsync();
}

wss.on('connection', (ws) => {
  ws.on('message', async (data, isBinary) => {
    if (!isBinary) {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'begin') await begin();
      if (msg.type === 'end') await end();
      return;
    }
    if (!measuring || data.length < HEADER_BYTES) return;
    const width = data.readUInt32LE(0);
    const height = data.readUInt32LE(4);
    const tsUs = data.readDoubleLE(8);
    const payload = data.subarray(HEADER_BYTES);
    if (payload.length !== width * height * 4) return;
    sdk.sendFrame(payload, width, height, width * 4, PixelFormat.kRGBA, tsUs);
  });
  ws.on('close', () => { if (wss.clients.size === 0) end(); });
});

process.on('SIGINT', async () => {
  await end();
  if (sdk) await sdk.destroy();
  process.exit(0);
});

http.listen(PORT, () =>
  console.log(`vitals service on :${PORT} — test client at http://localhost:${PORT}/`));
