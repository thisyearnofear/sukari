/**
 * VitalsCheckIn — the designed measurement moment.
 *
 * Three stages inside one calm sheet:
 *   consent   — what the camera is for, what happens to frames
 *               (processed on this device, in memory; only derived
 *               vitals are kept — nothing is recorded or uploaded)
 *   measuring — live camera stage with vitals readout settling in
 *   result    — the reading, handed back to Mira
 *
 * Camera capture is implemented for the web build (getUserMedia → RGBA
 * frames → local SmartSpectra service). On native surfaces the stage
 * shows an honest placeholder until the Expo module lands.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, View } from 'react-native';
import { HeartPulse, ShieldCheck, Wind } from 'lucide-react-native';
import { COLORS, FONTS } from '@/constants/designSystem';
import { PressableScale } from '@/components/ui/PressableScale';
import { MiraOrb } from '@/components/agent/MiraOrb';
import {
  createVitalsProvider,
  type VitalsProvider,
  type VitalsReading,
} from '@/domain/vitals';

const P = COLORS.PROGRAMME;
const FRAME_W = 320;
const FRAME_H = 240;
const FRAME_FPS = 15;
const MEASURE_SECONDS = 30;

type Stage = 'consent' | 'measuring' | 'result';

export function VitalsCheckIn({
  visible,
  onClose,
  onComplete,
  onReading,
}: {
  visible: boolean;
  onClose: () => void;
  onComplete: (reading: VitalsReading) => void;
  /** Live readings as they settle — lets the ambient field pulse with
      the measured signal while the sheet is open (embodied check-in). */
  onReading?: (reading: VitalsReading) => void;
}) {
  const [stage, setStage] = useState<Stage>('consent');
  const [reading, setReading] = useState<VitalsReading | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const providerRef = useRef<VitalsProvider | null>(null);
  const cameraRef = useRef<{ stop: () => void } | null>(null);
  const simulated = process.env.EXPO_PUBLIC_VITALS_SIMULATED === '1';

  useEffect(() => {
    if (visible) {
      setStage('consent');
      setReading(null);
      setElapsed(0);
      setError(null);
    } else {
      teardown();
    }
  }, [visible]);

  const teardown = () => {
    cameraRef.current?.stop();
    cameraRef.current = null;
    providerRef.current?.stop();
    providerRef.current = null;
  };

  const begin = async () => {
    setError(null);
    const provider = createVitalsProvider();
    providerRef.current = provider;
    provider.onReading((r) => {
      setReading(r);
      onReading?.(r);
    });
    provider.onError(setError);
    provider.onStatus((s) => {
      if (s === 'error') setError((prev) => prev ?? 'Vitals service unavailable');
    });

    if (Platform.OS === 'web' && !simulated) {
      const cam = await startWebCamera((rgba, tsUs) =>
        provider.sendFrame(rgba, FRAME_W, FRAME_H, tsUs),
      );
      if (!cam) {
        setError('Camera permission was not granted.');
        provider.stop();
        return;
      }
      cameraRef.current = cam;
    }
    provider.begin();
    setStage('measuring');
  };

  // Measurement timer — auto-settle at MEASURE_SECONDS once we have a reading
  useEffect(() => {
    if (stage !== 'measuring') return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [stage]);

  useEffect(() => {
    if (stage === 'measuring' && reading && elapsed >= MEASURE_SECONDS) {
      finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, reading, stage]);

  const finish = () => {
    teardown();
    if (reading) {
      setStage('result');
    } else {
      setStage('consent');
      setError('No reading yet — stay in frame a little longer, or check lighting.');
    }
  };

  const close = () => {
    teardown();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {stage === 'consent' && (
            <ConsentStage simulated={simulated} error={error} onBegin={begin} onCancel={close} />
          )}
          {stage === 'measuring' && (
            <MeasuringStage
              reading={reading}
              elapsed={elapsed}
              error={error}
              simulated={simulated}
              onFinish={finish}
              onCancel={close}
            />
          )}
          {stage === 'result' && reading && (
            <ResultStage
              reading={reading}
              simulated={simulated}
              onDone={() => {
                onComplete(reading);
                close();
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

/* ---------------------------------- consent --------------------------------- */

function ConsentStage({
  simulated,
  error,
  onBegin,
  onCancel,
}: {
  simulated: boolean;
  error: string | null;
  onBegin: () => void;
  onCancel: () => void;
}) {
  return (
    <View style={styles.stage}>
      <View style={styles.consentIconWrap}>
        <ShieldCheck size={22} color={P.accent} strokeWidth={1.6} />
      </View>
      <Text style={styles.title}>A quick check-in</Text>
      <Text style={styles.body}>
        Mira can take a {MEASURE_SECONDS}-second reading of your pulse and breathing using
        this device&apos;s camera.
      </Text>
      <View style={styles.bulletList}>
        <Text style={styles.bullet}>Video is processed on this device, in memory.</Text>
        <Text style={styles.bullet}>Nothing is recorded or uploaded — only the numbers stay.</Text>
        <Text style={styles.bullet}>You can stop any time.</Text>
      </View>
      {simulated ? (
        <Text style={styles.simNote}>Demo mode — readings will be simulated.</Text>
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <PressableScale onPress={onBegin} style={styles.primary} accessibilityRole="button">
        <Text style={styles.primaryText}>Use my camera</Text>
      </PressableScale>
      <PressableScale onPress={onCancel} style={styles.ghost} accessibilityRole="button">
        <Text style={styles.ghostText}>Not now</Text>
      </PressableScale>
    </View>
  );
}

/* --------------------------------- measuring -------------------------------- */

function MeasuringStage({
  reading,
  elapsed,
  error,
  simulated,
  onFinish,
  onCancel,
}: {
  reading: VitalsReading | null;
  elapsed: number;
  error: string | null;
  simulated: boolean;
  onFinish: () => void;
  onCancel: () => void;
}) {
  const hostRef = useRef<View>(null);
  const progress = Math.min(1, elapsed / MEASURE_SECONDS);

  useEffect(() => {
    // Web camera preview — the same DOM-mount trick MetabolicFieldWeb uses.
    if (Platform.OS !== 'web' || simulated) return;
    const video = getSharedVideo();
    const host = hostRef.current as unknown as HTMLElement | null;
    if (video && host) {
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      host.appendChild(video);
    }
    return () => {
      if (video && host && video.parentNode === host) host.removeChild(video);
    };
  }, [simulated]);

  return (
    <View style={styles.stage}>
      <View style={styles.cameraFrame}>
        {Platform.OS === 'web' && !simulated ? (
          <View ref={hostRef} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={styles.cameraPlaceholder}>
            <MiraOrb posture="inquiry" size={64} />
            <Text style={styles.placeholderText}>
              {simulated ? 'Simulated reading' : 'Camera preview is available on the web build'}
            </Text>
          </View>
        )}
        <View style={styles.scanLine} />
      </View>

      <View style={styles.readouts}>
        <Readout icon={<HeartPulse size={18} color={P.accent} strokeWidth={1.7} />} label="Pulse" value={reading?.pulseRate} unit="bpm" />
        <Readout icon={<Wind size={18} color={P.cool} strokeWidth={1.7} />} label="Breathing" value={reading?.breathingRate} unit="/min" />
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.hint}>
        {reading ? 'Settled — finishing when ready' : 'Hold still, face the camera, even lighting'}
      </Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.rowButtons}>
        <PressableScale onPress={onCancel} style={styles.ghost} accessibilityRole="button">
          <Text style={styles.ghostText}>Stop</Text>
        </PressableScale>
        <PressableScale
          onPress={onFinish}
          disabled={!reading}
          style={[styles.primary, styles.primaryFlex, !reading && styles.primaryDisabled]}
          accessibilityRole="button"
        >
          <Text style={styles.primaryText}>Done</Text>
        </PressableScale>
      </View>
    </View>
  );
}

function Readout({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
  unit: string;
}) {
  return (
    <View style={styles.readout}>
      {icon}
      <Text style={styles.readoutLabel}>{label}</Text>
      <Text style={styles.readoutValue}>
        {value != null ? value : '—'}
        <Text style={styles.readoutUnit}> {unit}</Text>
      </Text>
    </View>
  );
}

/* ---------------------------------- result ---------------------------------- */

function ResultStage({
  reading,
  simulated,
  onDone,
}: {
  reading: VitalsReading;
  simulated: boolean;
  onDone: () => void;
}) {
  return (
    <View style={styles.stage}>
      <MiraOrb posture="steady" size={72} />
      <Text style={styles.title}>Noted.</Text>
      <View style={styles.readouts}>
        <Readout icon={<HeartPulse size={18} color={P.accent} strokeWidth={1.7} />} label="Pulse" value={reading.pulseRate} unit="bpm" />
        <Readout icon={<Wind size={18} color={P.cool} strokeWidth={1.7} />} label="Breathing" value={reading.breathingRate} unit="/min" />
      </View>
      <Text style={styles.body}>
        Only these numbers are kept — the video stayed on your device and is already gone.
      </Text>
      {simulated ? <Text style={styles.simNote}>Simulated reading (demo).</Text> : null}
      <PressableScale onPress={onDone} style={styles.primary} accessibilityRole="button">
        <Text style={styles.primaryText}>Back to Mira</Text>
      </PressableScale>
    </View>
  );
}

/* ------------------------------ web camera ---------------------------------- */

/**
 * Shared getUserMedia stream + per-frame RGBA pump. Returns a handle to stop
 * tracks and timers. Web-only; callers gate on Platform.OS === 'web'.
 */
let sharedVideo: HTMLVideoElement | null = null;
let sharedStream: MediaStream | null = null;

function getSharedVideo(): HTMLVideoElement | null {
  return sharedVideo;
}

async function startWebCamera(
  onFrame: (rgba: Uint8Array, timestampUs: number) => void,
): Promise<{ stop: () => void } | null> {
  try {
    sharedStream = await navigator.mediaDevices.getUserMedia({
      video: { width: FRAME_W * 2, height: FRAME_H * 2, frameRate: FRAME_FPS },
      audio: false,
    });
  } catch {
    return null;
  }
  sharedVideo = document.createElement('video');
  sharedVideo.muted = true;
  sharedVideo.playsInline = true;
  sharedVideo.srcObject = sharedStream;
  await sharedVideo.play();

  const canvas = document.createElement('canvas');
  canvas.width = FRAME_W;
  canvas.height = FRAME_H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  const timer = setInterval(() => {
    if (!sharedVideo) return;
    ctx.drawImage(sharedVideo, 0, 0, FRAME_W, FRAME_H);
    const { data } = ctx.getImageData(0, 0, FRAME_W, FRAME_H);
    onFrame(
      new Uint8Array(data.buffer.slice(0)),
      performance.timeOrigin * 1e3 + performance.now() * 1e3,
    );
  }, 1000 / FRAME_FPS);

  return {
    stop() {
      clearInterval(timer);
      sharedStream?.getTracks().forEach((t) => t.stop());
      sharedStream = null;
      sharedVideo = null;
    },
  };
}

/* ---------------------------------- styles ---------------------------------- */

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 8, 7, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    backgroundColor: P.inkElevated,
    borderWidth: 1,
    borderColor: P.line,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 12,
  },
  stage: {
    alignItems: 'center',
  },
  consentIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: P.accentSoft,
    borderWidth: 1,
    borderColor: P.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 22,
    marginBottom: 10,
  },
  body: {
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  bulletList: {
    alignSelf: 'stretch',
    marginTop: 16,
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: P.line,
  },
  bullet: {
    fontFamily: FONTS.body,
    color: P.textSoft,
    fontSize: 13,
    lineHeight: 19,
  },
  simNote: {
    fontFamily: FONTS.bodyMedium,
    color: P.warn,
    fontSize: 12,
    marginTop: 12,
  },
  errorText: {
    fontFamily: FONTS.bodyMedium,
    color: P.danger,
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  primary: {
    marginTop: 20,
    backgroundColor: P.accent,
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  primaryFlex: {
    flex: 1,
    marginTop: 0,
  },
  primaryDisabled: {
    opacity: 0.4,
  },
  primaryText: {
    fontFamily: FONTS.bodyBold,
    color: P.ink,
    fontSize: 15,
  },
  ghost: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  ghostText: {
    fontFamily: FONTS.bodyMedium,
    color: P.textMuted,
    fontSize: 14,
  },
  cameraFrame: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: P.ink,
    borderWidth: 1,
    borderColor: P.line,
  },
  cameraPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  placeholderText: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: P.accent,
    opacity: 0.5,
  },
  readouts: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    alignSelf: 'stretch',
  },
  readout: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: 'rgba(180, 210, 195, 0.05)',
    padding: 12,
    gap: 4,
  },
  readoutLabel: {
    fontFamily: FONTS.bodyMedium,
    color: P.textMuted,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  readoutValue: {
    fontFamily: FONTS.display,
    color: P.text,
    fontSize: 26,
    lineHeight: 30,
  },
  readoutUnit: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 12,
  },
  progressTrack: {
    alignSelf: 'stretch',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(180, 210, 195, 0.12)',
    marginTop: 18,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: P.accent,
    borderRadius: 2,
  },
  hint: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  rowButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: 18,
    gap: 8,
  },
});
