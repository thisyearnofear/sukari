/**
 * Single source of truth for the optional Sukari API base URL.
 */
export function getWorkerBaseUrl(): string {
  const url =
    process.env.EXPO_PUBLIC_SUKARI_API_URL ||
    // Existing deployments can migrate without losing optional coach/digest access.
    process.env.EXPO_PUBLIC_LEADERBOARD_WORKER_URL ||
    process.env.EXPO_PUBLIC_LEADERBOARD_API_URL ||
    '';
  return url.replace(/\/$/, '');
}

export function getAppBaseUrl(): string {
  return (process.env.EXPO_PUBLIC_APP_URL || 'https://glucosewars.netlify.app').replace(/\/$/, '');
}
