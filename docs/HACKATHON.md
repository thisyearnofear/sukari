# Sukari Hackathon Pitch

## Positioning

Sukari is a personalised action-and-play adherence engine for continuous metabolic care.

Optional rehearsal is a gamified learning mechanism, not the product. The product is the closed loop from signal to mission to real-world adherence evidence, with game and media support that reflect the person's approved mission rather than generic engagement mechanics.

> Continuous metabolic care fails between appointments. Sukari turns a person's current pattern into one personalised action, lets them act directly or rehearse that specific decision, learns from the response, and tells the care team when human attention is useful.

**Tagline:** One mission today. Better evidence for tomorrow.

**Not:** AI doctor, digital twin, NFT achievement product, leaderboard, or generic glucose game.

## Demo Script

1. Start at the Sukari value screen.
2. Select a role.
3. Connect a signal, use the labelled demo pattern, or show the private local check-in.
4. Show the mission card before rehearsal.
5. Choose "Make it easier" or "Later today" once to show the visible "Adjusted for you" agent moment.
6. Accept the mission or complete now; show optional rehearsal only after the real-world choice is clear.
7. Point out "Optional practice, tuned for today." Explain that the game field is mechanically shaped by the approved mission: for example, drink missions surface more drink decisions and protein missions favour relevant ally choices.
8. Open "Why this?" to show the structured signal -> mission trace and the mission visual cue.
9. Explain that deterministic logic detects patterns and enforces safety; the LLM may personalise approved copy or smaller variants inside that boundary.
10. Mention the optional Runware adapter: fixed-prompt image generation from an approved mission brief, with no raw readings or identifying data in the prompt.
11. Show measured response language.
12. Open the care-team panel to show exception rationale and weekly outcomes.

The Maya demo remains deterministic for judging. Live signal paths are technical proof, but demos should not depend on OAuth success.

## Shipped Progress

| Area | Status |
|------|--------|
| Sukari brand and product copy | Done |
| Value proposition before role selection | Done |
| Signal path: demo, connect, or habit mission | Done |
| Private local check-in maps a moment to an approved mission | Done |
| Mission card before rehearsal | Done |
| Direct-action path without rehearsal | Done |
| Visible "Adjusted for you" mission adaptation | Done |
| Compact responsive rehearsal surface | Done |
| Mission-tuned practice mechanics and visible focus | Done |
| Agent decision trace | Done |
| Progressive disclosure: “Why this?” context | Done |
| Deployed mission-specific visual cue with Runware adapter | Done |
| Labelled demo pattern | Done |
| Mission ribbon in battle | Done |
| Transfer beat and later-today state | Done |
| Quiet measured response | Done |
| Local digest history | Done |
| Desktop care-team exception panel | Done |
| Care-team outreach instrumentation | Done |
| Legacy Web3/NFT/leaderboard/challenge surfaces retired | Done |
| Jest AsyncStorage mock, hook-order fix, TypeScript cleanup | Done |

## Commercial Wedge

Buyer: virtual diabetes clinics, GLP-1 lifestyle programmes, employer metabolic programmes, and CGM-supported nutrition services.

Beachhead: adults with T2D or prediabetes in a CGM-supported metabolic programme.

Value: higher mission completion, better retention, fewer manual outreach minutes, and a clearer exception list for care teams.

## Safety

- Habits only.
- No insulin or medication dosing.
- No diagnosis.
- Patient can decline or modify every mission.
- Demo data is labelled.
- Production care-team access requires consent, authentication, and audit logs.

## Closing Line

Healthcare does not need another dashboard telling patients what happened. It needs a system that helps them do the next right thing and learns whether it worked.
