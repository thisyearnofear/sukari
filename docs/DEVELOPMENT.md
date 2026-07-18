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

## 🔐 Environment Variables

Create a `.env` file at the project root (copy from `.env.example`):

```bash
cp .env.example .env
```

**Never commit `.env` / `.env.local`.** They are gitignored. Only `.env.example` is tracked.

### Git hooks (secrets + lint)

On `npm install`, Husky installs a `pre-commit` hook that:
1. Runs `scripts/check-secrets.mjs` on staged files
2. Runs `lint-staged` (ESLint `--fix` on staged `*.{ts,tsx,js,jsx}`)

```bash
npm install                 # sets up husky via "prepare"
npm run secrets:check       # scan staged files manually
npm run lint                # full project lint
```

If you already committed secrets historically, rotate those keys — untracking `.env` does not remove them from git history.

### Optional (legacy Scroll / WalletConnect)
Only needed if you exercise native Scroll/VRF wallet paths (`@walletconnect/ethereum-provider`). Not required for the Adherence OS web demo.
- `EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID=...`
- `EXPO_PUBLIC_RPC_URL=...` (defaults to Scroll Sepolia)

### Optional Analytics (PostHog, web-only for now)
This repo includes a lightweight analytics wrapper at `utils/analytics.ts`.

- `EXPO_PUBLIC_POSTHOG_KEY=...` (PostHog project API key)
- `EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com` (optional; defaults to PostHog Cloud)

### Adherence OS worker (coach + digest + leaderboard)
The Cloudflare worker under `server/leaderboard-worker` serves:
- `POST /score` + `GET /leaderboard` (UGC challenges)
- `POST /coach/mission` + `POST /coach/chat` (LLM with rules fallback)
- `POST /digest/weekly` + `GET /digest/:token` (care-team proclamation)

Client env (any one works; resolved by `domain/config/workerUrl.ts`):
- `EXPO_PUBLIC_LEADERBOARD_WORKER_URL=https://glucosewars-leaderboard.<account>.workers.dev`
- or `EXPO_PUBLIC_LEADERBOARD_API_URL=...` (legacy alias)
- `EXPO_PUBLIC_APP_URL=https://your-deployed-web-origin` (caregiver invite links)

Deploy:
```bash
cd server/leaderboard-worker
npm install
npx wrangler login
npx wrangler secret put OPENAI_API_KEY
npx wrangler deploy
```

Live worker: `https://glucosewars-leaderboard.papaandthejimjams.workers.dev`  
Bindings: Durable Object `LEADERBOARD`, KV `DIGEST`.

**LLM chain (coach):**
1. **Runware** `textInference` (primary) — secret `RUNWARE_API_KEY`, model var `RUNWARE_MODEL` (default `deepseek:v4@flash`)
2. **OpenAI** chat completions (fallback) — secret `OPENAI_API_KEY`, model var `OPENAI_MODEL`
3. **Rules** — local programme templates if both providers fail

```bash
cd server/leaderboard-worker
npx wrangler secret put RUNWARE_API_KEY
npx wrangler secret put OPENAI_API_KEY   # optional fallback
npx wrangler deploy
```

Successful LLM responses include `"source":"llm"` and `"provider":"runware"|"openai"`.

Without a worker URL, the app still runs fully offline using local `selectMission` + local digests.

### Netlify web deploy
Config: [`netlify.toml`](../netlify.toml) — uses **npm** + `npx expo export --platform web` → `dist`.

Do **not** commit `pnpm-lock.yaml` (stale pnpm lockfiles make Netlify use frozen pnpm and fail).

Set these in Netlify → Site settings → Environment variables (build-time):
- `EXPO_PUBLIC_APP_URL=https://glucosewars.netlify.app`
- `EXPO_PUBLIC_LEADERBOARD_WORKER_URL=https://glucosewars-leaderboard.papaandthejimjams.workers.dev`
- `EXPO_PUBLIC_LEADERBOARD_API_URL=` (same worker URL)

### Day-1 Adherence loop verification
1. Pick a role → see **Today’s Mission** on Realm Home  
2. **Practice Mission** → results **Transfer** beat → **I Did It**  
3. **Share with caregiver** → open `/invite/support` as Guardian  
4. Settings → **Weekly care-team proclamation** → `/digest/[token]`  
5. (Optional) Alchemist chat with worker URL + OpenAI secret set

### Day-1 Analytics Verification (recommended)
After setting `EXPO_PUBLIC_POSTHOG_KEY`, run the web app and click through:
main menu → onboarding → battle → results.

In PostHog, confirm you see events such as:
- `app_open`
- `screen_view` (main_menu, onboarding, battle, results)
- `onboarding_started` / `onboarding_completed`
- `battle_started` / `battle_ended`
- `results_viewed`
- `beam_login_success` (if you log in)
- `mint_clicked` / `mint_success` (if you mint)

Recommended Day-1 dashboards:
1. **Core Funnel**: `app_open → onboarding_started → battle_started → battle_ended → results_viewed`
2. **Tier Progression**: breakdown `battle_started` and `battle_ended` by `tier`
3. **Identity Adoption**: `beam_login_success` and `mint_success` over time

## 📁 Project Structure

```
📁 glucosewars/
├── app/                            # Expo Router screens only
│   ├── index.tsx                   # Realm Home
│   ├── invite/ support digest/     # Distribution surfaces
│   ├── (game)/ challenge/ slowmo/  # Practice + UGC flows
├── domain/                         # Adherence OS (pure TS, no UI)
├── hooks/                          # React hooks (progress, coach, battle, CGM)
├── components/                     # Presentational UI
├── constants/ types/ utils/        # Config, types, helpers
├── scripts/                        # check-secrets.mjs, tooling
├── server/leaderboard-worker/      # Coach + digest + leaderboard API
├── docs/                           # Architecture, KPI, UGC, launch
├── context/
│   ├── PlayerProgressContext.tsx   # Global progress state (Single source of truth)
│   ├── GameSessionContext.tsx      # Scoped battle/health state
│   ├── BeamContext.tsx             # Beam SDK lifecycle
│   └── Web3Context.tsx            # Web3 wallet integration
├── components/
│   ├── game/                      # Pure UI components
│   │   ├── MainMenu.tsx           # Realm Home (mission-first)
│   │   ├── BattleScreen.tsx       # Uses: COLORS, keyboard listeners, responsive layout
│   │   ├── ResultsScroll.tsx      # Uses: COLORS, useAccessibility
│   │   ├── Onboarding.tsx         # Tutorial UI with mode-specific steps
│   │   └── [other game components]
│   ├── WebProviders.tsx           # Cross-platform provider wrapper
├── hooks/
│   ├── usePlayerProgress.ts       # Progression tracking & AsyncStorage persistence
│   ├── useBattleGame.ts           # Game state & mechanics
│   ├── useHealthProfile.ts        # Health simulation engine
│   ├── useAccessibility.ts        # Screen reader labels
│   └── [other hooks]
├── constants/
│   ├── designSystem.ts            # Colors, typography, spacing, animations
│   ├── gameTiers.ts               # Tier configurations
│   └── [other configs]
├── types/
│   ├── game.ts                    # Game state types
│   └── health.ts                  # Health profile types
└── utils/
    ├── animations.ts              # Reusable animation builders
    └── [other utilities]
```

### Key Architectural Systems

**Design System** (`constants/designSystem.ts`)
- Centralized colors (glucose zones, UI, accessibility)
- Typography presets (TITLE_LARGE, BODY_LARGE, BUTTON, etc.)
- Spacing grid (4px base unit)
- Animation durations and easing
- Shadow/elevation levels
- Z-index layering rules

**Route-Based Navigation** (`expo-router`)
- File-based routing with typed routes
- `(game)` and `slowmo` route groups for scoped providers and logic
- `router.replace()` for linear flow (battle → results → menu)
- `router.push()` for back-navigable screens (menu → game-selection)
- Route params for passing tier/controlMode between screens

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

### Beam SDK Integration (`context/BeamContext.tsx`)
**Frictionless social onboarding and background game reporting.**

**Key Usage:**
- **Initialization**: Managed by `BeamProvider` in `WebProviders.tsx`.
- **Login**: `beam.login(provider)` (e.g., 'google', 'apple').
- **Syncing**: `beam.client.players.updateStats()` for persistent progress.
- **Reporting**: Match results are reported to Beam at the end of each session.

**Example: Accessing Beam State**
```typescript
import { useBeam } from '@/context/BeamContext';

const { account, login, logout, isLoading } = useBeam();

const handleLogin = () => login('google');
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
5. **Use context, not direct hooks** - Always use `usePlayerProgressContext()` from `@/context/PlayerProgressContext`, never call `usePlayerProgress()` directly in components
6. **Navigate with router** - Use `router.replace()` for one-way flow, `router.push()` for back-navigable screens

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
  const { unlockNextTier } = usePlayerProgressContext();
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
# Check progression context
console.log(usePlayerProgressContext().progress);

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
