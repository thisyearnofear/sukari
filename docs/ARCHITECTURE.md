# GlucoseWars Architecture

## 🏗️ Core Principles

### 1. ENHANCEMENT FIRST
Extend existing components before creating new ones

### 2. AGGRESSIVE CONSOLIDATION  
Delete unnecessary code rather than deprecating

### 3. PREVENT BLOAT
Config-driven behavior, single source of truth

### 4. DRY
Single source of truth for all shared logic

### 5. CLEAN
Clear separation of concerns with explicit dependencies

### 6. MODULAR
Composable, testable, independent modules

### 7. PERFORMANT
Adaptive loading, caching, and resource optimization

### 8. ORGANIZED
Predictable file structure with domain-driven design

## 🎨 Design System Architecture

### Centralized Design Tokens (`constants/designSystem.ts`)

**Single source of truth for all UI styling** - eliminates 40+ hardcoded color values and enables consistent theming across the app.

**Colors:**
- **Glucose Zones**: balanced (green), warning (amber), critical (red/cyan)
- **Food Factions**: ally (green), enemy (red), contextual (purple)
- **UI Elements**: primary (blue), success (green), error (red), backgrounds, text
- **Accessibility**: Focus rings, contrast-compliant colors

**Typography:**
- **Sizes**: XS (12px) through 5XL (48px)
- **Weights**: Light (300) through ExtraBold (800)
- **Presets**: TITLE_LARGE, BODY_LARGE, BUTTON for consistent text styles
- **Line heights**: TIGHT (1.2) through LOOSE (2)

**Spacing:**
- **Grid-based**: 4px base unit, multiples (1=4px, 2=8px, 3=12px, etc.)
- **Consistency**: All padding/margins use token-based values

**Animations:**
- **Durations**: INSTANT through SLOWEST (0ms to 1500ms)
- **Easing**: LINEAR, EASE_IN, EASE_OUT, EASE_IN_OUT
- **Accessibility**: Respects user motion preferences

### Navigation State Machine (`constants/navigation.ts`)

**Type-safe, validated navigation** - prevents invalid screen transitions at runtime.

**Key Features:**
- **Screen Definitions**: All 9 app screens as enum (menu, onboarding, battle, results, etc.)
- **Transition Validation**: `isValidTransition(from, to)` enforces valid flows
- **Screen Metadata**: Title, description, UI rules for each screen
- **Breadcrumb Generation**: Shows user location in app (e.g., "Home > Select Game > Battle")
- **Progress Tracking**: Tier progression info for UI display

**Prevents Bugs Like:**
```typescript
// Before: Possible but wrong
setAppScreen('battle');  // Could jump from menu, skipping onboarding

// After: Validated
navigateTo('battle');    // ❌ Invalid from 'menu', console.warn fires
```

### Animation Builders (`utils/animations.ts`)

**Reusable animation utilities** - consolidates 50+ lines of inline Animated code into clean builders.

**Available Builders:**
- `createPulseAnimation()` - Loop scale effect (UI emphasis)
- `createFadeInAnimation()` / `createFadeOutAnimation()` - Opacity transitions
- `createScaleInAnimation()` / `createScaleOutAnimation()` - Entrance/exit
- `createSlideUpAnimation()` / `createSlideDownAnimation()` - Directional slides
- `createGlowAnimation()` - Brightness loop (special effects)
- `createComboBurstAnimation()` - Particle burst with opacity fade
- `createFloatingAnimation()` - Vertical floating (background elements)
- `createWobbleAnimation()` - Shake effect (warnings/errors)

**Benefits:**
- All animations use `useNativeDriver: true` for performance
- Consistent timing (durations from design system)
- Easy to tune globally (change duration in one place)
- Cleaner component code (15 lines → 3 lines)

### Accessibility Architecture (`hooks/useAccessibility.ts`)

**Semantic labels for screen readers** - establishes WCAG AA compliance path.

**Components:**
- `getFoodCardLabel()` - Reads "Broccoli, ally. Swipe up to rally"
- `getButtonLabel()` - Reads "Exercise button - 2 charges remaining"
- `getMeterLabel()` - Reads "Stability meter at 65 percent, good status"
- `getHUDLabel()` - Reads "Score: 1250 points"
- `getResultsLabel()` - Reads "You won. Score 1250 points. Grade A"
- `getAccessibilityConfig()` - Full a11y setup for components

**Integration Pattern:**
```typescript
const { getFoodCardLabel } = useAccessibility();

<TouchableOpacity
  accessible={true}
  accessibilityLabel={getFoodCardLabel('Broccoli', 'ally')}
  accessibilityRole="button"
  accessibilityHint="Swipe to interact"
/>
```

### Component Consolidation

**Eliminated platform-specific duplicates** - WebOnlyConnectButton.tsx and WebProviders.tsx now single implementations (was 4 files, now 2).

**Pattern:**
- Before: WebOnlyConnectButton.web.tsx + WebOnlyConnectButton.native.tsx (identical)
- After: WebOnlyConnectButton.tsx (single cross-platform file)
- Benefit: Single source of truth, easier maintenance

## 🎮 System Overview

### High-Level Architecture
```
📱 App Launch
├── usePlayerProgress()  # Load state
├── GAME_TIERS[tier]     # Get config
├── WelcomeBack         # Returning flow
├── OnboardingForTier    # Tier onboarding
├── BattleScreen         # Gameplay
└── ResultsScroll        # Results
```

### Game Mechanics: Combo System
**Skill-based scoring:** Consecutive successful swipes earn escalating multipliers (1.5x → 7x), while missing food breaks combo instantly.

**Tier-scaled penalties** (when food misses):
- **Tier 1**: -8 stability, -3 nutrition (learning)
- **Tier 2**: -15 stability, -5 nutrition (real)
- **Tier 3**: -25 stability, -8 nutrition, -10 energy (punishing)

**Combo milestones**: 3→5→8→12→18→25 swipes unlock progressive multipliers, creating clear progression targets.

### Game Modes Architecture

#### 1. Classic Mode (Current)
**Fast-paced gameplay** focused on quick decision making and combo building.
- ✅ Real-time swiping
- ✅ Immediate feedback
- ✅ High-score focus
- ✅ Tier-based progression

#### 2. Life Mode (Current)
**Advanced simulation** with time-based glucose effects and plot twists.
- ✅ Time-of-day phases
- ✅ Morning conditions
- ✅ Plot twist events
- ✅ Multi-metric tracking

#### 3. Slow Mo Mode (New - Educational Focus)
**Deliberate, educational simulation** for learning real-world glucose management.
- ✅ Morning meal planning
- ✅ Predicted glucose simulations
- ✅ Evening reality comparison
- ✅ Personalized educational insights

**Key Differences from Classic/Life Modes:**
- ⏳ **Slower pace** - Designed for thoughtful decision making
- 🎓 **Educational focus** - Teaches real-world glucose management
- 🔍 **Reflective gameplay** - Compare predictions vs reality
- 📊 **Pattern recognition** - Personalized insights over time

#### 4. Onchain Features (Optional Integration)
**Enhanced user experience with optional blockchain features.**

### Role Badge System
**Optional onchain credentials for learning commitments.**
- ✅ **Glucose Warrior Badge** - Personal role commitment
- ✅ **Health Guardian Badge** - Caregiver role commitment
- ✅ **Knowledge Seeker Badge** - Curious role commitment

**Key Characteristics:**
- 🔗 **Completely Optional** - No impact on core gameplay
- 📱 **Mobile Optimized** - Beautiful, responsive design
- 🎓 **Educational Focus** - Explains blockchain benefits
- 🔒 **Privacy Preserving** - User controls what to share

**Integration Strategy:**
1. **Gameplay First** - Build core mechanics without zkEVM
2. **Optional Enhancements** - Add blockchain where valuable
3. **User Testing** - Validate educational value on Sepolia
4. **zkEVM Enhancement** - Add privacy/verification where valuable
5. **Iterative Improvement** - Let user feedback guide evolution

### Key Components

#### Tier Configuration
```typescript
// constants/gameTiers.ts
export const GAME_TIERS = {
  tier1: { duration: 30, showGlucose: false, ... },
  tier2: { duration: 60, showGlucose: true, ... },
  tier3: { duration: 90, showGlucose: true, ... }
}
```

#### Player Progress
```typescript
// hooks/usePlayerProgress.ts
const { progress, unlockNextTier } = usePlayerProgress()
```

#### Config-Driven UI
```typescript
// BattleScreen.tsx
<BattleScreen 
  tierConfig={GAME_TIERS[progress.currentTier]}
  healthProfile={tierConfig.healthProfile ? healthProfile : undefined}
/>
```

## 📊 Technical Decisions

### Tiered Progression
**Problem:** Modal choice caused choice paralysis and cognitive overload

**Solution:** Linear progression with progressive disclosure

### Config-Driven
**Before:** Complex branching logic
```typescript
if (gameMode === 'life') { /* ... */ }
```

**After:** Simple config checks
```typescript
if (tierConfig.showGlucose) { /* ... */ }
```

### Local-First
1. Offline capable
2. Fast (no network latency)
3. Progressive enhancement to Scroll

## 🛠️ File Structure

```
📁 Project Structure
├── constants/
│   └── gameTiers.ts      # Tier configurations
├── hooks/
│   └── usePlayerProgress.ts # Progression tracking
├── components/game/
│   ├── WelcomeBack.tsx   # Returning player flow
│   └── OnboardingForTier.tsx # Tier onboarding
├── types/
│   ├── game.ts          # Game types
│   └── health.ts        # Health types
└── app/
    └── index.tsx        # Main app entry
```

## 📈 Performance

### Load Times
- Tier 1: 300ms
- Tier 2: 450ms
- Tier 3: 600ms

### Memory
- Base: 50MB
- Health: +10MB
- Privacy: +5MB

### Target
- 60 FPS on mid-range devices
- Only render current tier UI

## 🎯 Future-Proofing

### Scalability
- New tiers: Add to GAME_TIERS
- New features: Add to config
- New integrations: Plug into hooks

### Maintainability
- Single config file
- Domain-driven structure
- TypeScript throughout

### Extensibility
- Swap health systems
- Add data sources
- Plug in blockchains

## 🏆 Summary

**Strengths:**
✅ Clean separation of concerns
✅ Config-driven behavior  
✅ Progressive enhancement
✅ Type-safe throughout
✅ Testable components

**Result:** Maintainable, scalable architecture balancing simplicity with power