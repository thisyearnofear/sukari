# Interface Differentiation — beyond category polish

Status: thinking doc, Nov 2026. Feeds the SmartSpectra challenge and the
longer product direction.

## The honest starting point

The UI/UX overhaul closed the *execution* gap: Sukari now meets the polish
bar of Lark/Wysa-class care apps with Pi-adjacent presence. But meeting the
bar isn't differentiation — orb + chat + suggested replies is a pattern any
competent team now ships. The question that actually matters:

**What can Sukari's interface do that no other metabolic-care product can?**

The answer is already in the codebase. Three primitives nobody else has
combined:

1. `MetabolicField` — an ambient state-space, not a chart or a score
2. Mira's *posture vocabulary* — presence as a first-class channel, not chat
3. `domain/vitals` — a live camera signal that can enter the interface itself

The differentiation is not more screens or more chrome. It's making the
body legible through the interface — and the interface quiet enough that
the body is what you notice.

## Research threads

**Calm technology / ambient display** (Weiser & Brown lineage; komorebi
notifications, SIGGRAPH Asia '25; CushLumi "Living with Data", CHI '25):
information as environment — glanceable weather, not a feed. The research
consistently shows ambient displays beat notifications for long-horizon
behaviour because they don't nag; they simply *are*. Sukari's field is
already this — but today it's decorative, not information-bearing.

**Data physicalization / biofeedback surfaces** (LivingSurface TEI '16;
Vital+Morph TEI '17; Kuddi CHI '25): physiological signal rendered as a
living material — heartbeats vibrating a surface, a pillow that breathes
with you. The finding that matters: people form a *felt* relationship with
their signal when it's rendered as something alive rather than a number.
Nobody in metabolic care does this on screen.

**Just-in-time / generative interfaces** (Google's genUI; "Interface of
Theseus", UIST '25): interfaces materialized at the moment of need and
dissolved after. Not AI-generated code — *designed moments* that exist
only while they're useful.

**Companion presence** (Pi × ustwo; Tolan's Orb; Tolan's AI-authored
journal): the winning moves were stripping conventions, making agent state
legible through animation vocabulary, and AI-written reflections that make
the relationship feel continuous between sessions. Also the Purr precedent:
an interface whose goal is to disappear — haptics over pixels.

## The differentiation thesis

Every metabolic app shows you *data about your body*. Scores, rings,
charts, trends. Sukari can be the product where **your body is the
interface** — the field is a living mirror of metabolic state, measurement
visibly enters the interface, and the whole thing is quiet enough to live
inside a day.

A sentence for positioning: *an instrument you tune, not a dashboard you
check.*

## The moves, ranked

### 1. The semantic field (make the backdrop carry meaning)

Today `MetabolicField` is atmosphere. It should be *read*:

- **Field states as metabolic weather** — steady / charged / depleted /
  settling, each with a distinct texture, drift speed, and band signature.
  Glance at the field, know the state — no numbers required.
- **Field as navigation** — scrolling through the field is moving through
  time: today's field, this week's field. Same material, different depth.
  Time-series without a chart.
- **Field as mission offer** — today's mission materializes *from* the
  field (a formation that settles into the card), not a slab dropped on it.

This is the highest-leverage move: it converts an existing asset into the
product's signature.

### 2. The embodied check-in (the demo showstopper)

During a vitals reading, drive `MetabolicField` from the live signal:

- pulse rate → field ripple/oscillation frequency
- breathing rate → the field's slow breath cycle
- reading settles → field visibly *incorporates* the signal and calms

You watch your own physiology enter the interface. That's the "responds
meaningfully to real-time signals" criterion made visceral — and it's a
parameter feed into an existing component, not new machinery. For the
demo, the field syncing to the measured pulse is the clip judges share.

### 3. Interface dissolution (success = you leave)

Chronic-care apps live or die on a perverse metric: they need you for
years but should demand minutes per day. The interface should *want* to
end:

- Mission accepted → Mira's posture goes restful, the field drifts toward
  stillness, a closing line: "Go live it. I'll be here." The app visibly
  settles — session complete as a designed moment, not an abandoned tab.
- The Purr lesson: the best state for this app is *unopened*, because the
  mission happens in the world. Making the interface gracefully closeable
  is the brand's trust move.

### 4. Circadian character (the app has a body clock)

Metabolic care is inherently temporal — fasting mornings, post-meal
windows, evening patterns. Nobody renders that:

- The field's palette and activity follow time of day: pale and quiet at
  dawn, clear midday, warm and dim evening, near-asleep at night.
- Mira's posture and vocabulary shift with it — evening Mira reads
  different than morning Mira.
- Cheap to implement (tokens + a time-of-day resolver), immediately felt,
  and it makes the app feel *alive in your day* rather than a screen.

### 5. Materialized moments (JIT interface, designed not generated)

Instead of fixed screens, Mira composes what the moment needs — a
60-second breathing pacer, a "field this week" horizon, a check-in
ritual — as ephemeral elements that dissolve back to presence. The app is
a stage that produces instruments, not a navigation tree.

### 6. Mira's written presence (borrow Tolan's best idea)

The AI-authored journal was Tolan's retention engine. Sukari's version is
already half-built (conversation memory + weekly digest): **Mira writes a
short letter** — "what I noticed this week" — prose, not a stats card.
Presence that persists between sessions.

### 7. The shared field (long-term, two-sided)

Vital+Morph's insight — a body rendered as an ambient object makes remote
presence felt. Two applications:

- **Caregiver/partner**: a second, smaller field on their device carrying
  the same weather — felt awareness without surveillance.
- **Care-team surface**: the exception queue reframed as *the field at
  population scale* — each patient a light in a dark field; exceptions
  are lights leaning toward attention. One metaphor unifies the patient
  and operator products instead of two visual languages.

## What this argues against

- More screens, more cards, more tabs — every addition dilutes the one
  thing (the field + presence) that can't be copied by a design system.
- Numbers-first surfaces — scores invite comparison with Oura/Whoop where
  we lose on sensor depth. Weather is ours.
- Generative-UI-for-its-own-sake — the JIT move is *designed* moments,
  not AI-coded widgets; quality control stays human.

## Suggested next step

Prototype move 2 (embodied check-in) — it's the smallest build with the
largest narrative payoff for the challenge: `VitalsReading` already flows;
the work is mapping pulse/breathing into `MetabolicField` parameters and
letting the field absorb the signal on settle. Then move 1's state
vocabulary, so the field's *response* reads as a state change, not just
more motion.
