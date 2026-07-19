import { handleCoachChat, handleCoachChatStream, handleCoachMission } from './coach';
import { handleDigestCreate, handleDigestGet } from './digest';
import { handleMissionImage } from './media';

export interface Env {
  LEADERBOARD: DurableObjectNamespace;
  DIGEST?: KVNamespace;
  ALLOWED_ORIGINS?: string;
  API_SECRET?: string;
  RUNWARE_API_KEY?: string;
  RUNWARE_MODEL?: string;
  RUNWARE_IMAGE_MODEL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
}

type ScoreResult = 'victory' | 'defeat';

// Anti-cheat: max plausible score per second of gameplay
const MAX_SCORE_PER_SECOND = 15;
// Max tier duration
const MAX_GAME_DURATION = 120;

export interface SubmitScoreBody {
  challengeId: string;
  playerId: string;
  score: number;
  result: ScoreResult;
  duration?: number;
  meta?: Record<string, any>;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName?: string;
  score: number;
  result?: ScoreResult;
  createdAt: number;
}

function jsonResponse(data: any, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init?.headers || {}),
    },
  });
}

function withCors(req: Request, env: Env, res: Response) {
  const origin = req.headers.get("origin") || "";
  const allow = env.ALLOWED_ORIGINS || "*";

  let allowOrigin = "*";
  if (allow !== "*") {
    const allowed = allow
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (allowed.includes(origin)) allowOrigin = origin;
    else allowOrigin = allowed[0] || "";
  }

  const headers = new Headers(res.headers);
  if (allowOrigin) headers.set("access-control-allow-origin", allowOrigin);
  headers.set("access-control-allow-methods", "GET,POST,OPTIONS");
  headers.set("access-control-allow-headers", "content-type");
  headers.set("access-control-max-age", "86400");

  return new Response(res.body, { status: res.status, headers });
}

function badRequest(message: string) {
  return jsonResponse({ ok: false, error: message }, { status: 400 });
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isValidId(s: unknown) {
  return typeof s === "string" && s.length >= 3 && s.length <= 128;
}

async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export class LeaderboardDO {
  state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    if (req.method === "GET" && path === "/leaderboard") {
      const limit = clamp(Number(url.searchParams.get("limit") || "10"), 1, 50);
      const list = (await this.state.storage.get<LeaderboardEntry[]>("scores")) || [];
      const top = list.slice(0, limit).map((e, idx) => ({ ...e, rank: idx + 1 }));
      return jsonResponse(top);
    }

    if (req.method === "POST" && path === "/score") {
      const body = await readJson<SubmitScoreBody>(req);
      if (!body) return badRequest("Invalid JSON");
      if (!isValidId(body.challengeId)) return badRequest("Invalid challengeId");
      if (!isValidId(body.playerId)) return badRequest("Invalid playerId");
      if (typeof body.score !== "number" || !Number.isFinite(body.score)) return badRequest("Invalid score");
      if (body.score < 0) return badRequest("Score cannot be negative");

      // Anti-cheat: reject implausibly high scores
      const duration = body.duration ?? MAX_GAME_DURATION;
      const maxPlausible = duration * MAX_SCORE_PER_SECOND;
      if (body.score > maxPlausible) return badRequest("Score exceeds plausible maximum");

      // Rate limit: one submission per player per 10 seconds
      const rateKey = `rate:${body.playerId}`;
      const lastSubmit = await this.state.storage.get<number>(rateKey);
      if (lastSubmit && Date.now() - lastSubmit < 10_000) {
        return jsonResponse({ ok: false, error: "Too many submissions" }, { status: 429 });
      }
      await this.state.storage.put(rateKey, Date.now());

      const entry: LeaderboardEntry = {
        rank: 0,
        playerId: body.playerId,
        score: Math.floor(body.score),
        result: body.result === "victory" ? "victory" : "defeat",
        createdAt: Date.now(),
      };

      const list = (await this.state.storage.get<LeaderboardEntry[]>("scores")) || [];

      // Keep best score per player to reduce spam
      const existingIdx = list.findIndex((e) => e.playerId === entry.playerId);
      if (existingIdx >= 0) {
        if (list[existingIdx].score >= entry.score) {
          return jsonResponse({ ok: true, ignored: true });
        }
        list.splice(existingIdx, 1);
      }

      list.push(entry);
      list.sort((a, b) => b.score - a.score);
      const trimmed = list.slice(0, 50);
      await this.state.storage.put("scores", trimmed);

      return jsonResponse({ ok: true });
    }

    return jsonResponse({ ok: false, error: "Not found" }, { status: 404 });
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      return withCors(req, env, new Response(null, { status: 204 }));
    }

    // Health
    if (req.method === "GET" && url.pathname === "/health") {
      return withCors(req, env, jsonResponse({ ok: true }));
    }

    // Public API:
    // POST /score { challengeId, playerId, score, result, meta? }
    // GET /leaderboard?challengeId=...&limit=10
    if (url.pathname === "/score") {
      const body = await readJson<SubmitScoreBody>(req);
      if (!body) return withCors(req, env, badRequest("Invalid JSON"));
      if (!isValidId(body.challengeId)) return withCors(req, env, badRequest("Invalid challengeId"));

      const id = env.LEADERBOARD.idFromName(body.challengeId);
      const stub = env.LEADERBOARD.get(id);
      const res = await stub.fetch("https://do/score", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      return withCors(req, env, res);
    }

    if (url.pathname === "/leaderboard") {
      const challengeId = url.searchParams.get("challengeId");
      const limit = url.searchParams.get("limit") || "10";
      if (!isValidId(challengeId)) return withCors(req, env, badRequest("Missing/invalid challengeId"));

      const id = env.LEADERBOARD.idFromName(challengeId!);
      const stub = env.LEADERBOARD.get(id);
      const res = await stub.fetch(`https://do/leaderboard?limit=${encodeURIComponent(limit)}`, { method: "GET" });
      return withCors(req, env, res);
    }

    // Adherence OS: coach + weekly digest
    if (req.method === "POST" && url.pathname === "/coach/mission") {
      const res = await handleCoachMission(req, env);
      return withCors(req, env, res);
    }
    if (req.method === "POST" && url.pathname === "/coach/chat") {
      const res = await handleCoachChat(req, env);
      return withCors(req, env, res);
    }
    if (req.method === "POST" && url.pathname === "/coach/chat/stream") {
      const res = await handleCoachChatStream(req, env);
      return withCors(req, env, res);
    }
    if (req.method === "POST" && url.pathname === "/media/mission-image") {
      const res = await handleMissionImage(req, env);
      return withCors(req, env, res);
    }
    if (req.method === "POST" && url.pathname === "/digest/weekly") {
      const res = await handleDigestCreate(req, env);
      return withCors(req, env, res);
    }
    if (req.method === "GET" && url.pathname.startsWith("/digest/")) {
      const token = url.pathname.replace("/digest/", "");
      const res = await handleDigestGet(token, env);
      return withCors(req, env, res);
    }

    return withCors(req, env, jsonResponse({ ok: false, error: "Not found" }, { status: 404 }));
  },
};
