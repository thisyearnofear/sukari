# Sukari Architecture

Sukari is a React Native Expo app with a local-first adherence loop and optional worker-backed coaching/digest publishing. The current product spine is:

```text
signal or demo pattern
  -> programme mission
  -> optional mission-specific rehearsal
  -> transfer / completion
  -> measured response
  -> care-team exception view
```

## Product Surfaces

- `app/index.tsx`: value-first entry and programme home.
- `components/game/HeroIntro.tsx`: first-run value proposition.
- `components/game/MainMenu.tsx`: role selection, pattern import/demo choice, mission card, and rehearsal entry.
- `app/(game)/battle.tsx`: rehearsal route.
- `components/programme/MissionRibbon.tsx`: keeps the real-world mission visible during practice.
- `components/programme/TransferBeat.tsx`: done/later handoff from practice to real life.
- `domain/agent/`: patient-visible decision trace and vetted media brief contracts.
- `components/programme/MissionVisual.tsx`: local visual cue with optional Runware-generated mission illustration.
- `app/digest/[token].tsx`: patient/care-team digest view.
- `app/care.tsx`: desktop-first programme-operator surface.

Retired routes such as `game-selection` and `slowmo` redirect out of the shipped experience. They should not regain primary navigation without a deliberate product decision.

## Domain Map

```text
domain/
  coach/       habit-scope coach and clinical safety boundary
  agent/       explainable decision trace and non-sensitive media briefs
  config/      worker and app URL helpers
  demo/        deterministic Maya demo data
  digest/      weekly summary payloads, publishing, and local history
  invite/      supporter invite flows
  media/       optional mission-media client
  patterns/    observational pattern types and field state mapping
  programme/   mission templates, mission selection, transfer logic
  signals/     CGM or snapshot abstractions
```

Domain code should remain pure TypeScript and should not import React Native or Expo UI.

## State

`PlayerProgressProvider` wraps the app in `app/_layout.tsx` and persists progress through `usePlayerProgress`. It is the single source of truth for role, selected mission, progress, and local programme state.

`GameSessionProvider` is scoped to the `(game)` route group and holds transient battle state.

Care digests are persisted locally in `domain/digest/client.ts`:

- last digest for backwards compatibility;
- bounded digest history for the care-team panel;
- optional remote publish through the existing worker digest endpoint.

## Instrumentation

Analytics are wrapped through the app's tracking utility and should remain optional. The current funnel is:

- `value_proposition_completed`
- `value_to_role_completed`
- `role_selected`
- `role_to_mission_accepted`
- `mission_accepted_to_rehearsal_started`
- `rehearsal_to_real_world_completion`
- `completion_to_measured_response`
- `measured_response_to_care_team_exception`
- `care_panel_opened`
- `care_outreach_reviewed`

Supporting events include `agent_trace_opened` and `practice_started`. They measure progressive disclosure and optional rehearsal use; they do not replace the core completion funnel.

Do not add new funnel names casually. Prefer extending properties on these events unless a new product boundary is introduced.

## Care-Team Architecture

The current care panel is local-first and intentionally conservative. It reads stored weekly digests on the device and can open an explicit synthetic demo cohort.

A production cohort product needs:

- authenticated provider identity;
- patient consent and programme enrollment;
- provider-scoped access control;
- audit logs for digest views and outreach actions;
- HIPAA-ready persistence and retention policy;
- clear separation between raw glucose data and derived adherence evidence.

Do not expose multi-patient care data through public `EXPO_PUBLIC_*` client secrets or unauthenticated worker routes.

## Mission Media

`POST /media/mission-image` is an optional worker route backed by Runware. It accepts only an approved mission `templateId` and a small `visualIntent` enum. The server maps those values to fixed prompts, so it never transmits raw readings, patient identifiers, or free-form health notes to the media provider. The app always has a local visual fallback.

## Legacy Removals

The following shipped surfaces were removed, replaced, or redirected out of the active experience:

- Beam SDK and wallet providers.
- Web3 context and contract utilities.
- NFT/treasury/mint surfaces.
- leaderboard and challenge-era UI.
- VRF hooks and fairness UI.
- dead scroll integration code.

Historical docs may mention these systems, but new product work should treat them as archive material unless explicitly revived.

## Engineering Gates

Baseline gates before pilots:

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
npm run build:web
```

Recent fixes include the Jest AsyncStorage mock, the `AnimatedBackground` hook-order violation, optional native module typing, and TypeScript cleanup after legacy Web3 removal.

## Compatibility Notes

The user-facing product name is Sukari. The Expo slug, package name, storage keys, and deep-link scheme may still contain `glucosewars` where changing them would break installed clients, OAuth redirects, or local data migration.
