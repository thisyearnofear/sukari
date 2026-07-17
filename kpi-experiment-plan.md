# GlucoseWars (Web) — KPI & Experiment Plan (Prototype)
Date: 2026-04-17

This plan is tailored to the current codebase (Expo Router web build) with:
- Tiered progression (Tier 1→2→3), onboarding + results loop
- Daily quests + Kingdom Renown (XP)
- Grand Library / lore unlocking
- Social actions (share) inside gameplay
- Beam social login + achievement minting (onchain “Deeds of Valor”)
- Optional Web3 wallet connect

---

## 1) Product thesis → what we measure
### Primary player promise (what you’re actually selling)
“Fast, satisfying ‘Fruit Ninja’ combat that *rewards correct decisions* and makes complex health concepts feel learnable.”

### North-star metric (NSM)
**Weekly Adherent Patients (WAP)**  
Count of unique users who, within a week:
1) complete ≥1 **programme mission** (real-world action marked done) **and**
2) complete ≥1 practice session (battle or Slow Mo).

Legacy companion metric (education funnel):
**Weekly Engaged Learners (WEL)** — battle + learning signal (lore / library / time-in-balanced).

Why WAP: commercial + clinical buyers care about programme adherence between visits, not score chasing.

### Supporting “pillar” metrics
**Activation**
- **TTFG (Time To First Game)**: p50 / p90 time from first app open → battle_start
- **First-session completion rate**: battle_end / battle_start (Tier 1)
- **Mode selection rate**: user_mode_selected / first_open

**Engagement / retention**
- D1 / D7 retention (web cohorts)
- Battles per active day; sessions per week
- Tier progression: % reaching Tier 2 / Tier 3; win-rate by tier
- “Healthy mastery” signals:
  - time_in_balanced ratio
  - correct_swipe_rate
  - quest completion rate

**Programme adherence + distribution (Adherence OS)**
- Mission completion rate (D1 / D7)
- Transfer rate: mission_transfer_shown / battle_end
- Caregiver invite sent / accepted (`caregiver_invite_shared` / `caregiver_invite_opened`)
- Weekly digest created / opened (`weekly_digest_created` / `weekly_digest_opened`)
- Coach fallback rate: coach_mission_fallback / (remote + fallback)

**Social + identity (secondary)**
- Share rate: share_action / battle_end
- Beam login adoption (optional persistence only)
- Challenge programme plays (Protein Vanguard / Ban the Potion)

### Guardrails
- Crash-free sessions / error rate
- Performance: FPS drops (if you can measure), long task timings on web
- Negative UX: rage-clicks on key CTAs, abandonment at modals
- Privacy: confirm no sensitive health data is logged when privacyMode=private

---

## 2) Funnel map (what to instrument)
Current main journey in code:
`welcome/index → user mode selector (MainMenu) → onboarding → battle → results → (play again / tier advance) → main menu`

### Funnel KPIs (minimum viable)
1. **Landing → Mode Selected**
2. **Mode Selected → Onboarding Complete**
3. **Onboarding Complete → Battle Start**
4. **Battle Start → Battle End**
5. **Results View → Play Again**
6. **Tier 1 complete → Tier 2 start**

Optional but important:
- Beam login adoption (when prompted)
- Treasury open + mint attempt + mint success
- Library open + lore unlock

---

## 3) Event taxonomy (recommended)
### Conventions
- `snake_case` event names
- Always include: `user_id` (anonymous), `session_id`, `platform=web`, `app_version`, `build`, `timestamp`
- Include `privacy_mode` and redact/avoid health details when private

### Core events (prioritized)
**Acquisition / app**
- `app_open`
- `screen_view` (screen name, route group)

**Onboarding / activation**
- `user_mode_selector_shown`
- `user_mode_selected` (mode)
- `onboarding_started` (tier, control_mode)
- `onboarding_completed` (tier, control_mode)
- `onboarding_skipped` (tier, control_mode)

**Gameplay**
- `battle_started` (tier, game_mode, control_mode, user_mode)
- `battle_paused` / `battle_resumed`
- `powerup_used` (type=exercise|rations)
- `swipe_action` (action=save|reject|share, faction, is_contextually_good)
  - Sampling note: on web, consider sampling this event or aggregating per session.
- `battle_ended`
  - Props: `result`, `score`, `duration_s`, `correct_swipes`, `incorrect_swipes`,
    `time_in_balanced`, `time_in_warning`, `time_in_critical`, `combo_max`,
    `plot_twists_triggered`, `quests_progressed_count`

**Results / progression**
- `results_viewed` (tier, result)
- `play_again_clicked` (tier)
- `main_menu_clicked` (from=results|battle|etc.)
- `tier_advance_modal_shown` (from_tier, to_tier)
- `tier_advance_accepted` / `tier_advance_declined`

**Learning / meta**
- `daily_quest_completed` (quest_type, reward)
- `library_opened` / `library_closed`
- `lore_unlocked` (lore_id, trigger_source)

**Identity / onchain**
- `beam_login_clicked` / `beam_login_success` / `beam_login_error`
- `treasury_opened`
- `mint_clicked` (achievement_id)
- `mint_success` (achievement_id, tx_hash?) / `mint_error`
- `wallet_connect_clicked` / `wallet_connected` / `wallet_connect_error`

---

## 4) Dashboarding (what to build first)
### Day 1 dashboards
1) **Activation**: TTFG distribution + first-session completion + onboarding skip rate  
2) **Core loop**: battle_started → battle_ended → results_viewed → play_again  
3) **Progression**: tier reach + tier win rates  

### Week 1 dashboards
4) **Retention**: D1/D7 by cohort (with segmentation: user mode, control mode)  
5) **Learning impact**: WEL + lore unlock frequency + library open rate  
6) **Identity adoption**: Beam login + mint conversion (per tier)  

---

## 5) 2–4 week experiment roadmap (prototype-appropriate)
### Week 1: Fix measurement + biggest drop-offs
**Experiment A — “Instant battle” vs “guided onboarding”**
- Hypothesis: reducing time-to-fun increases first-session completion and D1.
- Variants:
  - Control: existing onboarding flow
  - Variant: “Start battle now” CTA after mode selection; onboarding shown after first battle as “You unlocked training”
- Primary metric: first-session completion, D1 retention
- Guardrails: incorrect swipe rate (don’t harm learning too much)

**Experiment B — Tier advance modal (value prop + default)**
- Hypothesis: better framing increases Tier 2 start.
- Variants:
  - Control: current “Advance to Challenge 1?” modal
  - Variant: show a 3-bullet “what you unlock” + 1-line “why it matters” + default focus on advance CTA
- Primary: tier2_started / tier1_completed

### Week 2: Meta-loop pull (quests + renown)
**Experiment C — Daily quests visibility**
- Hypothesis: surfacing quests on main menu increases repeat sessions.
- Variants:
  - Control: current placement
  - Variant: “Quest progress bar” always visible + “Claim reward” animation on completion
- Primary: battles_per_user_per_week, D7

**Experiment D — Renown reward tuning**
- Hypothesis: stronger early rewards reduce churn.
- Variants:
  - Control: current quest rewards
  - Variant: +50–100% rewards for first 3 days; introduce first milestone earlier
- Primary: WEL, D1/D7

### Week 3: Identity adoption (Beam) without killing fun
**Experiment E — When to ask for Beam login**
- Hypothesis: asking *after a win* yields higher login conversion with less bounce.
- Variants:
  - Ask at main menu (control)
  - Ask at first Tier 1 victory result screen (variant)
- Primary: beam_login_success / first_open
- Guardrails: results abandonment; play_again rate

**Experiment F — Mint moment**
- Hypothesis: “mint eligibility” framed as achievement, not crypto, increases mint attempts.
- Variants:
  - Control: current treasury/mint UI
  - Variant: “Secure Deed” CTA directly on Tier 3 victory, with optional “Later in Treasury”
- Primary: mint_clicked / eligible, mint_success / eligible

### Week 4: Social / UGC seeds (even before full marketplace)
**Experiment G — “Share ally” design**
- Hypothesis: making share feel like “helping the kingdom” increases share rate.
- Variants:
  - Control: current share action
  - Variant: share produces a “Proclamation” card you can copy/download
- Primary: share_action / battle_end
- Guardrails: session duration, battle completion

---

## 6) “Next steps” checklist (implementation)
### Analytics implementation (recommended next)
1) Choose an analytics vendor (PostHog is a great prototype default on web).
2) Create a single `track(event, props)` wrapper:
   - automatically adds common context
   - respects privacy settings (no health props when private)
3) Add the core events listed above to:
   - MainMenu (mode selection, Beam actions, library/treasury)
   - Onboarding route
   - Battle route/hook (battle started/ended; sampled swipe_action)
   - Results route (results_viewed, play_again, tier_advance)
4) Create the 3 Day-1 dashboards.

### Data hygiene (important for Web/health-adjacent)
- Confirm you never log raw glucose values / insulin dosing when privacy mode is private.
- Prefer derived bins (e.g., “zone=balanced/warning/critical”).

---

## 7) Open questions (to lock the plan)
1) What does “UGC” mean in your roadmap: user-created scenarios, user-created decks, or user-created challenges?
2) Who is the primary audience for *web* first: education/curious users, caregivers, or diabetes patients?
3) Are you optimizing first for: retention, Beam adoption, or learning outcomes?

