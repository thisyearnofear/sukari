/**
 * AGENCY CHARTER — the published boundary of what the agent may do.
 * Single source of truth for the /charter screen and the lane markers
 * on agent-initiated cards. Most agentic demos hand-wave autonomy;
 * we publish the boundary and render it in the UI.
 * Design authority: docs/PRODUCT_DESIGN.md §4.
 */
export const AGENCY_CHARTER = {
  title: 'What your agent does',
  tagline: 'The agent proposes. The patient disposes.',
  intro:
    'Every card your agent creates carries one of these markers. Tap any marker to return here.',
  lanes: [
    {
      id: 'always',
      tag: 'Autonomous',
      icon: 'flash-outline',
      title: 'Always — acts for you, within scope',
      summary: 'Acts without asking, inside the habits-only boundary.',
      items: [
        'Finds one actionable pattern in your CGM and programme signals',
        'Selects and schedules today’s single mission',
        'Remembers your accepts, eases, swaps and declines — and adapts tomorrow’s difficulty',
        'Follows up once, gently, on a “Later today” promise',
        'Compiles the weekly exception summary for your care team',
        'Watches coach chats for safety language and escalates out of the app',
      ],
    },
    {
      id: 'asks_first',
      tag: 'Proposal',
      icon: 'hand-left-outline',
      title: 'Asks first — nothing changes without you',
      summary: 'Proposes, then waits for your consent.',
      items: [
        'Changing a mission mid-day',
        'Involving a caregiver or support person',
        'Suggesting your care team reach out',
        'Trying a mission category you haven’t used before',
      ],
    },
    {
      id: 'never',
      tag: 'Never',
      icon: 'close-circle-outline',
      title: 'Never — outside scope by design',
      summary: 'Refuses, no matter how the question is phrased.',
      items: [
        'Medication or insulin dosing — ever',
        'Diagnosis of any kind',
        'Shame, penalties or guilt copy',
        'Contacting anyone without your consent',
        'Hiding its reasoning — “Why this?” is always one tap away',
      ],
    },
  ],
  safety:
    'Glucose Wars coaches habits only — never insulin, dosing, or diagnosis. If something feels urgent, contact your care team or emergency services.',
} as const;

export type AgencyLaneId = (typeof AGENCY_CHARTER.lanes)[number]['id'];
export type AgencyLane = (typeof AGENCY_CHARTER.lanes)[number];

export function getAgencyLane(id: AgencyLaneId): AgencyLane {
  const lane = AGENCY_CHARTER.lanes.find((l) => l.id === id);
  if (!lane) throw new Error(`Unknown agency lane: ${id}`);
  return lane;
}
