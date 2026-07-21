# Sukari

**One mission today. Better evidence for tomorrow.**

Sukari is a personalised action adherence layer for continuous metabolic care. Mira, the shared Famile agent, turns a connected signal, labelled demo pattern, or private local check-in into one patient-controlled habit mission, then adapts the visual support and follow-up around that real-world choice.

Built for type 2 diabetes, prediabetes, GLP-1-supported lifestyle care, and adjacent metabolic programmes.

## Product Loop

```text
signal -> bounded pattern -> Mira's mission -> conversation -> outcome -> next adaptation
```

The patient opens the app into a conversation with Mira, not a form or a card. Mira initiates with a contextual observation based on current state and memory of past sessions. The patient responds in natural language — "sure", "that's too much", "I walked for 10 minutes" — and the mission lifecycle (accept, make easier, defer, complete, decline) happens in the thread. Free-form questions escalate to the LLM.

The care team gets an active work queue, not a passive report. Mira generates proactive flags ("Completion dropped to 28%. She mentioned evenings were hard."), and operators work items through a status lifecycle: open, contacted, snoozed, resolved.

Mira stays concise: what she noticed, what she proposes, and what she is waiting for. "Why this?", her decision trace, is available through progressive disclosure.

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
