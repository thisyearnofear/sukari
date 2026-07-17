# GlucoseWars Roadmap: User-Centric Personalization

## ✅ What We've Built

Core game engine complete: tiered progression (3 tiers × 30/60/90s), classic/life game modes, swipe/tap controls, combo system, player progression tracking, onboarding flows, health profile system, results screens with honest messaging.

**Phase 1 Progress (COMPLETE):**
- ✅ User Mode Selection - Modal selector with Personal/Caregiver/Curious modes
- ✅ Personalized Onboarding - Mode-specific intro steps with consistent design  
- ✅ Results Messaging - Tier-specific hero text on victory screens
- ✅ In-Game Reflections - Mode-aware insights with science facts during gameplay

---

## 🚀 Phase 1: User-Centric Personalization (COMPLETED)

**Why:** Current game assumes all players manage their own glucose. Reality: many users are caregivers, family members, or learning for general education.

### Key Achievements

**User Mode Selection:** Modal with three persistent options (👤 Personal, 👨‍👩‍👧 Caregiver, 📚 Curious) stored in player progress.

**Personalized Onboarding:** Mode-specific intro steps with dynamic titles, narrative text, and consistent design patterns.

**Mode-Specific Results:** Personalized messaging per user type with tier-specific narratives and hero text.

**In-Game Reflections:** Science facts woven into gameplay with probabilistic display (50% for consume/reject, 20% for optimal).

**Mode-Specific Plot Twists:** Filtered scenario selection by user mode providing contextually relevant challenges.

### Implementation Highlights
- Type-safe user mode configuration with centralized constants
- Enhanced onboarding flow maintaining existing animations
- Mode-filtered reflection system with science education
- Purple-themed plot twist announcements with educational content

---

## 🔮 Phase 3: Beam SDK & Persistent Economy (COMPLETE)

### Level 1: Frictionless Onboarding ✅
- Integrated `@onbeam/sdk` for Social Login (Google, Apple, Discord)
- Implemented `BeamProvider` and `BeamContext` for SDK lifecycle management
- Connected `usePlayerProgress` to sync Kingdom Renown and Tier progress with Beam accounts
- Integrated background reporting of Battle results to Beam Player API

### Level 2: Persistent Assets & Treasury ✅
- **Royal Treasury**: Secure on-chain "Deeds of Valor" (Achievements) via the Beam network.
- **Kingdom Renown Tracking**: XP-based progression synced with on-chain identity.
- **Global Proclamations**: Real-time leaderboard notifications in the Alchemist's Lab.

### Level 3: Education via Immersion ✅
- **Kingdom Lore & Secrets**: Replaced dry medical facts with immersive "Secrets of the Realm"
- **Grand Library**: Implemented a central discovery hub for educational "Kingdom Secrets"
- **Natural Discovery Triggers**: Integrated lore unlocking into the core game loop (streaks/actions)
- **Thematic Refinement**: Renamed all core metrics to fun-first primitives (Vigor, Purity, Vitality, Harmony)
- **Ancient Scrolls**: Added high-quality clinical context for adults within the Library UI

**Beam Integration Approach:**
```typescript
// Example: Syncing progress to Beam Player Account
const syncToBeam = async (renown: number, maxTier: string) => {
  if (!beam.account) return;
  await beam.client.players.updateStats({
    kingdom_renown: renown,
    max_tier: maxTier,
    last_played: new Date().toISOString()
  });
};
```

---

## 📅 Timeline

| Week | Deliverable | Status |
|------|-------------|--------|
| 1-2 | User mode selection modal + state | ✅ Complete |
| 2-3 | Personalized onboarding flows | ✅ Complete |
| 3-4 | Results & messaging customization | ✅ Complete |
| 4-5 | In-game reflection points | ✅ Complete |
| 5-6 | Mode-specific plot twists | ✅ Complete |
| 7-8 | **Beam SDK Integration (Phase 1)** | ✅ Complete |
| 9+ | **Asset Marketplace (Phase 2)** | ⏳ Upcoming |

---

## 🎯 Success Metrics

- **Adoption:** 90%+ select a mode (not skipping)
- **Caregiver split:** Track how many users choose caregiver mode
- **Engagement:** Time spent reading results (engagement indicator)
- **Sharing:** Caregiver users share insights with loved one more
- **Completion:** 95%+ complete tier2 in their chosen mode

---

## 🔮 Phase 2A: Privacy Foundation (IN PROGRESS)

### Level 1: Basic Privacy ✅ COMPLETE
- Privacy settings interface with mode and visibility controls
- Privacy toggle integrated into main menu
- Granular privacy controls for different data types
- UI privacy indicators (🔒/🌍 badges)
- Simulated encryption service ready for real zkEVM integration

### Level 2: Selective Disclosure 🔄 IN PROGRESS
- Healthcare provider address management
- Access revocation system
- Privacy dashboard overview

**Technical Approach:**
```typescript
interface PrivacySettings {
  mode: 'standard' | 'private';
  encryptHealthData: boolean;
  glucoseLevels: Visibility;
  insulinDoses: Visibility;
  achievements: Visibility;
  gameStats: Visibility;
  healthProfile: Visibility;
}
```

---

## 🎲 VRF Fairness System (IN PROGRESS)

### Level 1: Provably Fair Plot Twists ✅ IMPLEMENTED
- VRF service hook with mock integration ready for Scroll
- VRF-enhanced plot twist selection with verifiable randomness
- Fairness badge system with visual indicators
- Verifiable random value generation
- Proof verification UI components

### Level 2: Comprehensive Fairness 🔄 IN PROGRESS
- Full game event verification
- Fairness dashboard with integrity metrics
- Challenge/verification mechanics
- Leaderboard integrity checks

**VRF Integration:**
```typescript
async function generateFairPlotTwist(): PlotTwist {
  const vrfRequest = await scroll.requestVRF({
    seed: `plot_twist_${gameId}_${timestamp}`,
    callback: handleVRFFulfillment
  });

  const { randomValue, proof } = await vrfRequest.result;
  const twistIndex = randomValue % plotTwists.length;
  const twist = plotTwists[twistIndex];

  return {
    ...twist,
    fairnessProof: proof,
    isVerifiable: true
  };
}
```

---

## 🔄 Integration Strategy

### Core Principles
- **Progressive Complexity:** Introduce features gradually
- **Optional Depth:** Advanced features for power users only
- **Visual Feedback:** Make abstract concepts tangible
- **Gameplay First:** Never sacrifice fun for features

### Tier-Based Rollout
- **Tier 1 (Current):** Basic gameplay + simple privacy toggle + fairness badges
- **Tier 2 (Next):** Health management + granular privacy + VRF plot twists + fairness verification
- **Tier 3 (Advanced):** Mastery + healthcare provider sharing + full game verification + multiplayer fairness

---

## 📅 Implementation Timeline

**Phase 2A: Privacy Foundation (4 weeks)**
- Week 1-2: Basic zkEVM encryption + privacy toggle
- Week 3-4: Selective disclosure + healthcare sharing

**Phase 2B: Fairness Integration (4 weeks)**
- Week 5-6: VRF plot twists + fairness badges
- Week 7-8: Full verification + fairness dashboard

**Phase 2C: Polish & Testing (2 weeks)**
- Week 9-10: Integration testing + UX refinement

**Total: 10 weeks to production-ready**

---

## 📊 Complexity vs. Value Analysis

| Feature | Complexity | User Value | Dev Time | Priority |
|---------|------------|------------|----------|----------|
| Privacy Toggle | Low | Medium | 1-2w | ✅ High |

---

## 🧩 UGC‑Lite (Seeded Challenges) — Proposal

To drive engagement + virality on web before a full marketplace/editor, implement **UGC‑lite challenges**:
Create challenge → share link → friend plays instantly → leaderboard → remix.

Spec: `docs/UGC_LITE_SPEC.md`
| VRF Plot Twists | Low | High | 1-2w | ✅ High |
| Selective Disclosure | Medium | High | 3-4w | ✅ High |
| Fairness Dashboard | Medium | Medium | 3-4w | Medium |
| Healthcare Sharing | Medium | High | 2-3w | High |
| Full Verification | High | Medium | 4-6w | Low |

---

## 🎯 Success Metrics

**Privacy Features**
- Adoption Rate: 60%+ of players enable privacy features
- Healthcare Sharing: 15%+ connect with providers
- Data Control: 80%+ understand their privacy settings

**Fairness Features**
- Verification Rate: 40%+ verify plot twist fairness
- Integrity Score: 90%+ average game integrity rating
- Retention Impact: 20%+ increase in Tier 3 completion

---

## 🔮 Phase 2: Educational Simulation (CURRENT FOCUS)

### Slow Mo Mode - Educational Glucose Management

**Strategic Shift:** Based on user feedback and engagement data, we're prioritizing **educational value** over complex blockchain features. The new **Slow Mo Mode** provides a deliberate, reflective gameplay experience that teaches real-world glucose management.

### Key Components

#### 1. Morning Planning Phase ✅
- **Meal prediction interface** - Plan breakfast, lunch, dinner
- **Glucose impact simulation** - Visual prediction of blood sugar effects
- **Educational insights** - Explanations of food combinations
- **No time pressure** - Thoughtful decision making

#### 2. Simulation Engine (IN PROGRESS)
- **Physiology-based modeling** - Realistic glucose response curves
- **Interactive adjustments** - "What if I add exercise?" scenarios
- **Time-lapse visualization** - Watch glucose changes over simulated day
- **Educational explanations** - Why each spike/drop occurs

#### 3. Evening Reflection Phase (PLANNED)
- **Reality input** - Swipe what you actually ate
- **Prediction vs reality comparison** - Side-by-side analysis
- **Pattern recognition** - Personalized insights over time
- **Educational takeaways** - Actionable improvements

### Implementation Timeline

| Week | Focus Area | Status |
|------|------------|--------|
| 1-2 | Morning planning UI/UX | ✅ Complete |
| 3-3 | Role badge system (optional onchain) | ✅ Complete |
| 3-4 | Core simulation engine | 🔄 In Progress |
| 5-6 | Evening reflection system | ⏳ Planned |
| 7-8 | User testing & refinement | ⏳ Planned |
| 9-10 | zkEVM privacy enhancements | 🎯 Future |

### Why This Approach

✅ **Gameplay First** - Core mechanics work without blockchain complexity
✅ **Educational Value** - Teaches real-world glucose management skills
✅ **User-Centric** - Addresses actual player needs and feedback
✅ **Sepolia-Friendly** - Test and iterate without mainnet pressure
✅ **zkEVM Ready** - Architecture designed for future privacy enhancements

## 🔮 Phase 3: Privacy & Verification (FUTURE)

**After validating educational value, enhance with zkEVM where it adds real benefit:**

- **Private meal planning** - Encrypt choices, reveal only impacts
- **Verifiable simulations** - Prove accuracy without revealing algorithms
- **Pattern recognition** - Private trend analysis over time
- **Trustless learning** - Verify educational content validity

**Only if user testing shows demand and value.**

---

## 🏆 Why This Works

✅ **Honest:** No false features, builds on existing game
✅ **Fun:** Same mechanics, deeper meaning = re-engagement
✅ **Modular:** Clean code, no bloat
✅ **Inclusive:** Serves actual user base
✅ **Scalable:** Foundation for future modes

---

## 🎯 Next Steps

**Immediate (Week 1-2)**
- ✅ Research: Scroll zkEVM/VRF documentation
- ✅ Design: Privacy toggle UI/UX
- ✅ Prototype: Basic zkEVM encryption
- ✅ Test: VRF plot twist integration

**Short-term (Week 3-6)**
- ✅ Implement: Privacy toggle + basic encryption
- ✅ Develop: VRF plot twists + fairness badges
- ✅ Test: End-to-end privacy/fairness flows
- ✅ Refine: UX based on user testing

**Long-term (Week 7-10)**
- ✅ Enhance: Selective disclosure controls
- ✅ Expand: Full event verification system
- ✅ Integrate: Healthcare provider sharing
- ✅ Launch: Privacy & fairness features

---

## 🏆 Updated Conclusion

**Strategic Refocus:** Based on user feedback and engagement patterns, we're prioritizing **educational gameplay** over complex blockchain features. The new **Slow Mo Mode** provides immediate educational value while maintaining the foundation for future zkEVM enhancements.

### Current Strategy: Education First

1. **Build Slow Mo Mode** - Deliberate, educational glucose simulation
2. **Validate with Users** - Test on Sepolia, gather feedback
3. **Enhance with zkEVM** - Only where it adds proven value
4. **Iterate Based on Data** - Let user engagement guide evolution

### Future Strategy: Privacy When Valuable

**zkEVM integration will follow when:**
- ✅ Users show engagement with educational features
- ✅ Privacy needs become apparent through usage
- ✅ Verification provides clear user benefit
- ✅ Performance impact is justified by value

**Key Benefits of This Approach:**
- ✅ **User-Centric:** Focus on what players actually want
- ✅ **Practical:** Solve real problems, not technical novelty
- ✅ **Iterative:** Build, measure, learn, improve
- ✅ **Future-Ready:** Architecture supports zkEVM when needed
- ✅ **Utility:** Meaningful use of blockchain
- ✅ **Growth:** New features attract power users

**Risk Mitigation:**
- Start with simple implementations
- Thorough testing at each phase
- User education on new concepts
- Maintain core gameplay experience

This roadmap positions GlucoseWars as a leader in privacy-preserving health gamification while maintaining its core mission: making glucose management engaging and accessible to everyone.
