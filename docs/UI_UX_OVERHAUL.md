# UI/UX Overhaul — Presage Challenge Sprint (Nov 16–22, 2026)

Goal: close the gap between `PRODUCT_DESIGN.md`'s stated register (calm clinical
instrument, ambient field, spatial conversation) and the rendered product —
before the SmartSpectra vitals check-in lands. Judges skim repos but watch the
demo video; polish on the patient surface is the differentiator.

## Audit findings (verified against rendered web build)

1. **Double onboarding**: `HeroIntro` → `WelcomeScene` on first open, and
   `HeroIntro` replays on *every* cold open because the conversation-first
   flow never sets `userMode` (`gamesPlayed === 0 && !userMode` is forever true).
2. **`MetabolicField` is not mounted on `ConversationHome`** — the signature
   ambient layer is absent from the most-seen screen.
3. **Mission surface is the weakest element**: a full-width "TODAY'S CUE"
   slab with a small circled icon reads as an ad slot, not the core product
   object.
4. **No suggested replies**: the intent parser requires patients to guess
   magic words. Every comparable surface (Lark, Wysa, Pi) scaffolds the turn.
5. **Orb undersized** (90px marble), posture label computed but never
   rendered, `LoopRing` hairline illegible.
6. **Header is debug-chrome**: bare text buttons, no wordmark, "Care team"
   (an operator surface) exposed on the patient home at equal weight.
7. **History illegible**: only last 3 messages readable; older at 40%
   opacity fails contrast.
8. **No glanceable mission state** — "one mission today" but the screen
   can't say whether it's offered, accepted, or done.
9. **No designed measurement moment** — camera consent, live vitals, and
   the transition into mission have no home in the visual language. This is
   the challenge centerpiece and the opportunity.
10. Craft debt: 4–6px radii (boxy), unused `SHADOWS` tokens, dead
    `HomeMission`/`game` surfaces, care screen off-token.

## Fix plan

### P0 — demo-blocking (this sprint)

| # | Change | Files |
|---|--------|-------|
| 1 | Single intro: `WelcomeScene` is the one cinematic moment; remove `HeroIntro` gate entirely | `app/index.tsx` |
| 2 | Mount `MetabolicField` behind conversation, driven by `fieldStateFromPattern(pattern, {missionCompleted, deferred})` | `ConversationHome.tsx` |
| 3 | `MissionCard`: soft-radius elevated card — kicker, glyph, `realWorldAction`, `realmCopy` reason, phase-aware state line | new `components/programme/MissionCard.tsx` |
| 4 | `SuggestedReplies`: phase-bound chips whose labels parse cleanly through `intentParser` | new `components/home/SuggestedReplies.tsx`, wired in `ConversationHome` |
| 5 | Orb stage: size 132 + rendered posture label/message; header wordmark + icon buttons (charter, settings); "Care team" moves into `HomeSettings` | `ConversationHome`, `MiraOrb`, `HomeSettings`, `MainMenu` |
| 6 | History: all messages legible (opacity 0.62, no clamp); mission-state line under orb | `ConversationHome` |

### P1 — polish

- `care.tsx`: keep light operational register but adopt `FONTS`/`COLORS`-derived
  tokens where cheap (deferred — not on the demo path).
- Accessibility: ≥44px touch targets on header buttons; no text below 4.5:1.

### P2 — the centerpiece (this sprint)

7. **Vitals check-in** — designed measurement moment:
   - `domain/vitals/types.ts` — `VitalsReading`, `VitalsProvider` interface
     (the seam SmartSpectra native bindings will implement on mobile later)
   - `domain/vitals/wsProvider.ts` — frames → `server/vitals-node` over
     WebSocket (browser `getUserMedia` → `sendFrame` → live metrics)
   - `domain/vitals/simulatedProvider.ts` — labelled demo fallback, no API
     key required
   - `components/checkin/` — consent card (frames processed on-device in
     memory; only derived vitals kept) → camera stage with live metrics
     readout → "Mira noticed" transition back into conversation
   - Wire: camera icon in input bar; reading completes → user message +
     deterministic Mira line (no LLM dependency)

### Explicitly out of scope

- `care.tsx` visual rework beyond token hygiene
- Native (iOS/Android) check-in — web surface only this sprint
- Dead-code removal (`HomeMission`, `game/` naming) — noted for hygiene PR

## Demo path this enables

Welcome → orb + ambient field → Mira opens → mission card → camera icon →
consent → live reading (pulse/breathing on screen) → "Mira noticed…" →
adapted mission — one continuous, designed arc.
