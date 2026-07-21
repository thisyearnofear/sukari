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

1. **Patient home:** value proposition, role selection, current signal, one mission, and patient governance.
2. **Care team:** desktop-first programme-operator view with exceptions, outreach rationale, and weekly outcomes.

The first mission flow:

1. Lead with the pain and value proposition.
2. Ask who the product is helping: patient, supporter, or care team.
3. Connect/import a signal or use a clearly labelled demo pattern.
4. Show the mission card.
5. The patient can act now, make it easier, save it for later, or mark it not practical.
6. If the patient says the mission is too much or poorly timed, show a concise "Adjusted for you" moment before asking for more.

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

## Shipped Progress

- Name and visible brand changed to Sukari.
- Mira established as the shared Famile agent identity; Amina is the labelled synthetic demo patient.
- Value-first intro added before role selection.
- First-minute signal choice added: labelled demo, read-only connection, private local check-in, or general habit mission.
- Live signal access is capability-gated; unavailable integrations are labelled as preview rather than implied to work.
- Settings lets a person change mission input later without resetting role or programme progress.
- Mission-first flow: the patient sees the mission card and can act immediately.
- Approved smaller mission variants create a visible "Adjusted for you" agent moment.
- A local, mission-bound world state carries approved scene, tone, and response state across home and generated media; it resets when the mission changes.
- Mission cards expose an agent decision trace: observed evidence, proposal, and next patient-controlled step.
- Demo patterns are labelled as demo evidence.
- Mission-specific visuals use the deployed optional Runware worker when configured, with local fallback; only approved visual intents leave the app.
- Desktop care surface emphasizes operator value: exceptions, rationale, outcomes, and estimated staff minutes saved.
- Local digest history powers the care surface instead of fixture-only data.
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
