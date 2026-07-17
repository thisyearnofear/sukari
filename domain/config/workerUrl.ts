/**
 * Single source of truth for Adherence OS / leaderboard worker base URL.
 */
export function getWorkerBaseUrl(): string {
  const url =
    process.env.EXPO_PUBLIC_LEADERBOARD_WORKER_URL ||
    process.env.EXPO_PUBLIC_WORKER_URL ||
    process.env.EXPO_PUBLIC_LEADERBOARD_API_URL ||
    '';
  return url.replace(/\/$/, '');
}

export function getAppBaseUrl(): string {
  return (process.env.EXPO_PUBLIC_APP_URL || 'https://glucosewars.app').replace(/\/$/, '');
}
