# Sukari Architecture

Sukari is a React Native Expo app with a local-first adherence loop and optional worker-backed coaching/digest publishing. The current product spine is:

```text
live signal, labelled demo pattern, or private local check-in
  -> bounded pattern and approved programme mission
  -> do now / make easier / later / not practical
  -> completion
  -> measured response
  -> care-team exception view
```

## Product Surfaces

- `app/index.tsx`: value-first entry and programme home.
- `components/game/HeroIntro.tsx`: first-run value proposition.
- `components/game/MainMenu.tsx`: role selection, signal/demo/local check-in choice, and mission card.
- `components/agent/MiraOrb.tsx`: lightweight cross-platform visual carrier for Mira's domain-derived posture.
- `domain/agent/`: Mira presence, patient-visible decision trace, and vetted media brief contracts.
- `components/programme/MissionVisual.tsx`: local visual cue with optional Runware-generated mission illustration.
- `app/digest/[token].tsx`: patient/care-team digest view.
- `app/care.tsx`: desktop-first programme-operator surface.

Retired routes such as `game-selection`, `slowmo`, and the `(game)` route group (battle, onboarding, results) have been removed. They should not regain primary navigation without a deliberate product decision.

## Domain Map

```text
domain/
  coach/       habit-scope coach and clinical safety boundary
  agent/       Mira presence, explainable decision trace, and non-sensitive media briefs
  config/      worker and app URL helpers
  demo/        deterministic Amina demo data
  digest/      weekly summary payloads, publishing, and local history
  invite/      supporter invite flows
  media/       optional mission-media client
  patterns/    observational pattern types and field state mapping
  programme/   mission templates, mission selection
  signals/     CGM or snapshot abstractions
```

Domain code should remain pure TypeScript and should not import React Native or Expo UI.

## State

`PlayerProgressProvider` wraps the app in `app/_layout.tsx` and persists progress through `usePlayerProgress`. It is the single source of truth for role, selected mission, progress, and local programme state. It also persists a mission-bound `worldState` with only: mission ID/template, an approved scene enum, tone enum, response state, and timestamp. The state is discarded whenever the active mission changes.

Care digests are persisted locally in `domain/digest/client.ts`:

- last digest for backwards compatibility;
- bounded digest history for the care-team panel;
- optional remote publish through the existing worker digest endpoint.

## Instrumentation

Analytics are wrapped through the app's tracking utility and should remain optional. The current funnel is:

- `value_proposition_completed`
- `value_to_role_completed`
- `role_selected`
- `signal_path_selected`
- `manual_signal_started`
- `manual_signal_submitted`
- `mission_response_selected`
- `role_to_mission_accepted`
- `mission_made_easier`
- `mission_deferred`
- `completion_to_measured_response`
- `measured_response_to_care_team_exception`
- `care_panel_opened`
- `care_outreach_reviewed`

Supporting events include `agent_trace_opened` and `signal_connection_chosen`. They measure progressive disclosure and connect intent; they do not replace the core completion funnel.

`manual_signal_started` and `manual_signal_submitted` measure the local check-in boundary. The submitted event contains only a bounded moment ID and chosen template ID, never free-form notes or raw health data. `mission_response_selected` normalizes do-now, easier, later, not-practical, and direct-completion choices with a coarse `input_source` (`demo`, `manual`, `cgm`, or `general`).

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

## Signal Intake Boundary

The current Cloudflare Worker is not a patient-data intake service. It supports bounded coach, digest, and mission-media operations only. The shipped manual check-in remains on-device and maps a selected moment to an approved mission template.

The app capability-gates live connection: Dexcom needs an OAuth client ID in the deployed build; Apple Health needs a compatible native device and permission. When neither is available, the UI labels signal connection as a preview and explains the limitation rather than opening a non-functional consent flow.

Before accepting real CGM exports, screenshots, voice notes, or free-form health text, introduce a separate Signal Intake Gateway with provider OAuth, explicit consent, purpose-limited retention, encryption, audit logs, and programme-scoped access control. Do not add those inputs to the current unauthenticated worker.

## Mission Media

`POST /media/mission-image` is an optional worker route backed by Runware and deployed for the submission build. It accepts only an approved mission `templateId`, `visualIntent`, and optional allowlisted `scene` enum. The server maps those values to fixed prompts, so it never transmits raw readings, patient identifiers, or free-form health notes to the media provider. The app always has a local visual fallback.

## Legacy Removals

The following shipped surfaces were removed, replaced, or redirected out of the active experience:

- Beam SDK and wallet providers.
- Web3 context and contract utilities.
- NFT/treasury/mint surfaces.
- leaderboard and challenge-era UI.
- VRF hooks and fairness UI.
- dead scroll integration code.
- combat/kingdom game components, `(game)` route group, `slowmo` routes, and the rehearsal mechanic.

Historical docs may mention these systems, but new product work should treat them as archive material unless explicitly revived.

## Engineering Gates

Baseline gates before pilots:

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
npm run build:web
```

Recent fixes include the Jest AsyncStorage mock, optional native module typing, and TypeScript cleanup after legacy Web3 and game-layer removal.

## Compatibility Notes

The app was rebranded from `glucosewars` to `sukari` across the Expo slug and scheme, package name, AsyncStorage keys, deep-link scheme, share URLs, and worker naming. A one-time storage migration (`utils/storageMigration.ts`, run from `app/_layout.tsx` before the provider tree mounts) copies any legacy `glucoseWars.*` AsyncStorage keys into the `sukari.*` namespace and removes the old keys, so existing installs keep their progress, Dexcom tokens, digest history, and analytics identity.
