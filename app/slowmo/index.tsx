import { Redirect } from 'expo-router';

/** Retired: planning mode is outside Sukari's one-mission daily loop. */
export default function SlowMoRedirect() {
  return <Redirect href="/" />;
}
