# GlucoseWars Development Guide

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on device/emulator
# iOS: Press 'i' in terminal
# Android: Press 'a' in terminal
```

## 📁 Project Structure

```
📁 glucosewars/
├── app/
│   └── index.tsx                 # Main app entry (navigation orchestration)
├── components/
│   ├── game/                     # Game-specific components
│   │   ├── MainMenu.tsx          # Uses: COLORS, animation builders, ProgressIndicator
│   │   ├── BattleScreen.tsx      # Uses: COLORS, animation builders
│   │   ├── BattleHUD.tsx         # Uses: COLORS, useAccessibility
│   │   ├── FoodCard.tsx          # Uses: useAccessibility (screen reader labels)
│   │   ├── ResultsScroll.tsx     # Uses: COLORS, useAccessibility
│   │   ├── Onboarding.tsx        # Uses: metaphor bridge step + animations
│   │   └── ProgressIndicator.tsx # Tier progression visualization
│   ├── WebOnlyConnectButton.tsx  # Cross-platform (consolidated)
│   └── WebProviders.tsx          # Cross-platform (consolidated)
├── constants/
│   ├── designSystem.ts           # 🎨 Colors, typography, spacing, animations, shadows, z-indexes
│   ├── navigation.ts             # 🧭 Screen definitions, transitions, validation
│   ├── gameTiers.ts              # Game tier configurations
│   ├── gameConfig.ts             # Game mechanics & rules
│   ├── userModes.ts              # User mode configurations
│   └── [other configs]
├── hooks/
│   ├── useAccessibility.ts       # ♿ Screen reader labels, a11y configs
│   ├── usePlayerProgress.ts      # Progression tracking & persistence
│   ├── useBattleGame.ts          # Game state & mechanics
│   └── [other hooks]
├── utils/
│   ├── animations.ts             # ⚡ Reusable animation builders (12+)
│   └── [other utilities]
├── types/
│   ├── game.ts                   # Game state types
│   └── health.ts                 # Health profile types
└── docs/                         # Documentation
```

### Key Architectural Systems

**Design System** (`constants/designSystem.ts`)
- Centralized colors (glucose zones, UI, accessibility)
- Typography presets (TITLE_LARGE, BODY_LARGE, BUTTON, etc.)
- Spacing grid (4px base unit)
- Animation durations and easing
- Shadow/elevation levels
- Z-index layering rules

**Navigation State Machine** (`constants/navigation.ts`)
- Screen type definitions
- Valid transition rules
- Screen metadata
- Breadcrumb generation
- Progress indicators

**Animation Builders** (`utils/animations.ts`)
- Reusable animation utilities (pulse, fade, scale, glow, burst, float, wobble)
- Particle trajectory calculations
- Screen transition builders
- Consistent timing using design system

**Accessibility** (`hooks/useAccessibility.ts`)
- Semantic labels for screen readers
- Pre-built accessibility configs for components
- Button, meter, and results labels
- WCAG AA compliance foundation
```

## 🛠️ Using the Design System

### Importing Design Tokens

**Colors:**
```typescript
import { COLORS } from '@/constants/designSystem';

// Stability zones (glucose levels)
const balancedColor = COLORS.ZONES.balanced;      // Green
const warningColor = COLORS.ZONES.warningHigh;    // Amber
const criticalColor = COLORS.ZONES.criticalHigh;  // Red

// UI elements
const bgColor = COLORS.BG_DARK;
const textColor = COLORS.TEXT_PRIMARY;
```

**Typography:**
```typescript
import { TYPOGRAPHY } from '@/constants/designSystem';

// Use presets for consistency
<Text style={TYPOGRAPHY.PRESETS.TITLE_LARGE}>Large Title</Text>
<Text style={TYPOGRAPHY.PRESETS.BUTTON}>Button Text</Text>

// Manual control
<Text style={{ 
  fontSize: TYPOGRAPHY.SIZE.LG,
  fontWeight: TYPOGRAPHY.WEIGHT.BOLD 
}}>
  Custom
</Text>
```

**Animations:**
```typescript
import { ANIMATIONS } from '@/constants/designSystem';
import { createPulseAnimation, createFadeInAnimation } from '@/utils/animations';

const pulseAnim = useRef(new Animated.Value(1)).current;

// Use builders for consistency
createPulseAnimation(pulseAnim, {
  duration: ANIMATIONS.DURATION.SLOWER,
  minScale: 1,
  maxScale: 1.05,
}).start();
```

**Accessibility:**
```typescript
import { useAccessibility } from '@/hooks/useAccessibility';

const { getFoodCardLabel, getButtonLabel } = useAccessibility();

<TouchableOpacity
  accessible={true}
  accessibilityLabel={getFoodCardLabel('Broccoli', 'ally', 'up')}
  accessibilityRole="button"
  accessibilityHint={getAccessibilityHint('swipe')}
>
```

### Core Principles When Developing

1. **Always use COLORS tokens** - Never hardcode `#hex` values
2. **Use TYPOGRAPHY presets** - For consistency across app
3. **Use animation builders** - Instead of inline Animated code
4. **Add accessibility labels** - All interactive elements must be screen-reader accessible
5. **Validate navigation** - Use `isValidTransition()` to prevent bad states

## 🛠️ Development Workflow

### 1. Pick a Tier to Work On
```typescript
// Tier configurations in constants/gameTiers.ts
const tierConfig = GAME_TIERS['tier1']; // or 'tier2', 'tier3'
```

### 2. Test in Isolation
```bash
# Test specific tier
npx expo start --tier=tier1
```

### 3. Verify Progression
```typescript
// Check tier unlocking
unlockNextTier('tier1'); // Should unlock tier2
```

### 4. Submit Changes
```bash
# Run linting
npm run lint

# TypeScript check
npx tsc --noEmit

# Commit with message
git commit -m "Enhance tier2 onboarding"
```

## 🎮 Tier Development

### Tier 1: Tutorial
**Focus:** Controls mastery
**Duration:** 30 seconds
**Features:** Swipe mechanics, scoring

```typescript
// Tier 1 config
{
  duration: 30,
  showGlucose: false,
  swipeDirections: ['up', 'down'],
  winCondition: 'points >= 100'
}
```

### Tier 2: Challenge 1
**Focus:** Health basics
**Duration:** 60 seconds
**Features:** Glucose management, metrics

```typescript
// Tier 2 config
{
  duration: 60,
  showGlucose: true,
  swipeDirections: ['up', 'down', 'left', 'right'],
  healthProfile: 'auto_newly_aware'
}
```

### Tier 3: Challenge 2
**Focus:** Advanced gameplay
**Duration:** 90 seconds
**Features:** Insulin, plot twists, full metrics

```typescript
// Tier 3 config
{
  duration: 90,
  showGlucose: true,
  enablePlotTwists: true,
  insulinRequired: true
}
```

## 🔧 Common Tasks

### Add New Tier
```typescript
// 1. Add to constants/gameTiers.ts
GAME_TIERS['tier4'] = {
  duration: 120,
  // ... config
};

// 2. Update progression logic
function unlockNextTier(currentTier: GameTier) {
  const tiers: GameTier[] = ['tier1', 'tier2', 'tier3', 'tier4'];
  // ... unlock logic
}

// 3. Add onboarding steps
<OnboardingForTier tier="tier4" />
```

### Modify Tier Behavior
```typescript
// Update tier config
GAME_TIERS['tier2'].duration = 75; // Change from 60 to 75 seconds
GAME_TIERS['tier2'].foodSpawnRate = 1100; // Adjust difficulty
```

### Add New Feature
```typescript
// 1. Add to tier config
GAME_TIERS['tier3'].enableNewFeature = true;

// 2. Update BattleScreen
<BattleScreen 
  tierConfig={tierConfig}
  enableNewFeature={tierConfig.enableNewFeature}
/>

// 3. Implement feature
if (enableNewFeature) {
  // Feature implementation
}
```

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
npm test

# Run specific test
npm test -- --testNamePattern="Tier1"
```

### Integration Tests
```typescript
// Test tier progression
test('Tier 1 completion unlocks Tier 2', () => {
  const { unlockNextTier } = usePlayerProgress();
  unlockNextTier('tier1');
  expect(progress.maxTierUnlocked).toBe('tier2');
});
```

### E2E Tests
```typescript
// Test full player journey
test('New player completes all tiers', async () => {
  // Simulate tier 1 completion
  await completeTier('tier1');
  
  // Should auto-advance to tier 2
  expect(currentTier()).toBe('tier2');
  
  // Complete tier 2
  await completeTier('tier2');
  
  // Should show tier 3 options
  expect(availableTiers()).toContain('tier3');
});
```

## 📊 Debugging

### Common Issues

**Issue:** Tier not unlocking
```bash
# Check progression hook
console.log(usePlayerProgress().progress);

# Verify win condition
console.log(tierConfig.winCondition);
```

**Issue:** UI not updating
```bash
# Check tier config
console.log(GAME_TIERS[currentTier]);

# Verify component props
console.log(BattleScreen.props.tierConfig);
```

**Issue:** Health data missing
```bash
# Check health profile
console.log(useHealthProfile().healthProfile);

# Verify tier requires health
console.log(tierConfig.healthProfile);
```

## 🛡️ Best Practices

### 1. Config-Driven Development
```typescript
// ✅ Do: Use tier config
if (tierConfig.showGlucose) { /* ... */ }

// ❌ Don't: Hardcode tier logic
if (currentTier === 'tier2') { /* ... */ }
```

### 2. Progressive Enhancement
```typescript
// ✅ Do: Check feature availability
if (tierConfig.enableFeature) { /* ... */ }

// ❌ Don't: Assume features exist
// Always implement feature
```

### 3. Type Safety
```typescript
// ✅ Do: Use TypeScript types
type GameTier = 'tier1' | 'tier2' | 'tier3';

// ❌ Don't: Use strings without types
// type GameTier = string;
```

### 4. Performance
```typescript
// ✅ Do: Load only what's needed
if (tierConfig.showGlucose) {
  loadHealthSystem();
}

// ❌ Don't: Load everything upfront
// loadAllSystems();
```

### 5. Testing
```typescript
// ✅ Do: Test tier isolation
test('Tier 1 in isolation', () => { /* ... */ });

// ❌ Don't: Test multiple tiers together
// test('All tiers together', () => { /* ... */ });
```

## 📈 Performance Optimization

### Load Time
```typescript
// Lazy load tier assets
const TierAssets = {
  tier1: () => import('./assets/tier1'),
  tier2: () => import('./assets/tier2'),
  tier3: () => import('./assets/tier3')
};

// Load only current tier
TierAssets[currentTier]().then(assets => {
  // Use assets
});
```

### Memory Usage
```typescript
// Clean up between tiers
useEffect(() => {
  return () => {
    // Unload tier assets
    unloadTierAssets(currentTier);
  };
}, [currentTier]);
```

### Render Performance
```typescript
// Memoize tier components
const TierComponent = React.memo(({ tier }) => {
  // Render tier-specific UI
});
```

## 🎯 Contribution Guidelines

### 1. Review Architecture
```bash
# Read architecture docs
cat docs/ARCHITECTURE.md
```

### 2. Follow Principles
- Enhancement first
- Aggressive consolidation
- Prevent bloat
- Keep it DRY

### 3. Test Thoroughly
```bash
# Run tests
npm test

# Test specific tier
npm test -- tier1
```

### 4. Document Changes
```markdown
# Update relevant docs
- ARCHITECTURE.md (if structural changes)
- DEVELOPMENT.md (if workflow changes)
- ROADMAP.md (if new features)
```

### 5. Submit PR
```bash
# Commit with clear message
git commit -m "Add tier4 advanced features"

# Push to branch
git push origin feature/tier4

# Create PR with:
# - Clear description
# - Screenshots if UI changes
# - Testing instructions
```

## 🏆 Development Checklist

### New Feature
- [ ] Add to tier config
- [ ] Implement feature logic
- [ ] Update UI components
- [ ] Add tests
- [ ] Document in README

### Bug Fix
- [ ] Identify root cause
- [ ] Implement fix
- [ ] Add regression test
- [ ] Verify in all tiers
- [ ] Update changelog

### Tier Enhancement
- [ ] Update tier config
- [ ] Modify onboarding
- [ ] Adjust gameplay
- [ ] Update results
- [ ] Test progression

## 📚 Resources

### Documentation
```
📄 ARCHITECTURE.md - Core principles and design
📄 ROADMAP.md - Current status and future plans
📄 DEVELOPMENT.md - Development guidelines (this file)
📄 HACKATHON.md - Submission details
```

### External Links
```
🔗 Expo Documentation - https://docs.expo.dev
🔗 Scroll Documentation - https://scroll.io
🔗 TypeScript Handbook - https://www.typescriptlang.org/docs
```

### Community
```
💬 Discord - For real-time help
🐙 GitHub - For issues and contributions
📝 Docs - For comprehensive guides
```

## 🏅 Conclusion

**Development Philosophy:**
1. Keep it simple
2. Test thoroughly
3. Document clearly
4. Follow principles
5. Have fun!

**Result:** Clean, maintainable code that makes health education accessible and engaging.