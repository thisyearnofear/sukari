# Sukari Roadmap

## Current Status

Sukari has moved from a game-first GlucoseWars prototype to a mission-first adherence product powered by Mira, Famile's shared health and wellness agent identity. The combat/kingdom game layer and rehearsal mechanic have been fully removed; the product is now a calm, adult, action-oriented adherence loop with no game layer.

Shipped this cycle:

- Sukari name and product register.
- Conversation-first patient interface: the patient opens into a conversation with Mira, not a form or mission card. Mira initiates with a contextual opening line based on current state and memory of past sessions.
- Intent parser maps natural language to structured mission intents — no buttons required.
- Conversation memory persists across sessions in AsyncStorage; Mira references past context.
- Conversation engine drives Mira's responses deterministically for mission actions; free-form chat escalates to the LLM.
- Mira presence in the conversation header, with an orb that reflects the current agent posture.
- Approved "Adjusted for you" mission adaptation offered in conversation when the patient says "that's too much."
- Clearly labelled demo pattern path.
- Amina established as the deterministic synthetic demo patient, separate from Mira.
- Deployed optional Runware mission-media worker with local fallback.
- Local-first digest history and care-team work queue.
- Care-team work queue: active status lifecycle (open, contacted, snoozed, resolved), filter/sort, quick actions, and Mira-generated proactive flags. Work queue state persists in AsyncStorage.
- Legacy Beam/Web3/NFT/leaderboard/challenge and combat/kingdom game surfaces removed.
- Funnel instrumentation from conversation open through care-team work queue actions.
- Green lint, TypeScript, Jest, and web export gates.

## Next Product Milestones

1. **Signal integration hardening**
   - Make Dexcom/HealthKit connection the real import path.
   - Keep demo patterns explicit and clearly labelled.
   - Store only the derived pattern needed for the mission unless raw data is explicitly required.
   - Add consented imports in this order: CGM OAuth, HealthKit, clinician-approved CSV export, then optional photo/voice capture only after a privacy review.
   - Keep free-form check-ins local unless a patient explicitly chooses a secure, auditable upload path.

2. **Secure care-team backend**
   - Provider identity and programme enrollment.
   - Consent model for patient-to-programme summaries.
   - Role-based access control and audit logs.
   - Remote cohort API for exception summaries.

3. **Mission library validation**
   - Clinician review for each mission template.
   - Intervention inclusion/exclusion rules.
   - Difficulty adaptation policy.
   - Safety escalation copy review.

4. **Personalised nudge media**
   - Generate mission visuals only from approved template IDs and visual intents.
   - Let the signal-derived context tune image or video support.
   - Keep generated media optional, explainable, and subordinate to the real-world action.

5. **Pilot readiness**
   - 8-12 week design-partner pilot.
   - 50-100 enrolled users in one beachhead population.
   - Weekly Adherent Patients as primary behavioural metric.
   - Health outcomes exploratory only until study design exists.

6. **Operator workflow depth**
   - Work queue status lifecycle shipped (open, contacted, snoozed, resolved).
   - Mira proactive flags shipped (safety, completion drop, barrier pattern, recovery, streak, re-engagement).
   - Shipped: archetype-level completion in the cohort aggregate (group existing completion data by `behaviourTarget`). Per-patient cohort context in the work queue row expansion ("cohort median for this archetype this week is N%").
   - Shipped: patient-reported outcome capture — after completing a mission, Mira asks how it went. Patient response parsed into `PatientReportedOutcome` (felt difficulty + noticed difference) + free-form reflection. Persisted on the mission, flows into the clinician digest, and aggregates into cohort response rate on the operator surface.
   - Shipped: closed-loop adaptation — past PROs inform mission selection (avoid templates reported "harder" 2+ times, prefer templates with "easier" + "noticed difference"). Outcome-aware Mira flags (struggle + positive signal). Longitudinal outcome trend in clinician digest.
   - Shipped: enriched Mira flags — flags now reference specific behaviours ("post_meal_walk felt harder 2 times") instead of generic counts, use structured PRO data instead of text parsing, and cross-reference barriers with outcome struggle (outcome_barrier_link flag).
   - Shipped: operator assignment to care team members (WorkItem.assignedTo + team roster in AsyncStorage), weekly team report modal with per-assignee status counts + patients needing attention + Mira's top flags, and share/CSV export via the platform share sheet.
   - Next: integration path to external care-team tools (EHR, Slack, email) via the export surface.
   - Gated: curated external evidence library keyed by `behaviourTarget`, surfaced in the clinician digest only. Human-reviewed before it reaches operators. Never patient-facing.
   - Gated: CGM-derived response classifier that measures objective metabolic response after mission completion. Distinct from the patient-reported outcome (already shipped). Requires clinical validation. Unlocks the full response-rate cohort evidence and makes the closed-loop evidence claim fully true. This is the core data moat.

## Metrics

North star: **Weekly Adherent Patients (WAP)**.

Funnel:

- conversation opened -> mission offered;
- mission offered -> intent parsed (accept, easier, later, decline);
- mission accepted -> real-world completion or later;
- completion -> measurable response;
- care-team work item -> status changed (contacted, resolved, snoozed);
- Mira flag -> operator action.

Operator metrics:

- open items per enrolled patient per week;
- time from open to contacted;
- time from contacted to resolved;
- Mira flag accuracy (flagged patients who benefited from outreach);
- staff minutes per enrolled patient.

## Strategic Focus

Beachhead: adults with T2D or prediabetes in CGM-supported metabolic programmes.

Do not broaden into generic wellness, open-ended coaching, provider dashboards, multiplayer, or Web3 identity until the adherence loop is measurably working in the beachhead.

## Archive

Earlier GlucoseWars milestones included tiered progression, battle mechanics, Beam/Web3 experiments, challenge links, VRF fairness, educational lore, and the rehearsal/kingdom game layer. Those are historical assets, not active Sukari roadmap items.
