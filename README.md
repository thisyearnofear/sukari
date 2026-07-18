# Sukari

**One mission today. Better evidence for tomorrow.**

Sukari is an AI adherence layer for continuous metabolic care. It turns a connected signal or clearly labelled demo pattern into one patient-controlled habit mission, then helps the person act, adapt, or defer without turning the experience into another dashboard.

Built for type 2 diabetes, prediabetes, GLP-1-supported lifestyle care, and adjacent metabolic programmes.

## Product Loop

```text
signal -> pattern -> mission -> user choice -> outcome -> next adaptation
```

The first minute is intentionally simple:

- see the value proposition;
- choose a role;
- use a demo signal, connect data, or start with a habit mission;
- get one mission;
- choose "Do it now", "Make it easier", or "Later today".

"Why this?", the agent decision trace, and optional rehearsal are available through progressive disclosure. Rehearsal is a behavioural nudge, not a gate.

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
