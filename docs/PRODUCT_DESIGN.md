# GlucoseWars — Product Design & UI/UX North Star

> Design authority for the eMed × OpenAI hackathon build. When a screen, a line of copy,
> or a motion choice is in doubt, this document arbitrates.

---

## 1. The thesis in one paragraph

Chronic disease is not an information problem — it is a **decision-moment problem**. Patients
already know walks are good and late dinners are bad. They fail in the twenty-second window
between intention and action, alone, at 8pm, with no one watching. So GlucoseWars is not an
information device (dashboard, chatbot, content feed). It is a **rehearsal and commitment
device**: an agent that watches the signal, picks one winnable experiment a day, lets you
practice the decision in 45 seconds, follows up when you act, and only interrupts a clinician
when a human genuinely helps. Every pixel in this product either serves that loop or is deleted.

---

## 2. Four contrarian secrets (why the design looks like this)

Everyone at this hackathon will demo an AI that **says things**. Ours demos an AI that
**does things — inside a charter you can read.** Four beliefs drive every design decision:

### Secret 1 — Comprehension is not the bottleneck. Commitment is.
The industry keeps building better explanations: smarter dashboards, chattier companions,
richer "insights." But nobody with type 2 diabetes is confused about whether a walk helps.
**Design consequence:** every patient screen drives toward one committed action. Understanding
is always one tap away ("Why this?") but never the headline. We do not compete on explaining;
we compete on *the next right thing, made easy to actually do*.

### Secret 2 — Engagement is the wrong sign.
Health apps optimize time-in-app, streaks, DAU — the ad-tech metrics. But the goal of chronic
care is a patient who needs *less scaffolding over time* as habits consolidate, while the
clinical system trusts the system *more*. **Design consequence:** no feeds, no badges, no
streak-shame, no confetti for compliance. Quiet wins. The app should feel *smaller* as the
patient succeeds. Our framing for judges: **adherence per minute of attention** — if
engagement graphs go down while adherence goes up, the product is working. This is why
NFTs, leaderboards and multiplayer were deliberately demoted.

### Secret 3 — The clinician doesn't need a dashboard. They need fewer patients to think about.
Population-health tools hand clinicians *more surface area to worry about*. The agentic win is
the opposite: absorb the 95% and make the 5% unmistakable. **Design consequence:** the care
surface is an exception artifact, not a panel viewer. Its message is "your panel is fine —
these two people need you, here is why, here is the suggested outreach."

### Secret 4 — Autonomy is only valuable with a legible boundary.
The 2026 wave of "agentic health AI" will be vague about what the agent may do. Vagueness
reads as risk to patients and as liability to clinicians. Trust comes from a published agency
contract. **Design consequence:** the Agency Charter (§4) is a first-class, in-product
artifact, and every autonomous act is paired with a visible patient control.
**The agent proposes. The patient disposes.**

> Graham corollaries: adherence is the *schlep* of digital health — unglamorous, avoided,
> therefore open (schlep blindness = moat). Maya is a hand-authored patient; the mission
> library is hand-tuned (do things that don't scale — the magic lives in the unscalable care).
> And nobody *wants* to "manage their diabetes" — they want tomorrow to feel winnable.
> One mission is one winnable unit.

---

## 3. Positioning

**Category:** the adherence layer for continuous metabolic care (closed-loop adherence).
**Tagline:** One mission today. Better evidence for tomorrow.
**10-second pitch:** "Our agent watches the metabolic signal, picks one winnable experiment
a day, rehearses it with you in 45 seconds, follows up when you act, and only bothers your
care team when a human actually helps."

**Explicitly not:** an AI doctor · a symptom chatbot · a gamified education app · another
dashboard. Habits only — never insulin, dosing, or diagnosis.

---

## 4. The Agency Charter — the agentic differentiator

The single most differentiated design artifact in this product. Most agentic demos hand-wave
autonomy; we **publish the boundary** and render it in the UI. The charter is shown during
onboarding, is one tap from home ("What your agent does"), and every agent-initiated element
on screen carries a quiet marker of which lane it came from.

| Lane | The agent… | Concrete behaviors |
|------|-----------|--------------------|
| **Always** (autonomous) | Acts without asking, within scope | Detects one actionable pattern from CGM / programme signals · selects and schedules today's single mission · remembers accepts / eases / swaps / declines and adapts tomorrow's difficulty · follows up on a "Later today" promise once, gently · compiles the weekly exception summary · watches coach chat for safety language and escalates *out* of the app |
| **Asks first** (proposals) | Proposes, waits for consent | Changing a mission mid-day · involving a caregiver (`invite/support`) · suggesting the care team reach out · trying a mission category the patient hasn't used before |
| **Never** (out of scope) | Refuses, by design | Medication or insulin dosing · diagnosis · shame, penalties, or guilt copy · contacting anyone without consent · hiding its reasoning — "Why this?" is always one tap away |

**Why judges should care:** the charter converts "agentic" from a buzzword into a governable
product surface. It is simultaneously the trust story, the clinical-safety story, and the
demo sound-bite: *"Everyone else shows an AI that says things. Ours shows an AI that does
things — within a charter the patient can read."*

**UI treatment:** charter lane markers are a small glyph + one-word tag (`Autonomous`,
`Proposal`) on agent-initiated cards. Tapping opens the charter. Nothing agent-initiated
appears without a marker. This is how "differentiated (agentic)" becomes *visible*.

---

## 5. Experience architecture — one world, three altitudes

Immersion comes from coherence, not attention capture. The product is **one continuous
place — the metabolic field — seen at three altitudes**, not a stack of screens:

- **Ground** — the patient's home: the field as it is today, plus one mission.
- **Training** — the rehearsal arena: the field, zoomed in, where you practice the decision.
- **Satellite** — the care-team digest: the field, summarized, with exceptions flagged.

The field metaphor never breaks. A spike at Ground is turbulence in Training is a flag in
Satellite. Same world, same physics, same colors. That is the cohesion and the immersion.

### The loop as surfaces (each maps to code)

| # | Surface | Job | Emotional beat | Repo |
|---|---------|-----|----------------|------|
| 1 | **The Field (home)** | 3-second glance: how things are + today's one thing | Calm agency — "I know what today asks of me" | `app/index.tsx`, `components/game/MainMenu.tsx`, `components/atmosphere/MetabolicField.tsx` |
| 2 | **Mission card** | Convert a pattern into one committed experiment | Being advised, not nagged | `components/programme/PatternMissionCard.tsx` |
| 3 | **Rehearsal arena** | Practice the decision once, ≤60s, safely | Focused play with a purpose | `app/(game)/battle.tsx`, `components/programme/MissionRibbon.tsx` |
| 4 | **Transfer beat** | The handoff: simulation → real life | A small ceremony of commitment | `components/programme/TransferBeat.tsx`, `app/(game)/results.tsx` |
| 5 | **Measure / quiet win** | Close the loop truthfully: associated response | Earned, quiet satisfaction | `components/programme/QuietWinBeat.tsx`, `RehearsalSummary.tsx` |
| 6 | **Coach** | In-between companion for habit questions | A calm physiologist on call | `domain/coach/*`, `hooks/useCoach.ts` |
| 7 | **Care-team digest** | Exception-oriented weekly intelligence | "Two people need me. I know why." | `app/digest/[token].tsx`, `domain/digest/*` |

### Surface notes

1. **The Field (home).** Ambient state first, analytics never. Time-of-day background already
   ships (`getAmbientColor`); extend so the `MetabolicField` band/intensity reflects the
   current pattern state — steady field = in range, visible turbulence = excursion. One
   mission card. The LoopStrip shows where today sits in Detect → Mission → Rehearse → Act →
   Measure. **Forbidden on this screen:** badges, unread counts, secondary CTAs competing
   with the mission.
2. **Mission card.** Decision surface, not content surface. Governance row — Accept /
   Easier / Another / Not practical — is the charter made tangible; all four options are
   always present and equally dignified. Declining is a first-class outcome, not a failure.
3. **Rehearsal arena.** The one place energy is allowed — a deliberate register shift into
   "training room." The mission ribbon carries the real-world ask into play so rehearsal is
   never abstract. 45 seconds, biased to today's habit. It must feel like an instrument
   being steadied, not an arcade.
4. **Transfer beat.** The signature moment of the product — design it like a 10-second
   ceremony. "I did it" / "Later today" / invite support. "Later today" persists a soft
   state on home ("Waiting on you today") and triggers exactly one gentle follow-up. This
   handoff — rehearsal becoming behavior — is the whole thesis in one interaction.
5. **Measure / quiet win.** Associated-response language only: "evenings after walks ran
   steadier this week" — never "the walk caused it." The field visibly settles. This is the
   dopamine, but earned and truthful.
6. **Coach.** Habit-scope only (`CLINICAL_SCOPE`). Speaks like a calm physiologist, never a
   cheerleader. Safety language escalates out of the app with crisis resources — visibly,
   per the charter's Never lane.
7. **Care-team digest.** One screen. Outreach suggestions with rationale, safety flags,
   and explicit silence about everyone who is fine. No lore, no charts-for-charts'-sake.

---

## 6. The states of the day (temporal design)

The product has a daily rhythm, and the agent initiates it — the home screen is a
conversation the agent started, not an empty app waiting for input:

| Time | Agent behavior | Field register |
|------|----------------|----------------|
| Morning | Today's mission arrives; one notification max | Possibility — lighter, slower drift |
| Midday | Silence, unless a "Later today" promise is aging | Neutral |
| Evening | Rehearsal prompt if unpracticed; follow-up on the promise | Focus |
| Night | Quiet reflection if mission completed; nothing if not — no guilt | Settling — darker, minimal motion |

Deferred missions never expire into shame. The agent returns tomorrow with the difficulty
adjusted. That *is* the adherence model: persistent, patient, unjudging.

**Empty / edge states:** first run → `HeroIntro` (the charter lives here); no signal →
programme-default mission, honestly labeled; declined mission → acknowledged, no penalty
copy; demo → Maya scene chips (Pattern / Measure / Outreach).

---

## 7. Visual language

**Register:** clinical instrument with a pulse. Editorial, not SaaS. Adult, not arcade.

- **Color.** `COLORS.PROGRAMME` (ink `#0B1210`, mist, line, text) is the world; the zone
  accents (accent/warn/cool/danger) are the **only saturated hues in the product** —
  saturation = signal. If a screen is colorful, it is either the arena or something is wrong.
  Never purple-on-black on programme surfaces.
- **Typography.** Fraunces (display serif) for moments of meaning — the mission, outcomes,
  the quiet win. DM Sans for everything operational. The serif is the human in the machine;
  use it sparingly so it stays meaningful.
- **Motion semantics.** Motion carries meaning, never decoration. Field amplitude/turbulence
  = variability; settling = the reward for acting. Baseline drift is slow (~9s loops).
  Nothing bounces. `prefers-reduced-motion` is honored (already in the web field).
- **Haptics.** One haptic heartbeat on real-world completion. Silence is the default
  expression of respect.
- **The arena exception.** The training room may run hotter than the programme palette —
  but the mission ribbon keeps it tethered to the real ask, and the return home should feel
  like a *settling*, a visible exhale.

---

## 8. Voice & copy

Second person, present tense, plain. The agent observes, proposes, and remembers; it never
scolds, celebrates compliance, or performs enthusiasm.

| Moment | ✅ Say | ❌ Never say |
|--------|--------|--------------|
| Pattern | "Your evenings have been running high this week." | "⚠️ ALERT: glucose excursion detected" |
| Mission | "One small experiment tonight: a 10-minute walk after dinner." | "Your task today is…" |
| Decline | "No problem — I'll bring something different tomorrow." | "You'll lose your streak!" |
| Quiet win | "Evenings after walks ran steadier this week." | "🎉 AMAZING! You crushed it!" |
| Waiting | "Waiting on you today — no penalty for waiting." | "You're falling behind." |
| Escalation | "This is beyond what I can help with — here's how to reach your care team now." | Any attempt to coach through a safety issue |

The word "experiment" does heavy lifting: it reframes adherence from obedience to curiosity —
bounded, falsifiable, the patient's choice. Keep it.

---

## 9. How the design answers the brief

| Judge criterion | Our design answer | Demo moment (Maya) |
|-----------------|-------------------|--------------------|
| High impact | Adherence is the largest unowned lever in chronic care; we own the between-visit gap | Pattern scene — a real evening pattern, not a vitals chart |
| Innovative | Rehearsal + transfer loop; published Agency Charter; exception-only clinical surface | Charter glyph on the mission card → tap to open |
| Feasible | Habits-only scope, constrained mission library, patient governance on every act, honest non-HIPAA callout | "Why this?" drawer: coverage, evidence, safety line |
| Demonstrable | Deterministic 14-day Maya arc with time jump; closed loop end-to-end | Scenes 1→2→3, then Care team |
| Effortless adherence | One mission, four dignified choices, one gentle follow-up, no guilt | "Later today" → soft home state |
| Human-like coaching | Agent initiates the day, remembers your choices, adapts difficulty | Scene 2 reflection copy |
| Data → action | Pattern → one experiment, comprehension on demand | "Why this?" drawer |
| Detect changes at home | Escalation day in the Maya timeline | Scene 3 · Outreach |
| Clinicians informed | Exception digest: "your panel is fine — these two need you" | Care-team surface, final beat |

**Sound-bites for the room:**
- "Healthcare doesn't need another dashboard telling patients what happened. It needs a
  system that helps them do the next right thing — and learns whether it worked."
- "Everyone else here demos an AI that says things. Ours demos an AI that does things —
  within a charter the patient can read."
- "We optimize adherence per minute of attention. If our engagement goes down while
  adherence goes up, the product is working."

---

## 10. Build order (hackathon reality)

**Already shipped (per HACKATHON.md):** pattern → mission card with governance row · Maya
14-day demo with scene chips · rehearsal ribbon in battle · transfer beat + deferred home
state · quiet win · exception digest · habit-only coach · unified "steady the field" register.

**Polish (highest leverage per hour):**
1. ~~Agency Charter artifact~~ — **Shipped:** `constants/agencyCharter.ts` (single source of
   truth), `/charter` screen, `AgencyLaneTag` markers on agent-initiated cards, shield entry
   in the home top bar, charter scene in `HeroIntro`.
2. ~~Field-state binding~~ — **Shipped:** `domain/patterns/fieldState.ts` maps the live
   pattern to `MetabolicField` band/intensity; completion visibly settles the field.
3. ~~Transfer-beat ceremony~~ — **Shipped:** three staged beats (progress → the ask → the
   choice), reduced-motion aware; completion triggers the Settle + one haptic heartbeat.
4. ~~Copy sweep~~ — **Done:** programme surfaces already hold the register (no cheerleader or
   alarmist copy found); §8 remains the bar for all new copy.
5. ~~Digest first fold~~ — **Shipped:** verdict hero ("A human helps this week." / "No human
   needed this week.") readable in 5 seconds; superseded banner styles deleted.
6. ~~Caregiver loop in the daily rhythm~~ — **Shipped:** declining a mission triggers an
   asks-first support proposal (the charter's `Proposal` lane, live in the UI) with one
   concrete, no-monitoring support ask. Re-arms on each new mission.
7. ~~The legacy seam~~ — **Shipped:** challenges, lore library, identity treasury, wallet
   connect, customize-practice and dead mint modal removed; `game-selection`, `welcome`,
   `challenge/*` routes redirect home. One register, everywhere.

**The Settle — the signature moment (shipped):** `MetabolicField` now interpolates band color
and intensity on every state change (`utils/fieldColor.ts`, exponential approach ≈1.2s, the
physics of a system returning to equilibrium). Acting in real life visibly calms the field —
the product thesis in one animation. Web: in-loop lerp with zero re-renders. Native: rAF
interpolation. Reduced motion: snaps instantly. Paired with `completionHeartbeat()` haptic.

**Narrate, don't build (roadmap slide):**
- **Voice coach (Runware speech models)** — "Listen to today's mission." Accessibility for an
  older T2D population, and the most human-like coaching channel. Architecture: worker
  `/coach/speak` → Runware speech → audio; web playback needs no new deps, native via
  expo-audio later. Demo-safe path: pre-generated Maya clips (deterministic, no live API risk).
- **The field as a shareable artifact (Runware image models)** — the weekly field rendered as
  an image the patient can hand to a clinician or supporter; also the agent's visual presence.
- Wearable context beyond CGM · multi-condition expansion (below).

**Provider doctrine (shipped):** OpenAI for reasoning (coach chat/mission, primary), Runware
for generative media (voice/image, reserved), deterministic templates as offline fallback.
Three tiers of degradation — the demo can never die on stage.

**Beachhead discipline (Thiel):** single-condition is the strategy, not the gap. The loop is
condition-agnostic by construction — `PatternKind` + mission templates are config; CVD and
women's health are new pattern packs, not re-architecture. Dominate T2D/prediabetes
adherence first, then expand the pattern library.

---

## 11. Metrics the design serves

North star: **Weekly Adherent Patients (WAP)** — ≥1 real-world mission completed + ≥1
practice session per week. Supporting: mission accept/complete rates, D7/D30 engagement,
digest usefulness, staff minutes per enrolled patient. And the inversion we say out loud:
**adherence per minute of attention** should rise even as session time falls.

---

## 12. Anti-goals — what we refuse to build

Feeds, inboxes, and notification piles · streaks, badges, and shame mechanics · causal
overclaiming from observational data · dosing or diagnosis, ever · dashboards for clinicians ·
chatbot-as-product · engagement for engagement's sake.

The discipline is the brand: **one world, three altitudes, one mission a day, and an agent
whose powers you can read.**

