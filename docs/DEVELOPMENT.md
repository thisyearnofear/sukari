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
- Demo patterns must be clearly labelled.
- Desktop care is an operator surface, not a stretched patient view.
- Legacy Beam/Web3/NFT/leaderboard/challenge and combat/kingdom game language should not appear in shipped navigation or primary copy.
- Mira remains habit-scope only in Sukari. Never dosing, diagnosis, urgent-care substitution, or implied access to another Famile product.

## Repo Map

```text
app/
  index.tsx            value-first entry and home
  care.tsx             programme-operator care surface
  digest/[token].tsx   weekly digest view
components/
  game/                intro, home composition (legacy folder name)
  programme/           mission card, loop strip, quiet win
domain/
  coach/               Mira's habit-scope capability and clinical boundary
  digest/              weekly digest client/types
  patterns/            signal patterns and field state
  programme/           mission templates and selection
hooks/
  usePlayerProgress.ts local progress and programme persistence
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
