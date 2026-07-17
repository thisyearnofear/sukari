# GlucoseWars — UGC‑Lite Spec (Seeded Challenges + Share Links)
Date: 2026-04-17

## 0) Objective
Ship a **UGC-lite** system that creates a real growth loop without building a full editor yet:

**Create challenge → share link → friend plays instantly → score posts to leaderboard → friend shares back/remixes**

Key constraint: leverage what you already have (tiers, seeded RNG, weekly seed, leaderboards UI patterns) and keep it web-friendly.

---

## 1) What “UGC” means here (definition)
UGC-lite = **player-generated challenges**, not full content creation.

Players can create challenges by choosing **a small set of modifiers** which produce a deterministic “challenge run” when combined with a seed.

Later (V1) this can evolve into user-created scenario decks / plot twist sets / custom food pools.

---

## 2) Core artifacts (viral objects)
### A) Challenge Link (primary viral object)
A URL that encodes:
- seed + tier + game mode + modifiers (and optionally “creator id”)

**Example**
`/challenge/play?tier=tier2&mode=classic&seed=9k3p2a&mods=fast_spawn,low_combo_window`

This must launch straight into the run with **minimum friction**.

### B) Result Card (secondary viral object)
After the run:
- a shareable “Proclamation” image/text snippet
- includes: score, tier, challenge name, short tagline, and the **challenge link**

---

## 3) Screens (MVP: 3–4 screens)
### Screen 1: Challenge Hub (Discover)
Route: `app/challenge/index.tsx` (new)

Shows:
- “Play a Featured Challenge” (daily/weekly)
- “Play a Friend’s Challenge” (paste link OR auto-detect deep link)
- “Create a Challenge” CTA
- “My Challenges” (created by me)

**Featured challenge logic (MVP):**
- Daily: seed = `YYYY-MM-DD` hash
- Weekly: reuse existing `getWeeklySeed()` style approach

---

### Screen 2: Create Challenge (Create)
Route: `app/challenge/create.tsx` (new)

Inputs (MVP):
- Tier selector: tier1 / tier2 / tier3
- Game mode: classic / life (optional to include in MVP; can start with classic only)
- Challenge name (optional; auto-generate if empty)
- Modifiers (2–6 toggles max)

**Recommended modifiers (MVP):**
- `fast_spawn` (spawnRateMultiplier +X%)
- `slow_spawn` (spawnRateMultiplier -X%)
- `fast_fall` (speedMultiplier +X%)
- `thin_margins` (narrow “balanced” zone OR increase drain rates slightly)
- `short_combo_window` (combo window reduced)
- `no_powerups` (disable exercise/rations)

Output:
- generate `challenge_id`
- generate seed (random short string) OR allow creator-set seed (“seeded by creator”)
- show **Share** (copy link)
- show **Play Now** (go to play route)

---

### Screen 3: Play Challenge (Instant Play)
Route: `app/challenge/play.tsx` (new)

Behavior:
- Reads query params.
- Sets game session state for tier/controlMode/mode.
- Applies modifiers to the battle engine.
- Jumps into battle immediately (skip most onboarding; show 1 lightweight “Challenge rules” overlay).

Note: This is where you ensure “friend click → instant fun”.

---

### Screen 4: Challenge Results + Leaderboard (Compete)
Route: `app/challenge/results.tsx` (new) OR reuse existing results with a “challenge mode” panel.

Shows:
- Your score + rank
- Top scores (global for that `challenge_id`)
- Share Proclamation (result card + link)
- Remix CTA (“Fork this challenge” → create screen prefilled)

---

## 4) Minimal data model (MVP)
You can implement MVP with **client-side persistence** first, then optionally add Beam/back-end later.

### Types
```ts
type ChallengeTier = 'tier1' | 'tier2' | 'tier3';
type ChallengeMode = 'classic' | 'life';

type ChallengeModifier =
  | 'fast_spawn'
  | 'slow_spawn'
  | 'fast_fall'
  | 'thin_margins'
  | 'short_combo_window'
  | 'no_powerups';

interface ChallengeDefinition {
  id: string;              // stable (hash of inputs) OR random UUID
  name: string;
  tier: ChallengeTier;
  mode: ChallengeMode;
  seed: string;            // deterministic run seed
  modifiers: ChallengeModifier[];
  createdAt: number;
  createdBy?: string;      // anonymousId or Beam address when available
  version: number;         // for forward compat
}

interface ChallengeScore {
  challengeId: string;
  playerId: string;        // anonymousId or Beam address
  score: number;
  result: 'victory' | 'defeat';
  createdAt: number;
  meta?: {
    tier: ChallengeTier;
    mode: ChallengeMode;
  };
}
```

### Storage approach (MVP)
- `AsyncStorage` keys:
  - `glucoseWars.challenge.myChallenges` (ChallengeDefinition[])
  - `glucoseWars.challenge.scores.{challengeId}` (ChallengeScore[] top N)

Leaderboard MVP can be “local device only” for now; for real virality you eventually need shared/global scores:
- Beam Player API stats keyed by `challenge_id` (recommended) OR a tiny serverless endpoint.

---

## 5) Determinism (how to make runs comparable)
To make leaderboards meaningful:
- All randomness must derive from `seed`
- Ensure spawn order, plot twists, and contextual modifiers are seeded when in challenge mode

Practical approach:
- Add `challengeSeed?: string` and `challengeModifiers?: ChallengeModifier[]` into `useBattleGame` config.
- When present, initialize `SeededRandom(seed)` and use it for:
  - food selection
  - spawn x positions
  - plot twist selection (challenge mode should not be “VRF fairness” unless you also persist proofs)

---

## 6) Routing + URL schema (shareability)
### Canonical share URL
`/challenge/play?tier=...&mode=...&seed=...&mods=comma,separated&name=optional`

Rules:
- Params must be order-insensitive (sort modifiers in serialization).
- Keep it short; avoid JSON in query string for share friendliness.

Optional:
- `ref=` for attribution (creator id)

---

## 7) Analytics events (PostHog)
Minimum event set:
- `challenge_hub_viewed`
- `challenge_create_opened`
- `challenge_created` (tier, mode, modifiers_count, modifiers, seeded_type=random|custom)
- `challenge_share_clicked` (surface=create|results, medium=copy|native_share)
- `challenge_play_opened` (source=link|hub|results, tier, mode, modifiers_count)
- `challenge_started` (challenge_id, tier, mode)
- `challenge_completed` (challenge_id, score, result)
- `challenge_leaderboard_viewed` (challenge_id)
- `challenge_remix_clicked` (challenge_id)

Attribution:
- Include `ref` / `creator_id` if present.

---

## 8) UX principles (to keep it intuitive)
1) **No walls before fun**: challenge link should jump into play with one lightweight rules overlay.
2) **Explain why modifiers matter**: each modifier needs a 1-line “feel” description (“Faster spawns = more pressure”).
3) **Always produce a share artifact**: after a run, share UI is first-class (not hidden).

---

## 9) Phased rollout
### MVP (1–2 weeks)
- Challenge hub + create + play (seed + modifiers) + results with “share link”
- Deterministic runs using seed
- Local-only leaderboard (device) OR no leaderboard (still supports sharing)

### V0.5 (2–3 weeks)
- Global leaderboard via Beam Player stats keyed by `challenge_id`
- Result card export (image)
- Remix flow

### V1 (4–8 weeks)
- “UGC‑lite editor” expansion:
  - custom food pool presets (deck)
  - plot twist set selection
  - “rule packs” that are combinable
- Creator profiles (Beam identity)
- Featured challenges curated from “most played / most shared”

---

## 10) Acceptance criteria (MVP)
1) Any user can create a challenge and copy a link.
2) A fresh user opening the link can start playing within ~5–10 seconds on web.
3) Two users opening the same link get the same run behavior (seeded determinism).
4) On completion, the user sees a share CTA and can share the same challenge link.
5) Core analytics events appear in PostHog for the challenge flow.

