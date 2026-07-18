# Sukari Product Design

Sukari is a decision-time adherence product for continuous metabolic care. It exists because chronic metabolic care usually fails in the small moment between intention and action: after dinner, during a craving, when the patient already knows the advice but needs the next choice to feel doable.

The old name, GlucoseWars, implied a broad game or combat metaphor. Sukari is softer, more mature, and better aligned with the intended audience: adults living with metabolic risk, supporters, and programme operators who need adherence evidence without another dashboard.

## Positioning

**Category:** adherence layer for continuous metabolic care.

**Tagline:** One mission today. Better evidence for tomorrow.

**10-second pitch:** Sukari watches the metabolic signal, chooses one winnable experiment, lets the patient rehearse the decision, follows up when they act, and tells the care team only when human attention can change the week.

**Explicitly not:** AI doctor, symptom chatbot, dosing assistant, game-first education app, NFT product, leaderboard, or consumer wellness toy.

## Product Thesis

Patients do not need more explanation first. They need the next right thing made easy enough to do. Programme operators do not need a wider patient app. They need an exception surface that shows who needs outreach, why, and what happened this week.

This is the Paul Graham lens: adherence is the unglamorous schlep in digital health, which is why it is underbuilt. Do the unscalable thing first: hand-tune missions, make one patient arc feel real, and learn the messy conversion from advice to action.

This is the Peter Thiel lens: do not start as a general wellness app. Dominate a narrow beachhead: adults with T2D or prediabetes in CGM-supported metabolic programmes. The wedge is not "AI plus game"; it is closed-loop adherence evidence for operators who already have patients.

## Experience Architecture

Sukari has one loop and three surfaces.

1. **Patient home:** value proposition, role selection, current signal, one mission, and patient governance.
2. **Rehearsal:** a short practice session tied to today's mission, not an arcade mode for its own sake.
3. **Care team:** desktop-first programme-operator view with exceptions, outreach rationale, and weekly outcomes.

The first mission flow now prioritizes evidence:

1. Lead with the pain and value proposition.
2. Ask who the product is helping: patient, supporter, or care team.
3. Connect/import a signal or use a clearly labelled demo pattern.
4. Show the mission card before any rehearsal.
5. Only then enter onboarding and practice.

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

Patient surfaces should feel calm, adult, and action-oriented. The game layer can be energetic, but the mission ribbon must keep it anchored to the real-world ask.

Care-team desktop surfaces should feel operational: dense enough to scan, restrained, and built for repeated use. They should not be enlarged patient screens.

## Agency Charter

The agent proposes. The patient disposes.

Sukari may autonomously detect patterns, select one in-scope mission, remember responses, follow up once on a "later today" promise, and compile a weekly digest. It must ask before changing a mission mid-day, involving a supporter, or suggesting care-team outreach. It must never dose, diagnose, shame, contact people without consent, or obscure its reasoning.

## Shipped Progress

- Name and visible brand changed to Sukari.
- Value-first intro added before role selection.
- Mission-first flow added before rehearsal.
- Demo patterns are labelled as demo evidence.
- Desktop care surface now emphasizes operator value: exceptions, rationale, outcomes.
- Local digest history powers the care surface instead of fixture-only data.
- Demo cohort remains available as an explicit toggle.
- Legacy Web3, Beam, NFT, leaderboard, and challenge-era primary surfaces were removed or redirected.
- Funnel instrumentation now covers the patient and care-team conversion path.
- Engineering gates are green.

## Metrics

North star: **Weekly Adherent Patients (WAP)**, defined as at least one real-world mission completion and at least one rehearsal in a week.

Supporting metrics:

- Value screen to role selection.
- Role selection to mission accepted.
- Mission accepted to rehearsal started.
- Rehearsal to done now or later today.
- Completion to measurable response.
- Care-team exception to outreach reviewed.
- Staff minutes per enrolled patient.

## Anti-Goals

No feeds, generic dashboards, streak shame, leaderboard-first loops, Web3-first identity, causal overclaiming, dosing, diagnosis, or clinician chart sprawl.
