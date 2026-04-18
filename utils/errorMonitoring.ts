/**
 * Error monitoring service — wraps Sentry for crash reporting.
 * Falls back to console.error when Sentry is not configured.
 *
 * Configure via EXPO_PUBLIC_SENTRY_DSN in .env
 */

let sentry: any = null;
let initialized = false;

export async function initErrorMonitoring() {
  if (initialized) return;
  initialized = true;

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    console.log('[ErrorMonitoring] No SENTRY_DSN configured — using console fallback');
    return;
  }

  try {
    sentry = await import('@sentry/react-native');
    sentry.init({
      dsn,
      tracesSampleRate: 0.2,
      enableAutoSessionTracking: true,
    });
  } catch (err) {
    console.warn('[ErrorMonitoring] Failed to init Sentry:', err);
  }
}

export function captureException(error: Error, context?: Record<string, any>) {
  if (sentry) {
    if (context) sentry.withScope((scope: any) => {
      Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
      sentry.captureException(error);
    });
    else sentry.captureException(error);
  } else {
    console.error('[ErrorMonitoring]', error, context);
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (sentry) sentry.captureMessage(message, level);
  else console.log(`[ErrorMonitoring:${level}]`, message);
}
