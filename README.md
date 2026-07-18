# Sukari

**One mission today. Better evidence for tomorrow.**

Sukari is a personalised action-and-play adherence layer for continuous metabolic care. Mira, the shared Famile agent, turns a connected signal, labelled demo pattern, or private local check-in into one patient-controlled habit mission, then adapts optional practice and visual support around that real-world choice.

Built for type 2 diabetes, prediabetes, GLP-1-supported lifestyle care, and adjacent metabolic programmes.

## Product Loop

```text
signal -> bounded pattern -> Mira's mission -> user choice -> outcome -> next adaptation
```

The first minute is intentionally simple:

- see the value proposition;
- choose a role;
- use a demo signal, connect data, share a private moment from today, or start with a general habit mission;
- get one mission;
- choose "Do it now", "Make it easier", or "Later today".

Mira stays concise: what she noticed, what she proposes, and what she is waiting for. "Why this?", her decision trace, and optional rehearsal are available through progressive disclosure. Rehearsal is a behavioural nudge, not a gate: its scenario and mechanics are derived from the approved mission, never arbitrary rewards or raw health data.

## Safety Boundary

Sukari is habits-only. It does not diagnose, recommend medication or insulin doses, claim causality from one action, or contact another person without consent.

## Local Development

```bash
npm install
npx expo start
```

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
npm run build:web
```

## Learn More

- [Sukari docs](docs/README.md)
- [Hackathon pitch](docs/HACKATHON.md)
- [Product design](docs/PRODUCT_DESIGN.md)
