# Sukari

**One mission today. Better evidence for tomorrow.**

Sukari is an AI adherence layer for continuous metabolic care. It turns an observed pattern into one patient-controlled habit experiment, helps the person follow through in real life, and gives the care team evidence only when human attention may help.

It is built for the gap between appointments in type 2 diabetes, prediabetes, GLP-1-supported lifestyle care, and adjacent metabolic programmes.

## The Loop

```text
signal or labelled demo
  -> one mission
  -> act now, later today, or optional rehearsal
  -> real-world follow-through
  -> measured response
  -> care-team exception when useful
```

The rehearsal is a short behavioural nudge, not the product. It is optional, personalised to the accepted mission, and designed to make a real-world choice easier.

## How the Agent Works

Sukari does not give free-form medical advice. A deterministic pattern layer identifies a bounded observation from a connected signal or a clearly labelled demo. The agent can select from approved habit templates, personalise supportive wording, and summarise the decision.

Every recommendation has a visible decision trace:

- what Sukari observed;
- the one action it proposed;
- what it will measure next;
- the limits of the evidence and safety boundary.

Sukari never diagnoses, recommends medication or insulin doses, claims causality from a single action, contacts another person without consent, or hides why a mission was proposed.

## Personalised Media

The optional worker endpoint `POST /media/mission-image` uses Runware to create a mission illustration from an approved template and visual intent. It never sends raw glucose readings, patient names, or free-form health notes to a media prompt. When media generation is unavailable, Sukari uses a local visual cue and the mission flow continues normally.

Runware supports image, video, audio, and 3D tasks through the same task API, making this adapter the safe starting point for future voice prompts and interactive rehearsal scenes. [Runware platform documentation](https://runware.ai/docs/platform/introduction)

## Run Locally

```bash
cp .env.example .env
npm install
npx expo start
```

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
npm run build:web
```

`EXPO_PUBLIC_SUKARI_API_URL` enables optional coach, digest, and mission-media endpoints. The public submission URL remains `https://glucosewars.netlify.app`; the visible product name is Sukari. The legacy Expo slug and deep-link scheme remain for compatibility.

## More Detail

- [Product design](docs/PRODUCT_DESIGN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Hackathon pitch](docs/HACKATHON.md)
- [Pilot and launch checklist](docs/LAUNCH_CHECKLIST.md)
