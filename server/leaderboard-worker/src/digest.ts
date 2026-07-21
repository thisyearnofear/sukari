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
  topBehaviours: string[];
  wins: string[];
  concerns: string[];
  narrative?: string;
  createdAt: number;
  patientLabel?: string;
  dataCoverage?: string;
  recurringPatterns?: string[];
  changesSinceLastWeek?: string[];
  patientBarriers?: string[];
  safetyFlags?: string[];
  outreachRecommended?: boolean;
  outreachReason?: string;
  experimentsTried?: { action: string; completed: number; associatedNote: string }[];
  mode?: 'patient' | 'clinician';
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

  // Strip anything that looks like raw glucose; pass clinician fields through when present
  const safe: WeeklyDigestPayload = {
    weekKey: digest.weekKey,
    adherence: digest.adherence || {},
    missionsCompleted: digest.missionsCompleted || 0,
    missionsAssigned: digest.missionsAssigned || 0,
    topBehaviours: (digest.topBehaviours || []).slice(0, 5),
    wins: (digest.wins || []).slice(0, 5),
    concerns: (digest.concerns || []).slice(0, 5),
    narrative: String(digest.narrative || '').slice(0, 800),
    createdAt: digest.createdAt || Date.now(),
    patientLabel: digest.patientLabel ? String(digest.patientLabel).slice(0, 120) : undefined,
    dataCoverage: digest.dataCoverage ? String(digest.dataCoverage).slice(0, 240) : undefined,
    recurringPatterns: Array.isArray(digest.recurringPatterns)
      ? digest.recurringPatterns.map(String).slice(0, 5)
      : undefined,
    changesSinceLastWeek: Array.isArray(digest.changesSinceLastWeek)
      ? digest.changesSinceLastWeek.map(String).slice(0, 5)
      : undefined,
    patientBarriers: Array.isArray(digest.patientBarriers)
      ? digest.patientBarriers.map(String).slice(0, 5)
      : undefined,
    safetyFlags: Array.isArray(digest.safetyFlags)
      ? digest.safetyFlags.map(String).slice(0, 5)
      : undefined,
    outreachRecommended: Boolean(digest.outreachRecommended),
    outreachReason: digest.outreachReason ? String(digest.outreachReason).slice(0, 400) : undefined,
    experimentsTried: Array.isArray(digest.experimentsTried)
      ? digest.experimentsTried.slice(0, 5)
      : undefined,
    mode: digest.mode === 'clinician' ? 'clinician' : 'patient',
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
