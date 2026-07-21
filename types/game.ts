// User mode - personalization for different player types
export type UserMode = 'personal' | 'caregiver' | 'curious';

export interface UserModeConfig {
  id: UserMode;
  name: string;
  icon: string;
  description: string;
  subtitle: string;
  narrative: {
    onboarding: string;
    tier2ResultsHero: string;
    tier3ResultsHero: string;
  };
}

// Input mode preference (kept for the home settings surface; no longer tied to a game).
export type ControlMode = 'swipe' | 'tap';
