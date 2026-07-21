# Sukari Hackathon Pitch

## Positioning

Sukari is a personalised action adherence engine for continuous metabolic care.

The product is the closed loop from signal to mission to real-world adherence evidence, with media support that reflects the person's approved mission rather than generic engagement mechanics.

> Continuous metabolic care fails between appointments. Sukari turns a person's current pattern into one personalised action, lets them act directly, learns from the response, and tells the care team when human attention is useful.

**Tagline:** One mission today. Better evidence for tomorrow.

**Not:** AI doctor, digital twin, NFT achievement product, leaderboard, or generic glucose game.

## Demo Script

1. Open the app. You're immediately in a conversation with Mira — no value screen, no role selection, no signal picker. Mira initiates: "I noticed a pattern in your evenings. Want to try one small thing today?"
2. Type "sure" to accept the mission. Mira responds and her orb shifts to watching posture.
3. Type "that's too much" to see Mira adapt — she offers a smaller variant in conversation. No buttons, no cards.
4. Type "I walked for 10 minutes" to log completion. Mira acknowledges and asks how it felt.
5. Type a free-form question like "what is protein?" to see Mira escalate to the LLM with grounded context.
6. Open the care-team work queue (`/care`). Show Mira's observations at the top — proactive flags with severity (urgent, worth a conversation, positive).
7. Show the work queue: status badges (open, contacted, snoozed, resolved), filter bar, sort options.
8. Expand a patient row. Show the quick actions: mark contacted, resolve, snooze 24h, reopen.
9. Explain that deterministic logic detects patterns and enforces safety; the LLM handles free-form chat inside that boundary.
10. Mention the optional Runware adapter: fixed-prompt image generation from an approved mission brief, with no raw readings or identifying data in the prompt.

The Amina demo remains deterministic for judging. Mira is the named Famile agent; Amina is only a deterministic synthetic patient fixture. Live signal paths are technical proof, but demos should not depend on OAuth success.

## Shipped Progress

| Area | Status |
|------|--------|
| Sukari brand and product copy | Done |
| Conversation-first patient interface (Mira initiates, patient responds in natural language) | Done |
| Intent parser: natural language to mission intents | Done |
| Conversation memory: cross-session context in AsyncStorage | Done |
| Conversation engine: deterministic state machine + LLM escalation | Done |
| Mira orb reflects conversation state | Done |
| Visible "Adjusted for you" mission adaptation in conversation | Done |
| Agent decision trace via progressive disclosure | Done |
| Deployed mission-specific visual cue with Runware adapter | Done |
| Labelled demo pattern | Done |
| Quiet measured response | Done |
| Local digest history | Done |
| Care-team work queue with status lifecycle (open, contacted, snoozed, resolved) | Done |
| Mira proactive flags for care team (safety, completion drop, barrier, recovery, streak, re-engagement) | Done |
| Work queue persistence in AsyncStorage | Done |
| Care-team outreach instrumentation | Done |
| Legacy Web3/NFT/leaderboard/challenge and combat/kingdom game surfaces retired | Done |
| Jest AsyncStorage mock and TypeScript cleanup | Done |

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
