# Sukari Development

## Setup

```bash
cp .env.example .env
npm install
npx expo start
```

For web export:

```bash
npm run build:web
```

## Quality Gates

Run before committing product changes:

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
```

Run `npm run build:web` when routing, Expo config, or web rendering changes.

## Current Product Rules

- The user-facing product name is Sukari.
- The conversation is the primary patient interface. Mira initiates; the patient responds in natural language. No forms, no buttons, no cards to navigate.
- The care-team work queue is the commercial wedge. It is an active operator surface, not a passive report.
- The closed loop is real: signal → pattern → mission → conversation → patient-reported outcome → outcome-informed adaptation → next mission. Past outcomes inform mission selection; outcome-aware flags and cohort response rates inform operators.
- Patient-reported outcomes are observational, not causal. Never frame them as clinical measurement. A CGM-derived response classifier is a separate, gated step.
- Demo patterns must be clearly labelled.
- Legacy Beam/Web3/NFT/leaderboard/challenge and combat/kingdom game language should not appear in shipped navigation or primary copy.
- Mira remains habit-scope only in Sukari. Never dosing, diagnosis, urgent-care substitution, or implied access to another Famile product.

## Repo Map

```text
app/
  index.tsx            entry point; routes to conversation home
  care.tsx             Mira's work queue (operator surface)
  digest/[token].tsx   weekly digest view
components/
  home/
    ConversationHome.tsx  conversation-first primary patient surface
  game/                home state orchestrator (legacy folder name)
  programme/           mission visuals and cards (used by detail views)
  agent/               MiraOrb visual carrier
domain/
  agent/
    miraPresence.ts        Mira posture vocabulary
    decisionTrace.ts       explainable decision trace
    intentParser.ts        natural language -> mission intents (incl. report_outcome)
    conversationMemory.ts  cross-session context in AsyncStorage
    conversationEngine.ts  state machine + LLM escalation + outcome capture
  coach/               Mira's habit-scope capability and clinical boundary
  cohort/
    types.ts            cohort overview, patient summaries, archetype completion + response rate
    synthetic.ts        deterministic 30-patient demo cohort + archetype aggregation
    workQueue.ts        work item status lifecycle + AsyncStorage (incl. assignedTo)
    miraFlags.ts        proactive flags for care team (incl. outcome_struggle, outcome_positive, outcome_barrier_link)
    team.ts             care team roster (TeamMember) + AsyncStorage
    teamReport.ts       weekly team report aggregation + shareable summary + CSV export
  digest/              weekly digest client/types + longitudinal outcome trend
  patterns/            signal patterns and field state
  programme/           mission templates, outcome-informed selection, PatientReportedOutcome
hooks/
  usePlayerProgress.ts local progress, programme persistence, outcome capture
  useCoach.ts          LLM streaming for free-form conversation
```

## Analytics

PostHog is optional and configured through:

- `EXPO_PUBLIC_POSTHOG_KEY`
- `EXPO_PUBLIC_POSTHOG_HOST`

Keep event names stable for funnel continuity. Current key events are documented in [Architecture](ARCHITECTURE.md).

## Worker

The Cloudflare worker under `server/leaderboard-worker` is named `sukari-leaderboard` (see `wrangler.toml`). In Sukari it is used for optional coach, digest, and mission-media endpoints where configured through `EXPO_PUBLIC_SUKARI_API_URL` or the legacy worker URL environment variable.

Do not add unauthenticated provider cohort access to this worker. A real care-team backend needs authenticated providers, patient consent, role-based access, and audit logging.

## Compatibility

Technical identifiers now use the `sukari` namespace end-to-end:

- Expo slug and scheme: `sukari`.
- package name: `sukari`.
- AsyncStorage keys: `sukari.*` (legacy `glucoseWars.*` keys are migrated on first launch by `utils/storageMigration.ts`).
- worker name: `sukari-leaderboard`.
- public app URL: `https://sukari.famile.xyz` (Netlify site `sukariapp.netlify.com` redirects here).
- Dexcom OAuth redirect URI: `sukari://auth/dexcom` (register this in the Dexcom developer portal).

## Commit Hygiene

- Keep docs aligned with shipped product, not aspirational surfaces.
- Prefer deleting dead product paths over burying them behind CTAs.
- Run the gates before staging broad changes.
