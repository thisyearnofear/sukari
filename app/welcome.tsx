import { Redirect } from 'expo-router';

/** Retired surface — the programme home is the only entry point. */
export default function WelcomeRedirect() {
  return <Redirect href="/" />;
}
