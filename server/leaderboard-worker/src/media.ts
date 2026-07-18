/**
 * Runware mission-media adapter. Inputs are approved template identifiers and
 * visual intents only: raw glucose series, patient names, and free-form health
 * notes never enter a generative prompt.
 */

import type { CoachEnv } from './coach';

const ALLOWED_TEMPLATES = new Set([
  'protein_first',
  'post_meal_walk',
  'reject_liquid_sugar',
  'pair_carbs',
  'steady_evening',
  'ally_rally',
  'caregiver_support',
]);

type VisualIntent = 'meal' | 'movement' | 'drink' | 'evening' | 'support';
type WorldScene = 'table_choice' | 'after_meal_path' | 'drink_pause' | 'evening_reset' | 'support_space';

const PROMPTS: Record<VisualIntent, string> = {
  meal: 'Editorial health illustration of a balanced everyday meal on a dining table, warm East African light, calm green and blue palette, no text, no medical devices, respectful and realistic',
  movement: 'Editorial health illustration of an adult taking a short walk after dinner in a neighbourhood, warm East African light, calm green and blue palette, no text, respectful and realistic',
  drink: 'Editorial health illustration of a refreshing unsweetened drink beside a daily bag, warm East African light, calm green and blue palette, no text, respectful and realistic',
  evening: 'Editorial health illustration of a calm evening kitchen routine, warm East African light, calm green and blue palette, no text, respectful and realistic',
  support: 'Editorial health illustration of two adults having a kind supportive conversation at home, warm East African light, calm green and blue palette, no text, respectful and realistic',
};

// Scene names are an allowlist, not generated user input. They let the same
// approved mission render differently without sharing a person's raw signal.
const SCENE_PROMPTS: Record<WorldScene, string> = {
  table_choice: 'Editorial health illustration of one considered meal choice on a dining table, warm East African light, calm green and blue palette, no text, no medical devices, respectful and realistic',
  after_meal_path: 'Editorial health illustration of an adult beginning a short walk after a meal on a familiar neighbourhood path, warm East African light, calm green and blue palette, no text, respectful and realistic',
  drink_pause: 'Editorial health illustration of a refreshing unsweetened drink during a small daily pause, warm East African light, calm green and blue palette, no text, respectful and realistic',
  evening_reset: 'Editorial health illustration of a calm, lighter evening kitchen routine, warm East African light, calm green and blue palette, no text, respectful and realistic',
  support_space: 'Editorial health illustration of two adults sharing a kind, practical check-in at home, warm East African light, calm green and blue palette, no text, respectful and realistic',
};

function readImageUrl(payload: any): string | null {
  const items = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
  const url = items.find((item: any) => typeof item?.imageURL === 'string')?.imageURL;
  return typeof url === 'string' ? url : null;
}

export async function handleMissionImage(req: Request, env: CoachEnv & { RUNWARE_IMAGE_MODEL?: string }): Promise<Response> {
  let body: { templateId?: unknown; visualIntent?: unknown; scene?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body.templateId !== 'string' || !ALLOWED_TEMPLATES.has(body.templateId)) {
    return Response.json({ ok: false, error: 'Unsupported mission template' }, { status: 400 });
  }
  const visualIntent = body.visualIntent as VisualIntent;
  if (!Object.prototype.hasOwnProperty.call(PROMPTS, visualIntent)) {
    return Response.json({ ok: false, error: 'Unsupported visual intent' }, { status: 400 });
  }
  const scene = typeof body.scene === 'string' && Object.prototype.hasOwnProperty.call(SCENE_PROMPTS, body.scene)
    ? body.scene as WorldScene
    : null;
  if (!env.RUNWARE_API_KEY) {
    return Response.json({ ok: false, error: 'Mission media is not configured' }, { status: 503 });
  }

  try {
    const res = await fetch('https://api.runware.ai/v1', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RUNWARE_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify([{
        taskType: 'imageInference',
        taskUUID: crypto.randomUUID(),
        model: env.RUNWARE_IMAGE_MODEL || 'runware:101@1',
        positivePrompt: scene ? SCENE_PROMPTS[scene] : PROMPTS[visualIntent],
        width: 768,
        height: 432,
        numberResults: 1,
        includeCost: true,
      }]),
    });
    if (!res.ok) return Response.json({ ok: false, error: 'Media generation failed' }, { status: 502 });
    const imageUrl = readImageUrl(await res.json());
    if (!imageUrl) return Response.json({ ok: false, error: 'No mission image returned' }, { status: 502 });
    return Response.json({ ok: true, imageUrl, provider: 'runware' });
  } catch {
    return Response.json({ ok: false, error: 'Media generation unavailable' }, { status: 502 });
  }
}
