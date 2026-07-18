# Sukari Product Design

Sukari is a decision-time adherence product for continuous metabolic care. It exists because chronic metabolic care usually fails in the small moment between intention and action: after dinner, during a craving, when the patient already knows the advice but needs the next choice to feel doable.

The old name, GlucoseWars, implied a broad game or combat metaphor. Sukari is softer, more mature, and better aligned with the intended audience: adults living with metabolic risk, supporters, and programme operators who need adherence evidence without another dashboard.

## Positioning

**Category:** adherence layer for continuous metabolic care.

**Tagline:** One mission today. Better evidence for tomorrow.

**10-second pitch:** Sukari watches the metabolic signal, proposes one winnable experiment, follows up on the patient's chosen action, and tells the care team only when human attention can change the week.

**Explicitly not:** AI doctor, symptom chatbot, dosing assistant, game-first education app, NFT product, leaderboard, or consumer wellness toy.

## Product Thesis

Patients do not need more explanation first. They need the next right thing made easy enough to do. Programme operators do not need a wider patient app. They need an exception surface that shows who needs outreach, why, and what happened this week.

This is the Paul Graham lens: adherence is the unglamorous schlep in digital health, which is why it is underbuilt. Do the unscalable thing first: hand-tune missions, make one patient arc feel real, and learn the messy conversion from advice to action.

This is the Peter Thiel lens: do not start as a general wellness app. Dominate a narrow beachhead: adults with T2D or prediabetes in CGM-supported metabolic programmes. The wedge is not "AI plus game"; it is closed-loop adherence evidence for operators who already have patients.

## Experience Architecture

Sukari has one loop and three surfaces.

1. **Patient home:** value proposition, role selection, current signal, one mission, and patient governance.
2. **Optional rehearsal:** a short practice session tied to today's mission, never a gate before real-world action.
3. **Care team:** desktop-first programme-operator view with exceptions, outreach rationale, and weekly outcomes.

The first mission flow now prioritizes evidence:

1. Lead with the pain and value proposition.
2. Ask who the product is helping: patient, supporter, or care team.
3. Connect/import a signal or use a clearly labelled demo pattern.
4. Show the mission card before any rehearsal.
5. The patient can act now, make it easier, save it for later, or choose a short optional practice.
6. If the patient says the mission is too much or poorly timed, show a concise "Adjusted for you" moment before asking for more.

## Voice

Sukari observes, proposes, and remembers. It does not scold, celebrate compliance loudly, or manufacture urgency.

Use:

- "One small experiment tonight: a 10-minute walk after dinner."
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

Patient surfaces should feel calm, adult, and action-oriented. Rehearsal uses one stable metabolic field and a compact HUD across phone and desktop; it does not change theme, flash the whole screen, shake, or introduce unrelated game lore.

Care-team desktop surfaces should feel operational: dense enough to scan, restrained, and built for repeated use. They should not be enlarged patient screens.

## Agency Charter

The agent proposes. The patient disposes.

Sukari may autonomously detect patterns, select one in-scope mission, remember responses, follow up once on a "later today" promise, and compile a weekly digest. Every proposal exposes its decision trace: what was observed, what was proposed, and what it is waiting for next. It must ask before changing a mission mid-day, involving a supporter, or suggesting care-team outreach. It must never dose, diagnose, shame, contact people without consent, or obscure its reasoning.

## Shipped Progress

- Name and visible brand changed to Sukari.
- Value-first intro added before role selection.
- First-minute signal choice added: labelled demo, read-only connection, or habit mission.
- Mission-first flow added before rehearsal.
- Real-world action is now the default after mission acceptance; rehearsal is elective.
- Approved smaller mission variants now create a visible "Adjusted for you" agent moment.
- Rehearsal now uses a single compact, responsive HUD with no full-screen flashes, shakes, or time-of-day theme changes.
- Mission cards expose an agent decision trace: observed evidence, proposal, and next patient-controlled step.
- Demo patterns are labelled as demo evidence.
- Mission-specific visuals use the deployed optional Runware worker when configured, with local fallback.
- Desktop care surface now emphasizes operator value: exceptions, rationale, outcomes.
- Local digest history powers the care surface instead of fixture-only data.
- Demo cohort remains available as an explicit toggle.
- Legacy Web3, Beam, NFT, leaderboard, and challenge-era primary surfaces were removed or redirected.
- Funnel instrumentation now covers the patient and care-team conversion path.
- Engineering gates are green.

## Metrics

North star: **Weekly Adherent Patients (WAP)**, defined as at least one real-world mission completion in a week. Rehearsal is a supporting engagement signal, never a prerequisite.

Supporting metrics:

- Value screen to role selection.
- Role selection to mission accepted.
- Mission accepted to direct action, later-today promise, or elective rehearsal.
- Elective rehearsal to real-world completion.
- Completion to measurable response.
- Care-team exception to outreach reviewed.
- Staff minutes per enrolled patient.

## Anti-Goals

No feeds, generic dashboards, streak shame, leaderboard-first loops, Web3-first identity, causal overclaiming, dosing, diagnosis, or clinician chart sprawl.
