/**
 * Coach endpoints — LLM mission copy + constrained chat.
 * Behaviour targets always come from known template ids (never invented dosing).
 */

const ALLOWED_TEMPLATES = [
  'protein_first',
  'post_meal_walk',
  'reject_liquid_sugar',
  'pair_carbs',
  'steady_evening',
  'ally_rally',
  'caregiver_support',
] as const;

type TemplateId = (typeof ALLOWED_TEMPLATES)[number];

const SYSTEM = `You are the Alchemist in Glucose Wars — a warm, concise adherence coach for at-home metabolic programmes.
Never give insulin, medication, or dosing advice. Never diagnose.
If the user describes an emergency, set escalate true.
Stay under 80 words for chat. For mission selection, pick ONE templateId from the allowed list and rewrite copy lightly.`;

export interface CoachEnv {
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
}

interface OpenAIResult {
  content: string | null;
  error?: string;
  status?: number;
}

function isAllowedTemplate(id: unknown): id is TemplateId {
  return typeof id === 'string' && (ALLOWED_TEMPLATES as readonly string[]).includes(id);
}

async function callOpenAI(
  env: CoachEnv,
  messages: { role: string; content: string }[],
  json = false,
): Promise<OpenAIResult> {
  if (!env.OPENAI_API_KEY) {
    return { content: null, error: 'OPENAI_API_KEY missing on worker' };
  }
  const model = env.OPENAI_MODEL || 'gpt-4o-mini';
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages,
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
    });
    const raw = await res.text();
    if (!res.ok) {
      let detail = raw.slice(0, 240);
      try {
        const parsed = JSON.parse(raw);
        detail = parsed?.error?.message || detail;
      } catch {
        /* keep slice */
      }
      return { content: null, status: res.status, error: detail };
    }
    const data = JSON.parse(raw) as any;
    return { content: data?.choices?.[0]?.message?.content ?? null, status: res.status };
  } catch (e: any) {
    return { content: null, error: e?.message || 'OpenAI fetch failed' };
  }
}

export async function handleCoachMission(req: Request, env: CoachEnv): Promise<Response> {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const allowed = ALLOWED_TEMPLATES.join(', ');
  const prompt = `Pick one templateId from: [${allowed}].
userMode=${body.userMode || 'personal'}
signal=${JSON.stringify(body.signalMinimized || {})}
adherence=${JSON.stringify(body.adherenceWeek || {})}
lastTemplate=${body.lastMissionTemplateId || 'none'}
Prefer a different template than lastTemplate when possible.
Caregiver mode should prefer caregiver_support.
Return JSON: { "templateId": "...", "realmCopy": "...", "realWorldAction": "...", "transferHint": "...", "caregiverSupportAction": "...", "insights": ["..."] }`;

  const ai = await callOpenAI(
    env,
    [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: prompt },
    ],
    true,
  );

  if (!ai.content) {
    return Response.json({
      ok: true,
      source: 'rules',
      templateId: body.userMode === 'caregiver' ? 'caregiver_support' : 'protein_first',
      insights: ['Cloud Alchemist offline — using programme defaults.'],
      openai_status: ai.status ?? null,
      openai_error: ai.error ?? null,
    });
  }

  try {
    const parsed = JSON.parse(ai.content);
    const templateId = isAllowedTemplate(parsed.templateId)
      ? parsed.templateId
      : 'protein_first';
    return Response.json({
      ok: true,
      source: 'llm',
      templateId,
      realmCopy: parsed.realmCopy,
      realWorldAction: parsed.realWorldAction,
      transferHint: parsed.transferHint,
      caregiverSupportAction: parsed.caregiverSupportAction,
      insights: Array.isArray(parsed.insights) ? parsed.insights.slice(0, 3) : [],
    });
  } catch {
    return Response.json({
      ok: true,
      source: 'rules',
      templateId: 'ally_rally',
      insights: ['Could not parse coach response — default mission applied.'],
    });
  }
}

export async function handleCoachChat(req: Request, env: CoachEnv): Promise<Response> {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const message = String(body.message || '').slice(0, 500);
  if (!message) return Response.json({ ok: false, error: 'Missing message' }, { status: 400 });

  const lower = message.toLowerCase();
  const dosingAsk =
    /how much insulin|units of|dose my|bolus|basal rate|prescribe/.test(lower);
  if (dosingAsk) {
    return Response.json({
      ok: true,
      refused: true,
      escalate: false,
      reply:
        'I can’t help with medication or insulin dosing. Ask your care team for that — I can only help with today’s habit mission.',
    });
  }

  const emergency =
    /chest pain|can't breathe|unconscious|seizure|suicide|overdose|severe hypo/.test(lower);
  if (emergency) {
    return Response.json({
      ok: true,
      refused: false,
      escalate: true,
      reply:
        'This sounds urgent. Contact your care team or local emergency services now. I can only support everyday programme habits.',
    });
  }

  const mission = body.mission
    ? `Active mission: ${body.mission.realWorldAction || body.mission.realmCopy}`
    : 'No active mission';
  const ai = await callOpenAI(env, [
    { role: 'system', content: SYSTEM },
    {
      role: 'user',
      content: `${mission}\nSignal: ${JSON.stringify(body.signalMinimized || {})}\nUser: ${message}\nReply helpfully in under 80 words.`,
    },
  ]);

  if (!ai.content) {
    return Response.json({
      ok: true,
      reply: body.mission?.realWorldAction
        ? `Start with today’s ask: ${body.mission.realWorldAction}`
        : 'Practice one short battle, then do one real-world habit tonight.',
      openai_status: ai.status ?? null,
      openai_error: ai.error ?? null,
    });
  }

  return Response.json({ ok: true, reply: ai.content, refused: false, escalate: false });
}
