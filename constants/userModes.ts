import { UserMode, UserModeConfig } from '@/types/game';

export const USER_MODE_CONFIGS: Record<UserMode, UserModeConfig> = {
    personal: {
      id: 'personal',
      name: 'Living with it',
      icon: '🛡️',
      description: 'Missions and coaching for your own metabolic programme',
      subtitle: 'Type 2 diabetes, prediabetes, or metabolic care — for you',
      narrative: {
        onboarding: 'You’ll get one daily mission from your patterns, then do it in real life.',
        tier2ResultsHero: 'YOU PRACTICED',
        tier3ResultsHero: 'YOUR HABIT LOOP IS LIVE',
      },
    },
    caregiver: {
      id: 'caregiver',
      name: 'Supporting them',
      icon: '🤝',
      description: 'Missions to help someone you care for, without monitoring or nagging',
      subtitle: 'Walk one decision alongside them — no surveillance',
      narrative: {
        onboarding: 'You’ll get one daily mission to support their programme — one concrete action, no monitoring.',
        tier2ResultsHero: 'YOU SUPPORTED',
        tier3ResultsHero: 'YOUR SUPPORT LOOP IS LIVE',
      },
    },
    curious: {
      id: 'curious',
      name: 'Just curious',
      icon: '🌱',
      description: 'See the loop: pattern, one experiment, real-world action, measured response',
      subtitle: 'A grounded look at how metabolic care actually works',
      narrative: {
        onboarding: 'You’ll see the loop: one pattern, one experiment, one real-world action, then a measured response.',
        tier2ResultsHero: 'YOU TRIED IT',
        tier3ResultsHero: 'YOU SAW THE LOOP',
      },
    },
  };

export function getUserModeConfig(mode: UserMode): UserModeConfig {
  return USER_MODE_CONFIGS[mode];
}
