import { UserMode, UserModeConfig, FoodType, SwipeAction } from '@/types/game';

// Mode-specific in-game reflections
export interface ReflectionMessage {
  trigger: 'ally_consumed' | 'enemy_rejected' | 'balanced_choice' | 'pairing' | 'optimal_swipe';
  text: string;
  science?: string; // Educational fact
}

export const MODE_REFLECTIONS: Record<UserMode, ReflectionMessage[]> = {
  personal: [
    {
      trigger: 'ally_consumed',
      text: 'You paired carbs with protein - smart!',
      science: 'Protein slows glucose absorption, preventing spikes.',
    },
    {
      trigger: 'enemy_rejected',
      text: 'Rejecting pure sugar keeps your glucose stable.',
      science: 'Simple carbs spike blood sugar in minutes.',
    },
    {
      trigger: 'balanced_choice',
      text: 'You\'re finding YOUR body\'s balance.',
      science: 'Everyone responds differently to foods—notice your patterns.',
    },
    {
      trigger: 'pairing',
      text: 'This combo works for YOUR metabolism.',
      science: 'Timing matters: eat carbs LAST for steadier glucose.',
    },
    {
      trigger: 'optimal_swipe',
      text: 'Perfect timing! You\'re learning what your body needs.',
      science: 'Consistency builds better glucose patterns over time.',
    },
  ],
  caregiver: [
    {
      trigger: 'ally_consumed',
      text: 'See the glucose spike from carbs?',
      science: 'Their insulin works 15 mins later—that\'s why timing matters.',
    },
    {
      trigger: 'enemy_rejected',
      text: 'Pure sugar without fiber is why they avoid these.',
      science: 'Their body processes glucose differently—they need structure.',
    },
    {
      trigger: 'balanced_choice',
      text: 'This is what THEY manage daily—impressive, right?',
      science: 'Glucose management requires constant decision-making.',
    },
    {
      trigger: 'pairing',
      text: 'They pair foods strategically to prevent crashes.',
      science: 'This is active diabetes management in action.',
    },
    {
      trigger: 'optimal_swipe',
      text: 'Now you understand why they check blood sugar often.',
      science: 'Small decisions compound into better health outcomes.',
    },
  ],
  curious: [
    {
      trigger: 'ally_consumed',
      text: 'Whole grains release glucose slowly—stable energy.',
      science: 'Fiber in complex carbs reduces glucose spikes by 50%.',
    },
    {
      trigger: 'enemy_rejected',
      text: 'Pure sugar hits the bloodstream fast—that\'s the spike.',
      science: 'Refined carbs have no fiber to slow absorption.',
    },
    {
      trigger: 'balanced_choice',
      text: 'Balance is the key to stable glucose.',
      science: 'No food is "bad"—it\'s about balance and timing.',
    },
    {
      trigger: 'pairing',
      text: 'Pairing carbs with protein/fat dramatically slows glucose rise.',
      science: 'This is called the "glycemic load"—composition matters.',
    },
    {
      trigger: 'optimal_swipe',
      text: 'You\'re understanding glucose management through experience.',
      science: 'This is how 1 in 10 people manage health daily.',
    },
  ],
};

export const USER_MODE_CONFIGS: Record<UserMode, UserModeConfig> = {
    personal: { 
      id: 'personal',
      name: 'Living with it',
      icon: '🛡️',
      description: 'Missions and coaching for your own metabolic programme',
      subtitle: 'Type 2 diabetes, prediabetes, or metabolic care — for you',
      narrative: {
        onboarding: 'You’ll get one daily mission from your patterns, rehearse it briefly, then do it in real life.',
        tier2ResultsHero: 'YOU PRACTICED',
        tier3ResultsHero: 'YOUR HABIT LOOP IS LIVE',
      },
    },
    caregiver: { 
      id: 'caregiver',
      name: 'Supporting someone',
      icon: '🏰',
      description: 'Support actions that help without nagging',
      subtitle: 'Partner, family, or caregiver alongside their programme',
      narrative: {
        onboarding: 'You’ll practice empathy and one concrete support action tied to their mission.',
        tier2ResultsHero: 'YOU SUPPORTED',
        tier3ResultsHero: 'YOUR PRESENCE HELPED',
      },
    },
    curious: { 
      id: 'curious',
      name: 'Learning the system',
      icon: '🧪',
      description: 'Explore how food, movement, and signals interact',
      subtitle: 'Clinician, coach, or curious learner — demo the loop',
      narrative: {
        onboarding: 'Explore pattern → mission → rehearsal → measured response without claiming clinical efficacy.',
        tier2ResultsHero: 'YOU EXPLORED',
        tier3ResultsHero: 'YOU UNDERSTAND THE LOOP',
      },
    },
};

export function getUserModeConfig(mode: UserMode | null): UserModeConfig | null {
  if (!mode) return null;
  return USER_MODE_CONFIGS[mode];
}

export function getReflectionMessage(
  userMode: UserMode | null,
  trigger: ReflectionMessage['trigger'],
  missionHint?: string | null,
): ReflectionMessage | null {
  if (!userMode) return null;
  const messages = MODE_REFLECTIONS[userMode];
  const matching = messages.filter(m => m.trigger === trigger);
  if (matching.length === 0) return null;
  const base = matching[Math.floor(Math.random() * matching.length)];
  if (!missionHint) return base;
  return {
    ...base,
    text: `${base.text} Today’s mission: ${missionHint}`,
  };
}
