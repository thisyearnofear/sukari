export type ChallengeTier = 'tier1' | 'tier2' | 'tier3';

export type ChallengeModifier =
  | 'fast_spawn'
  | 'slow_spawn'
  | 'fast_fall'
  | 'thin_margins'
  | 'short_combo_window'
  | 'no_powerups';

export interface ChallengeDefinition {
  id: string;
  name: string;
  tier: ChallengeTier;
  seed: string;
  modifiers: ChallengeModifier[];
  createdAt: number;
  createdBy?: string;
  version: number; // forward compatibility
}

export interface ChallengeScoreEntry {
  challengeId: string;
  playerId: string;
  score: number;
  result: 'victory' | 'defeat';
  createdAt: number;
}

