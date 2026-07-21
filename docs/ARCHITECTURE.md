# Sukari Architecture

Sukari is a React Native Expo app with a local-first adherence loop and optional worker-backed coaching/digest publishing. The current product spine is:

```text
live signal, labelled demo pattern, or private local check-in
  -> bounded pattern and approved programme mission
  -> conversation: Mira initiates, patient responds in natural language
  -> intent parser maps response to mission action (accept, easier, later, done, not_done, report_outcome)
  -> completion
  -> patient-reported outcome (felt difficulty + noticed difference + reflection)
  -> outcome-informed mission selection for the next day
  -> care-team work queue with Mira flags + cohort evidence (completion + response rates by archetype)
```

## Product Surfaces

- `app/index.tsx`: entry point; routes to conversation home.
- `components/home/ConversationHome.tsx`: conversation-first primary patient surface. Mira initiates, patient responds in natural language, mission lifecycle happens in the thread.
- `components/game/MainMenu.tsx`: home state orchestrator (legacy folder name). Owns role/signal/demo state and renders ConversationHome.
- `components/agent/MiraOrb.tsx`: lightweight cross-platform visual carrier for Mira's domain-derived posture.
- `domain/agent/`: Mira presence, decision trace, conversation engine, intent parser, and conversation memory.
- `components/programme/MissionVisual.tsx`: local visual cue with optional Runware-generated mission illustration.
- `app/digest/[token].tsx`: patient/care-team digest view.
- `app/care.tsx`: Mira's work queue — active operator surface with status lifecycle, filters, quick actions, and Mira-generated proactive flags.

Retired routes such as `game-selection`, `slowmo`, and the `(game)` route group (battle, onboarding, results) have been removed. They should not regain primary navigation without a deliberate product decision.

## Domain Map

```text
domain/
  coach/       habit-scope coach and clinical safety boundary
  agent/       Mira presence, decision trace, conversation engine,
               intent parser, conversation memory, and media briefs
  config/      worker and app URL helpers
  demo/        deterministic Amina demo data
  digest/      weekly summary payloads, publishing, local history,
               and longitudinal outcome trend
  invite/      supporter invite flows
  media/       optional mission-media client
  patterns/    observational pattern types and field state mapping
  programme/   mission templates, mission selection (outcome-informed),
               and PatientReportedOutcome type
  signals/     CGM or snapshot abstractions
  cohort/      operator cohort overview, work queue state, Mira flags
               (including outcome-aware), archetype completion +
               response rate aggregation, care team roster, team report
```

Domain code should remain pure TypeScript and should not import React Native or Expo UI.

## State

`PlayerProgressProvider` wraps the app in `app/_layout.tsx` and persists progress through `usePlayerProgress`. It is the single source of truth for role, selected mission, progress, and local programme state. It also persists a mission-bound `worldState` with only: mission ID/template, an approved scene enum, tone enum, response state, and timestamp. The state is discarded whenever the active mission changes. Patient-reported outcomes (`reportedOutcome`, `reflection`) are persisted on each `ProgrammeMission` in `missionHistory` and feed back into mission selection for the next day.

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
- `mission_assigned` (with template_id, behaviour, source, privacy_mode)
- `mission_practiced` (with template_id, behaviour, privacy_mode)
- `mission_completed` (with template_id, behaviour, privacy_mode)
- `completion_to_measured_response`
- `measured_response_captured` (with template_id, behaviour, felt_difficulty, noticed_difference, privacy_mode) — fires when a patient reports an outcome after completion
- `measured_response_to_care_team_exception`
- `care_panel_opened`
- `care_outreach_reviewed`
- `conversation_opened` (with phase and prior-context flag)
- `conversation_intent` (with intent kind and conversation phase)
- `care_work_item_updated` (with patient and new status)
- `care_work_item_snoozed` (with patient and snooze duration)
- `care_work_item_assigned` (with patient and assignee)
- `care_report_viewed` (with week_key and source)
- `care_report_shared` (with format)
- `care_report_exported` (with format)

Supporting events include `agent_trace_opened` and `signal_connection_chosen`. They measure progressive disclosure and connect intent; they do not replace the core completion funnel.

`manual_signal_started` and `manual_signal_submitted` measure the local check-in boundary. The submitted event contains only a bounded moment ID and chosen template ID, never free-form notes or raw health data. `mission_response_selected` normalizes do-now, easier, later, not-practical, and direct-completion choices with a coarse `input_source` (`demo`, `manual`, `cgm`, or `general`).

Do not add new funnel names casually. Prefer extending properties on these events unless a new product boundary is introduced.

## Conversation Architecture

The patient surface is a conversation, not a form. Three domain modules drive it:

- `domain/agent/intentParser.ts`: parses natural language into structured mission intents (accept, decline, make_easier, later, done, not_done, report_outcome, how_was_it, chat). Lightweight pattern matching — no LLM call for mission actions. The `report_outcome` intent captures patient-reported outcomes ("it went well", "felt easier", "noticed a difference") after mission completion.
- `domain/agent/conversationMemory.ts`: persists turns and derived facts (barriers, completion count, last action, last patient-reported outcome) across sessions in AsyncStorage. Enables Mira to reference past context, including how past missions felt and whether the patient noticed a difference.
- `domain/agent/conversationEngine.ts`: state machine that generates opening lines, processes intents deterministically, and escalates free-form chat to the LLM via `useCoach`. Mira's posture updates with each state transition. The `report_outcome` intent triggers a `capture_outcome` mission action that persists a `PatientReportedOutcome` on the mission and transitions to the `checking_in` phase. The opening line references past outcomes ("You said post_meal_walk felt easier and you noticed a difference") and signals adaptation when offering a new mission informed by past outcomes ("Based on that, I'm suggesting something different today" or "Building on what worked").

The conversation is the primary interface. There are no mission cards, no buttons to tap, and no screens to navigate. The patient opens the app and is already in a conversation with Mira.

## Care-Team Architecture

The care surface is Mira's work queue — an active operator surface, not a passive report. It reads stored weekly digests on the device and can open an explicit synthetic demo cohort. Operators work items through a status lifecycle (open, contacted, snoozed, resolved) with filter/sort and quick actions. Work items can be assigned to specific care team members (persisted on `WorkItem.assignedTo`), and a weekly team report modal aggregates cohort overview, per-assignee status counts, patients still needing attention, and Mira's top flags — with share-to-text and CSV export via the platform share sheet. Mira generates proactive flags from cohort data + conversation memory.

The aggregate header shows cohort evidence: archetype-level completion rates ("post_meal_walk: 73% across 12 patients") and patient-reported response rates ("64% noticed a difference, 9 reported"). Per-patient cohort context appears in the work queue row expansion ("cohort median for post_meal_walk this week is 5/7"). The clinician digest includes a longitudinal outcome trend section showing the arc across all completed missions with reported outcomes.

Mira flags now include outcome-aware kinds: `outcome_struggle` (patient reported specific behaviours as harder 2+ times), `outcome_positive` (patient noticed a difference on specific behaviours 2+ times), and `outcome_barrier_link` (patient has both a stated barrier and outcome struggle on a related behaviour — the barrier and the struggle align). Flags reference specific behaviours ("post_meal_walk felt harder 2 times") using structured PRO data from `PatientOutcomeSummary`, not text parsing.

Work queue state persists in AsyncStorage (`domain/cohort/workQueue.ts`). Mira flags are generated deterministically from cohort summaries + work item status (`domain/cohort/miraFlags.ts`). Archetype completion and response rate are computed in `domain/cohort/synthetic.ts`. Outcome summaries are built from `digest.outcomeByBehaviour` by `buildOutcomeSummary` and stamped on each patient by `stampOutcomeSummary`.

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
