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
- The mission is the primary action on home.
- A patient must see the mission card before rehearsal.
- Demo patterns must be clearly labelled.
- Desktop care is an operator surface, not a stretched patient view.
- Legacy Beam/Web3/NFT/leaderboard/challenge language should not appear in shipped navigation or primary copy.
- Coaching remains habit-scope only. Never dosing, diagnosis, or urgent care substitution.

## Repo Map

```text
app/
  index.tsx            value-first entry and home
  care.tsx             programme-operator care surface
  digest/[token].tsx   weekly digest view
  (game)/              rehearsal flow
components/
  game/                battle, intro, home composition
  programme/           mission, ribbon, transfer, quiet win
domain/
  coach/               habit coach and clinical scope
  digest/              weekly digest client/types
  patterns/            signal patterns and field state
  programme/           mission templates and transfer logic
hooks/
  usePlayerProgress.ts local progress and programme persistence
```

## Analytics

PostHog is optional and configured through:

- `EXPO_PUBLIC_POSTHOG_KEY`
- `EXPO_PUBLIC_POSTHOG_HOST`

Keep event names stable for funnel continuity. Current key events are documented in [Architecture](ARCHITECTURE.md).

## Worker

The existing Cloudflare worker under `server/leaderboard-worker` still contains legacy naming because it originally served leaderboard functionality. In Sukari it is used for coach and digest endpoints where configured.

Do not add unauthenticated provider cohort access to this worker. A real care-team backend needs authenticated providers, patient consent, role-based access, and audit logging.

## Compatibility

Some technical identifiers intentionally remain `glucosewars`:

- Expo slug and scheme.
- package name.
- AsyncStorage keys.
- existing worker URL naming.

Changing these requires a migration plan because they affect installed app behaviour, OAuth redirects, local data, and deployed infrastructure.

## Commit Hygiene

- Keep docs aligned with shipped product, not aspirational surfaces.
- Prefer deleting dead product paths over burying them behind CTAs.
- Preserve local compatibility keys unless a migration is part of the change.
- Run the gates before staging broad changes.
