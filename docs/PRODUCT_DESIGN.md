# Sukari Product Design

Sukari is a decision-time adherence product for continuous metabolic care. It exists because chronic metabolic care usually fails in the small moment between intention and action: after dinner, during a craving, when the patient already knows the advice but needs the next choice to feel doable.

The earlier prototype (GlucoseWars) used a combat/kingdom game metaphor. That metaphor did not fit the audience — adults with T2D or prediabetes in CGM-supported programmes — and has been fully removed. Sukari is now a calm, adult, action-oriented product with no game layer.

## Positioning

**Category:** personalised action adherence layer for continuous metabolic care.

**Tagline:** One mission today. Better evidence for tomorrow.

**10-second pitch:** Sukari turns a metabolic signal into one winnable real-world experiment, then adapts the mission, visual cue, and follow-up around that choice. It tells the care team only when human attention can change the week.

**Explicitly not:** AI doctor, symptom chatbot, dosing assistant, game, NFT product, leaderboard, consumer wellness toy, or generic dashboard.

## Product Thesis

Patients do not need more explanation first. They need the next right thing made easy enough to do. Programme operators do not need a wider patient app. They need an exception surface that shows who needs outreach, why, and what happened this week.

This is the Paul Graham lens: adherence is the unglamorous schlep in digital health, which is why it is underbuilt. Do the unscalable thing first: hand-tune missions, make one patient arc feel real, and learn the messy conversion from advice to action.

This is the Peter Thiel lens: do not start as a general wellness app. Dominate a narrow beachhead: adults with T2D or prediabetes in CGM-supported metabolic programmes. The wedge is not "AI plus game"; it is a personalised action loop that turns a real pattern into a practical choice and closed-loop adherence evidence for operators who already have patients.

## Product Loop

```text
approved signal pattern or local moment
  -> deterministic, in-scope mission family
  -> bounded world state: mission, approved scene, tone, response state
  -> real-world choice and outcome
  -> next approved adaptation
```

Every element must earn its place by helping a real-world action happen. A post-meal movement mission creates an after-meal path scene; a drink mission surfaces the drink decision; a protein-first mission favours relevant protein choices. When a person chooses "make it easier," the world state moves to a gentle, unhurried field. This is visible as a concise field note, not a new dashboard.

The LLM may personalise wording, offer an approved smaller variant, or summarise the bounded decision trace. Deterministic logic owns pattern detection, mission eligibility, safety boundaries, and escalation. Generative media receives only an approved template ID, visual intent, and allowlisted scene, never raw CGM readings, patient identity, or free-form health notes.

## Experience Architecture

Sukari has one loop and two surfaces.

1. **Patient home:** a conversation with Mira. She initiates with a contextual observation based on current state and memory of past sessions. The patient responds in natural language. The mission lifecycle — accept, make easier, defer, complete, decline — happens in the conversation thread. Free-form questions escalate to the LLM. No forms, no buttons, no cards to navigate.
2. **Care team:** Mira's work queue — an active operator surface with status lifecycle (open, contacted, snoozed, resolved), filter/sort, quick actions, and Mira-generated proactive flags. Not a passive report.

The first conversation:

1. The patient opens the app. Mira is already there — no role selection, no signal picker, no value screen to tap through.
2. Mira initiates: "I noticed a pattern in your evenings. Want to try one small thing today?" (first session) or "Last time you mentioned evenings were hard. How's this week going?" (returning session).
3. The patient responds in natural language. "Sure" accepts. "That's too much" triggers a smaller variant. "Maybe later" defers. "I walked for 10 minutes" logs completion.
4. If the patient asks a free-form question ("what is protein?"), Mira escalates to the LLM with grounded context.
5. Mira's posture updates with each state transition — offering, watching, completed — reflected in the orb in the header.

## Mira, The Famile Agent

> **Network contract:** `famile/web/docs/MIRA.md` is the canonical persona,
> posture vocabulary, orb spec, and transition semantics. This section
> describes Sukari's implementation against that contract. Where the two
> disagree, the network doc wins; update this file to match.

Mira is Famile's persistent agent identity across its health and wellness products. She is a calm operational presence, not a mascot, clinician, or generic character chat. Her personality carries through posture: she listens, notices, offers, holds, and adapts based on product truth rather than mirroring sentiment.

In Sukari, Mira sees only the signals and preferences the person has permitted in this product. She never implies cross-product memory or access. Her Sukari capability is deliberately narrow: detect an in-scope pattern, prepare one bounded habit mission, remember the response locally, and surface care-team attention only with the right consent and safety boundary.

The Mira surface uses one decision at a time. It makes the current posture legible in a sentence: "Mira noticed a pattern", "Mira adjusted this", or "Mira is holding this". The decision trace remains available on demand, so the person feels guided rather than briefed.

Mira's visual carrier is a small translucent orb: warm and outward when an option is ready, gentler when a mission is made smaller, contained when held, and quietly settled after completion. It is a visual expression of operational posture, not a clinical score, emotion detector, or decorative mascot. The text remains the accessible source of meaning; reduced-motion users see a static settled form.

## Voice

Mira observes, proposes, and remembers within Sukari. She does not scold, celebrate compliance loudly, manufacture urgency, or claim certainty.

Use:

- "Mira noticed a repeatable evening window. One small experiment tonight: a 10-minute walk after dinner."
- "No problem. I will bring something different tomorrow."
- "Evenings after walks ran steadier this week."
- "A human conversation may help this week."

Avoid:

- "Crush your challenge."
- "You lost your streak."
- "Mint your achievement."
- "Glucose battle."
- "Your task today is..."

## Design Register

Patient surfaces should feel calm, adult, and action-oriented. The home uses one stable metabolic field as ambient background; it does not change theme, flash the whole screen, shake, or introduce unrelated lore.

Care-team desktop surfaces should feel operational: dense enough to scan, restrained, and built for repeated use. They should not be enlarged patient screens.

## Agency Charter

The agent proposes. The patient disposes.

Mira may autonomously detect patterns, select one in-scope mission, remember responses, follow up once on a "later today" promise, and compile a weekly digest. Every proposal exposes its decision trace: what was observed, what was proposed, and what it is waiting for next. Mira must ask before changing a mission mid-day, involving a supporter, or suggesting care-team outreach. She must never dose, diagnose, shame, contact people without consent, imply access to another Famile product, or obscure her reasoning.

## Cohort Evidence and the Operator Surface

Patients on a metabolic mission will eventually ask: *am I responding normally? Will this work for someone like me? Is my pattern unusual?* The instinct is to look sideways at other people. Sukari's answer is to put aggregate evidence on the operator surface, not the patient surface, and to keep the patient conversation exactly as it is.

### Two ideas that are not the same feature

1. **Aggregate factual context** — "x% of patients with this pattern archetype complete this mission class," "the first week of a new mission is usually the hardest." This is cohort evidence, not social. It needs no user-generated content, no social graph, no critical mass. It enriches the operator digest and work queue, where clinical judgment can act on it.

2. **"People like you" peer layer** — patient-facing surfaces showing what other patients booked, tried, or experienced. This is a social layer. It needs a cohort, profiles, shared content, moderation, and enough users to not feel empty. At early-user volume it will feel dead, and dead social features are worse than absent ones.

### What Sukari does not build

A patient-facing peer layer violates the stated contract. The anti-goals explicitly ban leaderboards, streak shame, and peer-comparison loops. The product's posture is "one mission today, calm, adult, no comparison." Adding a peer surface doesn't just distract from the wedge — it breaks the anti-goals the product was designed against. Health-data privacy also makes a "semi-public mode" a much harder sell than in non-health products.

Patient-facing external research context is also out of scope. Patterns are "observational hypotheses — never causal diagnoses." Pulling in external research ("studies show post-meal walks reduce glucose response") pushes the product toward medical authority and causal claims it is deliberately built to avoid. It drifts toward "AI doctor" and "explanation first," both explicitly rejected by the thesis.

### What Sukari does build

The operator work queue is the commercial wedge. Care teams managing metabolic programs have almost no tooling. That is the audience that benefits from aggregate evidence, and the audience that can safely act on it because they have clinical judgment.

**Now (no new data capture):** Archetype-level completion in the cohort aggregate — "post_meal_walk: 73% completion across N patients this week." The data already exists: `ProgrammeMission.behaviourTarget` is captured for every mission. Grouping the existing completion computation by `behaviourTarget` gives per-archetype rates with zero new infrastructure. Per-patient cohort context in the work queue row expansion — "Completion 3/7 — cohort median for post_meal_walk this week is 5/7" — tells the care team whether this patient is an exception or typical.

**Shipped (patient-reported outcomes):** After completing a mission, Mira asks how it went. The patient's response is parsed into a `PatientReportedOutcome` (felt difficulty: easier/about right/harder; noticed a difference: yes/no/not sure) plus a free-form reflection. This is the "measure" phase of the closed loop — patient-reported, not CGM-derived, no causal claims. The outcome is persisted on the mission, flows into the clinician digest's `experimentsTried` ("Patient reported: felt easier than expected and noticed a difference"), and aggregates into the cohort response rate on the operator surface ("of 9 patients who reported, 64% noticed a difference"). This is the first version of closed-loop evidence: it's honest, it's contract-compatible, and it's the data that will eventually feed a stronger CGM-derived classifier.

**Next (operator-only, needs curation):** An optional `externalEvidence` field on the clinician digest, populated from a curated evidence library keyed by `behaviourTarget`. External research tooling (firecrawl, exa, tinyfish) can help build the library, but the output must be human-reviewed before it reaches operators. Framed as "context for clinical judgment," not as recommendation. Never shown to patients.

**Gated (the real moat):** A CGM-derived response classifier that looks at glucose data before and after a mission completes and classifies whether there was a measurable metabolic response. This is distinct from the patient-reported outcome (which is already shipped) — it would add an objective signal alongside the subjective one. It requires clinical validation and touches the "no causal overclaiming" boundary, so it's gated. When it ships, it unlocks the full response-rate version of the cohort beat — "of 30 patients who held this mission archetype, 22 completed, 14 showed measurable response" — and makes the "closed-loop adherence evidence" claim in the thesis fully true. It is the core data moat: every completed mission with a measured response makes the cohort evidence stronger and the operator surface more defensible. It is also the hardest for competitors to copy because it requires the longitudinal mission-to-outcome data they do not have.

### The through-line

The patient surface stays exactly as it is: one mission, one conversation, no comparison, no external authority. The operator surface gets richer, more evidence-backed, and more defensible. Aggregate evidence changes decisions on the operator surface; it adds decisions on the patient surface. That asymmetry is why cohort evidence belongs on the work queue and not in the conversation.

## Shipped Progress

- Name and visible brand changed to Sukari.
- Mira established as the shared Famile agent identity; Amina is the labelled synthetic demo patient.
- Conversation-first patient interface: the patient opens into a conversation with Mira, not a form or mission card. Mira initiates with a contextual opening line.
- Intent parser maps natural language ("sure", "too hard", "I did it", "it went well") to structured mission intents — no buttons required.
- Conversation memory persists across sessions in AsyncStorage. Mira references past context: "Last time you mentioned evenings were hard."
- Conversation engine drives Mira's responses deterministically for mission actions; free-form chat escalates to the LLM.
- Patient-reported outcome capture: after completing a mission, Mira asks how it went. The patient's response is parsed into a `PatientReportedOutcome` (felt difficulty + noticed difference) plus free-form reflection, persisted on the mission, and flows into the clinician digest and cohort response rate.
- Mira's posture updates with each conversation state transition, reflected in the orb.
- Live signal access is capability-gated; unavailable integrations are labelled as preview rather than implied to work.
- Settings lets a person change mission input later without resetting role or programme progress.
- Approved smaller mission variants are offered in conversation when the patient says "that's too much."
- A local, mission-bound world state carries approved scene, tone, and response state across home and generated media; it resets when the mission changes.
- Decision trace remains available through progressive disclosure.
- Demo patterns are labelled as demo evidence.
- Mission-specific visuals use the deployed optional Runware worker when configured, with local fallback; only approved visual intents leave the app.
- Care-team surface is now Mira's work queue: active status lifecycle (open, contacted, snoozed, resolved), filter/sort, quick actions, and Mira-generated proactive flags.
- Work queue state persists in AsyncStorage; expired snoozes auto-reopen.
- Local digest history powers the care surface instead of fixture-only data.
- Cohort evidence on the operator surface: archetype-level completion rates ("post_meal_walk: 73% across 12 patients"), per-patient cohort context in the work queue row, and patient-reported response rates ("64% noticed a difference").
- Demo cohort remains available as an explicit toggle.
- Legacy Web3, Beam, NFT, leaderboard, challenge-era, and combat/kingdom game surfaces were removed.
- Funnel instrumentation covers the patient and care-team conversion path.
- Engineering gates are green.

## Metrics

North star: **Weekly Adherent Patients (WAP)**, defined as at least one real-world mission completion in a week.

Supporting metrics:

- Value screen to role selection.
- Role selection to mission accepted.
- Mission accepted to direct action, later-today promise, or decline.
- Completion to measurable response.
- Care-team exception to outreach reviewed.
- Staff minutes per enrolled patient.

## Anti-Goals

No feeds, generic dashboards, streak shame, leaderboard-first loops, Web3-first identity, causal overclaiming, dosing, diagnosis, clinician chart sprawl, or game/combat/kingdom mechanics.
