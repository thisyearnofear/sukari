declare module '@sentry/react-native' {
  export function init(options?: Record<string, unknown>): void;
  export function captureException(error: unknown): void;
}

declare module 'expo-health' {
  const Health: Record<string, unknown>;
  export = Health;
}

declare module 'expo-av' {
  export const Audio: Record<string, unknown>;
}
