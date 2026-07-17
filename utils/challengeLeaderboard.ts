import { Platform } from 'react-native';
import { getWorkerBaseUrl } from '@/domain/config/workerUrl';
import { ChallengeScoreEntry } from '@/types/challenge';

export interface SubmitChallengeScoreInput {
  challengeId: string;
  playerId: string;
  score: number;
  result: 'victory' | 'defeat';
  meta?: Record<string, any>;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName?: string;
  score: number;
  result?: 'victory' | 'defeat';
  createdAt?: number;
}

const API_URL = getWorkerBaseUrl();

export function isGlobalLeaderboardEnabled() {
  return !!API_URL && Platform.OS === 'web';
}

/**
 * Client-side integration point for a global leaderboard service.
 *
 * NOTE:
 * Beam Player API (as exposed via @onbeam/sdk in this repo) does not provide a
 * "query top scores" endpoint, so we need a small backend service for global leaderboards.
 */
export async function submitChallengeScore(input: SubmitChallengeScoreInput): Promise<boolean> {
  if (!API_URL) return false;
  try {
    const res = await fetch(`${API_URL}/score`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchChallengeLeaderboard(challengeId: string, limit: number = 10): Promise<LeaderboardEntry[] | null> {
  if (!API_URL) return null;
  try {
    const url = new URL(`${API_URL}/leaderboard`);
    url.searchParams.set('challengeId', challengeId);
    url.searchParams.set('limit', String(limit));

    const res = await fetch(url.toString(), { method: 'GET' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    return data as LeaderboardEntry[];
  } catch {
    return null;
  }
}

export function toLocalEntry(entry: ChallengeScoreEntry) {
  return {
    challengeId: entry.challengeId,
    playerId: entry.playerId,
    score: entry.score,
    result: entry.result,
    createdAt: entry.createdAt,
  };
}

