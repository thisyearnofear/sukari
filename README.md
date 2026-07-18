# Sukari

Sukari is the adherence layer for continuous metabolic care.

It turns a metabolic pattern into one daily mission, records the real-world follow-through, offers an optional short practice for people who want it, measures the associated response, and gives the care team an exception-oriented view when human outreach is useful.

> One mission today. Better evidence for tomorrow.

Sukari is not an AI doctor, dosing tool, NFT product, leaderboard game, or symptom chatbot. It is a habits-only product for the between-visit gap in type 2 diabetes, prediabetes, GLP-1-supported lifestyle care, and adjacent metabolic programmes.

## Product Loop

1. Detect a signal or use a clearly labelled demo pattern.
2. Propose one mission with patient controls: accept, make easier, swap, or decline.
3. Act in real life, save it for later today, or choose an optional 45-second rehearsal.
4. Record the real-world follow-through.
5. Measure the associated response without causal overclaiming.
6. Surface care-team exceptions with outreach rationale and weekly outcomes.

Rehearsal is an optional learning mechanism. The product is closed-loop adherence.

## Current Progress

- Brand changed from GlucoseWars to Sukari in the shipped app display and active product docs.
- First-run experience now leads with the value proposition and user pain before role selection.
- First mission flow now shows a connect/import or labelled demo pattern, then a mission card before rehearsal.
- Patients can now act on a mission without entering rehearsal; practice appears only after a mission is accepted.
- The rehearsal surface now uses a stable compact HUD across phone and desktop rather than changing full-screen themes and legacy side panels.
- Mission cards show the agent decision trace: observed evidence, proposal, and the next patient-controlled step.
- Desktop now exposes a programme-operator care surface with exceptions, outreach rationale, weekly outcomes, and local-first digest history.
- Legacy Web3, NFT, leaderboard, Beam, and challenge-era shipped surfaces were removed or redirected out of the primary experience.
- Funnel instrumentation now covers value screen, role selection, mission acceptance, rehearsal, real-world completion, measured response, and care-team exception/outreach.
- Engineering gates are green: lint, TypeScript, Jest, and web export.

## Key Docs

- [Product Design](docs/PRODUCT_DESIGN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Development](docs/DEVELOPMENT.md)
- [Hackathon Pitch](docs/HACKATHON.md)
- [Investor One-Pager](docs/INVESTOR_ONEPAGER.md)
- [KPI Experiment Plan](docs/KPI_EXPERIMENT_PLAN.md)
- [Launch Checklist](docs/LAUNCH_CHECKLIST.md)

Historical challenge and VRF material is excluded from the shipped application and should not be used to describe Sukari.

## Quick Start

```bash
cp .env.example .env
npm install
npx expo start
```

Useful checks:

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
npm run build:web
```

## Configuration

Optional environment variables:

- `EXPO_PUBLIC_POSTHOG_KEY`: enables PostHog analytics.
- `EXPO_PUBLIC_POSTHOG_HOST`: optional PostHog host override.
- `EXPO_PUBLIC_SUKARI_API_URL`: optional coach and published-digest API URL.
- `EXPO_PUBLIC_APP_URL`: public app URL for generated digest/share links; keep it as `https://glucosewars.netlify.app` through submission.

The Expo slug and deep-link scheme remain `glucosewars` for compatibility with existing installs and OAuth redirect configuration. The user-facing product name is Sukari.

## Safety Boundary

Sukari can propose habit experiments, remember patient choices, and summarize adherence evidence. It must not diagnose, recommend insulin or medication doses, shame missed actions, contact another person without consent, or hide why a mission was proposed.

The care-team surface is currently local-first. A production multi-patient cohort view requires authenticated provider identity, patient consent, audit logging, and a HIPAA-ready backend before external pilots.
