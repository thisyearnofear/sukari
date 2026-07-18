# Sukari Roadmap

## Current Status

Sukari has moved from a game-first GlucoseWars prototype to a mission-first adherence product powered by Mira, Famile's shared health and wellness agent identity.

Shipped this cycle:

- Sukari name and product register.
- Value proposition before role selection.
- First-minute signal choice: labelled demo, read-only connection, private local check-in, or general habit mission.
- First mission card before rehearsal.
- Approved "Adjusted for you" mission adaptation after easier/later choices.
- Mira presence on the mission card, with a small orb that reflects the current agent posture.
- Clearly labelled demo pattern path.
- Amina established as the deterministic synthetic demo patient, separate from Mira.
- Deployed optional Runware mission-media worker with local fallback.
- Local-first digest history and care-team panel.
- Desktop programme-operator surface: exceptions, outreach rationale, weekly outcomes.
- Legacy Beam/Web3/NFT/leaderboard/challenge shipped surfaces removed or redirected.
- Funnel instrumentation from value screen through care-team outreach.
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
   - Let the signal-derived context tune practice scenarios, speech, image, or video support.
   - Keep generated media optional, explainable, and subordinate to the real-world action.

5. **Pilot readiness**
   - 8-12 week design-partner pilot.
   - 50-100 enrolled users in one beachhead population.
   - Weekly Adherent Patients as primary behavioural metric.
   - Health outcomes exploratory only until study design exists.

6. **Operator workflow**
   - Outreach state: suggested, reviewed, sent, dismissed.
   - Weekly team report.
   - Export or integration path for programme operators.

## Metrics

North star: **Weekly Adherent Patients (WAP)**.

Funnel:

- value screen -> role selection;
- role -> mission accepted;
- mission -> easier/later adaptation;
- mission accepted -> rehearsal started;
- rehearsal -> real-world completion or later;
- completion -> measurable response;
- care-team exception -> outreach reviewed.

Operator metrics:

- exceptions per enrolled patient;
- staff minutes per reviewed exception;
- outreach acceptance and completion;
- digest usefulness rating.

## Strategic Focus

Beachhead: adults with T2D or prediabetes in CGM-supported metabolic programmes.

Do not broaden into generic wellness, open-ended coaching, provider dashboards, multiplayer, or Web3 identity until the adherence loop is measurably working in the beachhead.

## Archive

Earlier GlucoseWars milestones included tiered progression, battle mechanics, Beam/Web3 experiments, challenge links, VRF fairness, and educational lore. Those are historical assets, not active Sukari roadmap items.
