# Sukari Investor One-Pager

**The adherence layer for continuous metabolic care.**

One mission today. Better evidence for tomorrow.

## Problem

Metabolic programmes know what patients should do, but adherence fails between appointments. Patients face repeated decision moments without timely support, and clinicians cannot continuously review every CGM stream.

## Solution

Sukari turns signal into action through Mira, Famile's shared health and wellness agent:

1. Detect one actionable pattern.
2. Propose one daily habit experiment — in conversation, not on a card.
3. The patient responds in natural language: "sure", "that's too much", "maybe later", "I did it." Mira adapts.
4. Record real-world completion.
5. Capture the patient-reported outcome: how it felt and whether they noticed a difference. Patient-reported, not CGM-derived — observational, no causal claims.
6. Adapt: past outcomes inform what Mira suggests next. The loop is closed.
7. Surface exceptions and cohort evidence to the care team as an active work queue with Mira's proactive flags.

The agent is the connective tissue. The product is adherence evidence.

## Buyer

Sell to programme operators who already have patients:

- virtual diabetes clinics;
- GLP-1 lifestyle programmes;
- employer metabolic programmes;
- CGM-supported nutrition services.

Initial model: PEPM software fee plus implementation. Later outcomes upside may be possible after validated pilots.

## Why Now

CGM adoption, virtual metabolic programmes, GLP-1 care models, and capable AI make between-visit adherence measurable and actionable. The gap is not another dashboard. It is converting signal into one small action and proving whether follow-through happened.

## Moat

- The operator work queue is the commercial wedge. Patients have infinite health app choices; care teams managing metabolic programs have almost no tooling.
- Data moat: the closed loop — signal → pattern → mission → conversation → patient-reported outcome → outcome-informed adaptation — gets stronger with every completed mission. Each outcome makes mission selection smarter and cohort evidence more defensible.
- Cohort evidence on the operator surface: archetype-level completion rates and patient-reported response rates ("of 9 patients who completed post_meal_walk, 64% noticed a difference") give operators a dimension no generic dashboard offers.
- Switching costs: once a care coordinator runs 30 patients through your work queue, leaving means losing institutional memory.
- Longitudinal mapping from context to mission to adherence to patient-reported outcome to adaptation.
- Clinically governed mission library and safety boundaries.
- Mission design tuned for real-world completion, not time-in-app.

## Current Progress

Working prototype includes:

- Sukari brand and conversation-first entry.
- Conversation-first patient interface: Mira initiates, patient responds in natural language, mission lifecycle happens in the thread.
- Intent parser maps natural language to structured mission intents — no buttons required.
- Conversation memory persists across sessions; Mira references past context.
- Mira visual presence with bounded habit-scope posture, updating with conversation state.
- Measured response language.
- Local-first weekly digest history with longitudinal outcome trend.
- Care-team work queue with status lifecycle (open, contacted, snoozed, resolved), filter/sort, quick actions, operator assignment to care team members, and Mira-generated proactive flags (including outcome-aware struggle, positive-signal, and barrier-outcome link flags).
- Weekly team report with per-assignee status counts, patients still needing attention, and Mira's top observations — shareable as text or CSV via the platform share sheet.
- Patient-reported outcome capture: after completing a mission, the patient tells Mira how it went. The outcome is persisted, flows into the clinician digest, and aggregates into cohort response rates.
- Closed-loop adaptation: past patient-reported outcomes inform mission selection. The loop is visible to the patient — Mira references past outcomes and the patient's own words in her opening line, signals when a suggestion is informed by what they told her, and quietly names milestones (first completion, first noticed difference). The loop is real, not aspirational.
- Cohort evidence on the operator surface: archetype-level completion rates and patient-reported response rates by mission type.
- Habit-only coach boundary.
- Agency Charter for agent permissions.
- Instrumented funnel through care-team outreach.
- Retired Web3/NFT/leaderboard/challenge and combat/kingdom game surfaces.
- Passing engineering gates.

Amina is the synthetic demo patient used for judging and sales demos. Mira is the persistent agent identity that can later carry across Famile products, subject to explicit product-level consent.

## Ask

Design partner, clinical advisor, and 8-12 week pilot with 50-100 adults with T2D or prediabetes in one CGM-supported programme.

Primary pilot metric: Weekly Adherent Patients.

Health outcomes are exploratory until a formal study design exists.

## Safety

Sukari is habits-only and never diagnoses or recommends insulin/medication doses. Production care-team deployment requires provider authentication, patient consent, audit logs, and HIPAA-ready infrastructure.
