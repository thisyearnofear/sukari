export interface DigestEnv {
  DIGEST?: {
    put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
    get: (key: string) => Promise<string | null>;
  };
}

export interface WeeklyDigestPayload {
  weekKey: string;
  adherence: Record<string, unknown>;
  missionsCompleted: number;
  missionsAssigned: number;
  practiceSessions: number;
  topBehaviours: string[];
  wins: string[];
  concerns: string[];
  narrative?: string;
  createdAt: number;
}

/** In-memory fallback when KV not bound (local/dev) */
const memoryDigests = new Map<string, WeeklyDigestPayload>();

function tokenFor(weekKey: string): string {
  return `d-${weekKey}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function handleDigestCreate(req: Request, env: DigestEnv): Promise<Response> {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const digest = body.digest as WeeklyDigestPayload | undefined;
  if (!digest?.weekKey) {
    return Response.json({ ok: false, error: 'Missing digest' }, { status: 400 });
  }

  // Strip anything that looks like raw glucose
  const safe: WeeklyDigestPayload = {
    weekKey: digest.weekKey,
    adherence: digest.adherence || {},
    missionsCompleted: digest.missionsCompleted || 0,
    missionsAssigned: digest.missionsAssigned || 0,
    practiceSessions: digest.practiceSessions || 0,
    topBehaviours: (digest.topBehaviours || []).slice(0, 5),
    wins: (digest.wins || []).slice(0, 5),
    concerns: (digest.concerns || []).slice(0, 5),
    narrative: String(digest.narrative || '').slice(0, 800),
    createdAt: digest.createdAt || Date.now(),
  };

  const token = tokenFor(safe.weekKey);

  if (env.DIGEST && typeof env.DIGEST.put === 'function') {
    await env.DIGEST.put(token, JSON.stringify(safe), { expirationTtl: 60 * 60 * 24 * 30 });
  } else {
    memoryDigests.set(token, safe);
  }

  return Response.json({
    ok: true,
    token,
    urlPath: `/digest/${token}`,
    digest: safe,
  });
}

export async function handleDigestGet(token: string, env: DigestEnv): Promise<Response> {
  if (!token || token.length < 6) {
    return Response.json({ ok: false, error: 'Invalid token' }, { status: 400 });
  }

  let raw: string | null = null;
  if (env.DIGEST && typeof env.DIGEST.get === 'function') {
    raw = await env.DIGEST.get(token);
  } else {
    const mem = memoryDigests.get(token);
    if (mem) return Response.json({ ok: true, digest: mem });
  }

  if (!raw) {
    return Response.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  try {
    return Response.json({ ok: true, digest: JSON.parse(raw) });
  } catch {
    return Response.json({ ok: false, error: 'Corrupt digest' }, { status: 500 });
  }
}
