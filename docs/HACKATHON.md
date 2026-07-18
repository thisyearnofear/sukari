# GlucoseWars — Reimagine Health with eMed & OpenAI

## Positioning

**GlucoseWars is an AI adherence engine for continuous metabolic care.**

The game is the engagement mechanism — not the whole product.

> Continuous metabolic care fails between appointments. GlucoseWars gives each patient one personalized action at a time, makes adherence engaging through short rehearsal, learns from the response, and tells the care team when human attention is needed.

**Tagline:** One mission today. Better evidence for tomorrow.

**Not:** Fruit Ninja for diabetes · gamified education · NFT achievements · AI doctor · digital twin.

---

## Progress (hackathon build)

Shipped end-to-end closed loop for judging and investors:

| Area | Status |
|------|--------|
| Pattern → mission card (mission-first, details on demand) | Done |
| Maya 14-day synthetic demo + scene chips (Pattern / Measure / Outreach) | Done |
| Accept / easier / another / not practical → assigns template | Done |
| Mission ribbon in battle (rehearsal tied to real-world ask) | Done |
| Transfer beat (I did it / Later today / invite) + deferred home state | Done |
| Quiet win after real-world completion | Done |
| Clinician exception digest (outreach on/off, safety flags) | Done |
| Meal lab labeled educational simulation | Done |
| Unified “steady the field” register across home / battle / coach | Done |
| Investor leave-behind | [`INVESTOR_ONEPAGER.md`](INVESTOR_ONEPAGER.md) |

**Domain additions:** `domain/patterns`, `domain/demo` (Maya fixture).  
**UI additions:** `components/programme/*` (PatternMissionCard, TransferBeat, MissionRibbon, LoopStrip, RehearsalSummary, QuietWinBeat).

---

## The closed loop

```
CGM / wearables / context
        ↓
AI finds one actionable pattern
        ↓
One daily mission (patient can accept / ease / swap / decline)
        ↓
45-second rehearsal in battle
        ↓
Patient acts at home
        ↓
System observes subsequent response
        ↓
Coach adapts · care team gets exception summary
```

---

## Demo script (≈3 minutes) — Maya

1. **Meet Maya** (20s) — Tap **Judging? Start Maya demo** on home (not Settings).
2. **Pattern detected** (35s) — Scene **1 · Pattern**. Evening excursion; open **Why this?** if asked.
3. **One mission** (30s) — Accept / Easier / Another / Not now.
4. **Rehearse** (40s) — “Rehearse in 45 seconds” → mission ribbon in battle → transfer beat (I did it / Later today).
5. **Time jump** (35s) — Scene **2 · Measure** → associated response language (not “caused”).
6. **Care team** (35s) — Scene **3 · Outreach** then **Care team** → outreach suggested + safety flag.
7. **Commercial close** (20s) — Sell adherence layer to virtual metabolic / GLP-1 programmes. Leave [`INVESTOR_ONEPAGER.md`](INVESTOR_ONEPAGER.md).

Live Dexcom remains available as technical proof; demos must not depend on OAuth succeeding.

---

## What we built for this brief

| Surface | Role |
|--------|------|
| Pattern → mission card | Observational insight + bounded experiment + collaborative controls |
| Maya 14-day synthetic timeline | Deterministic demo with time jump + escalation day |
| Rehearsal battle | Mission ribbon + field stability; transfer to real life |
| Care-team summary | Exception-oriented weekly intelligence (no lore) |
| Coach | Habits only — never dosing (`CLINICAL_SCOPE`) |
| Meal lab | Clearly labeled educational simulation — not a personal forecast |

**Demoted / omit from pitch:** NFTs, VRF, leaderboards, blockchain privacy demos, multiplayer.

---

## Commercial wedge

**Buyer:** Virtual diabetes clinics, GLP-1 / weight-management programmes, employer metabolic programmes, CGM-supported nutrition — potentially eMed.

**Model:** Per-enrolled-member-per-month + optional implementation. Later outcomes upside.

**Beachhead:** Adults with T2D / prediabetes in a CGM-supported metabolic programme.

**Moat (compounding):** Mapping of patient context → micro-intervention → adherence → subsequent response — plus clinical governance and workflow embed. Not the game art. Not “we use GPT.”

---

## Safety

- No insulin or medication dose recommendations  
- No diagnosis  
- Constrained intervention library  
- Patient can reject or modify every mission  
- Escalation language for emergencies  
- Prototype ≠ production HIPAA stack (call that out honestly)

---

## Metrics we instrument toward

North star: **Weekly Adherent Patients (WAP)** — ≥1 real-world mission completed + ≥1 practice session in a week.

Also: mission accept/complete, D7/D30 engagement, digest usefulness, staff minutes per enrolled patient.

Do not claim clinical efficacy before a pilot.

---

## Closing line

Healthcare does not need another dashboard telling patients what happened. It needs a system that helps them do the next right thing — and learns whether it worked.
