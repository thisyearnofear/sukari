/**
 * NAVIGATION - Single source of truth for app screen graph
 * 
 * Defines:
 * - All valid app screens
 * - Valid transitions between screens
 * - Screen metadata (titles, descriptions)
 * - Progression flow (tier navigation)
 * 
 * Replaces scattered if/else logic with explicit state machine
 */

export type AppScreen = 
  | 'menu'                    // Main menu with user mode selector
  | 'onboarding'              // Tier-specific onboarding flow
  | 'game_selection'          // Game mode and tier selector
  | 'battle'                  // Active gameplay
  | 'results'                 // End-of-game results and stats
  | 'slowmo'                  // Slow-motion analysis mode
  | 'slowmo_results'          // Slow-mo session results
  | 'slowmo_stats'            // Slow-mo analytics dashboard
  | 'welcome';                // Returning player welcome (optional)

/**
 * Screen metadata for context and debugging
 */
export const SCREEN_METADATA: Record<AppScreen, {
  title: string;
  description: string;
  showBackButton: boolean;
  showNavBar: boolean;
  hideBottomTabs: boolean;
}> = {
  menu: {
    title: 'Main Menu',
    description: 'Home screen with game options',
    showBackButton: false,
    showNavBar: false,
    hideBottomTabs: true,
  },
  onboarding: {
    title: 'Tutorial',
    description: 'Tier-specific onboarding instructions',
    showBackButton: false,
    showNavBar: false,
    hideBottomTabs: true,
  },
  game_selection: {
    title: 'Select Game',
    description: 'Choose tier and game mode',
    showBackButton: true,
    showNavBar: false,
    hideBottomTabs: true,
  },
  battle: {
    title: 'Battle',
    description: 'Active gameplay',
    showBackButton: false,
    showNavBar: false,
    hideBottomTabs: true,
  },
  results: {
    title: 'Results',
    description: 'Game results and statistics',
    showBackButton: false,
    showNavBar: false,
    hideBottomTabs: true,
  },
  slowmo: {
    title: 'Slow-Motion Mode',
    description: 'Detailed glucose analysis',
    showBackButton: true,
    showNavBar: false,
    hideBottomTabs: true,
  },
  slowmo_results: {
    title: 'Session Results',
    description: 'Slow-mo session analysis',
    showBackButton: false,
    showNavBar: false,
    hideBottomTabs: true,
  },
  slowmo_stats: {
    title: 'Analytics',
    description: 'Historical slow-mo statistics',
    showBackButton: true,
    showNavBar: false,
    hideBottomTabs: true,
  },
  welcome: {
    title: 'Welcome Back',
    description: 'Returning player experience',
    showBackButton: false,
    showNavBar: false,
    hideBottomTabs: true,
  },
};

/**
 * Valid transitions between screens
 * Maps from→to valid transitions
 * If a transition isn't listed, it's invalid (helps catch bugs)
 */
export const VALID_TRANSITIONS: Record<AppScreen, AppScreen[]> = {
  menu: [
    'onboarding',           // Start game
    'game_selection',       // Select different game
    'slowmo_stats',         // View analytics
    'welcome',              // Show welcome back
  ],
  onboarding: [
    'battle',               // Start actual game
  ],
  game_selection: [
    'menu',                 // Go back
    'onboarding',           // Start selected game
    'slowmo',               // Start slowmo mode
  ],
  battle: [
    'results',              // Game finished
    'menu',                 // Exit to menu
  ],
  results: [
    'menu',                 // Go to menu
    'onboarding',           // Advance tier (auto-advance)
  ],
  slowmo: [
    'game_selection',       // Go back
    'slowmo_results',       // Session completed
    'menu',                 // Exit to menu
  ],
  slowmo_results: [
    'menu',                 // Continue to menu
  ],
  slowmo_stats: [
    'menu',                 // Close stats
  ],
  welcome: [
    'menu',                 // Continue to menu
    'battle',               // Resume game
  ],
};

/**
 * Check if transition is valid
 */
export function isValidTransition(from: AppScreen, to: AppScreen): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get navigation breadcrumb for a screen
 * Shows user where they are in the progression
 */
export function getNavigationBreadcrumb(screen: AppScreen): string {
  switch (screen) {
    case 'menu':
      return 'Home';
    case 'game_selection':
      return 'Home > Select Game';
    case 'onboarding':
      return 'Game > Tutorial';
    case 'battle':
      return 'Game > Battle';
    case 'results':
      return 'Game > Results';
    case 'slowmo':
      return 'Slow-Mo > Play';
    case 'slowmo_results':
      return 'Slow-Mo > Results';
    case 'slowmo_stats':
      return 'Slow-Mo > Stats';
    case 'welcome':
      return 'Welcome';
    default:
      return '';
  }
}

/**
 * Get semantic description for screen transitions
 * Used for accessibility and logging
 */
export function getTransitionDescription(from: AppScreen, to: AppScreen): string {
  const transitions: Record<string, string> = {
    'menu:game_selection': 'Opening game selection',
    'menu:onboarding': 'Starting new game',
    'menu:slowmo_stats': 'Viewing analytics',
    'game_selection:menu': 'Going back to menu',
    'game_selection:onboarding': 'Starting selected game',
    'game_selection:slowmo': 'Starting slow-mo mode',
    'onboarding:battle': 'Starting gameplay',
    'battle:results': 'Finishing game',
    'battle:menu': 'Exiting to menu',
    'results:menu': 'Returning to menu',
    'results:onboarding': 'Advancing to next tier',
    'slowmo:game_selection': 'Returning to game selection',
    'slowmo:slowmo_results': 'Completing slow-mo session',
    'slowmo:menu': 'Exiting slow-mo',
    'slowmo_results:menu': 'Returning to menu',
    'slowmo_stats:menu': 'Closing analytics',
    'welcome:menu': 'Continuing to menu',
    'welcome:battle': 'Resuming game',
  };
  
  const key = `${from}:${to}`;
  return transitions[key] || 'Navigating...';
}

/**
 * Get screen progress indicator
 * Shows tier progression for onboarding flow
 */
export function getProgressIndicator(screen: AppScreen, currentTier?: string): {
  current: number;
  total: number;
  label: string;
} {
  switch (screen) {
    case 'onboarding':
      return {
        current: currentTier === 'tier2' ? 2 : currentTier === 'tier3' ? 3 : 1,
        total: 3,
        label: `Tier ${currentTier === 'tier2' ? 2 : currentTier === 'tier3' ? 3 : 1}`,
      };
    case 'battle':
      return {
        current: currentTier === 'tier2' ? 2 : currentTier === 'tier3' ? 3 : 1,
        total: 3,
        label: `Playing Tier ${currentTier === 'tier2' ? 2 : currentTier === 'tier3' ? 3 : 1}`,
      };
    default:
      return {
        current: 0,
        total: 0,
        label: '',
      };
  }
}

/**
 * Categorize screens for behavior grouping
 */
export const SCREEN_CATEGORIES = {
  GAME_FLOW: ['onboarding', 'battle', 'results'] as AppScreen[],
  SLOWMO_FLOW: ['slowmo', 'slowmo_results', 'slowmo_stats'] as AppScreen[],
  MENU_FLOW: ['menu', 'game_selection', 'welcome'] as AppScreen[],
  OVERLAY_SCREENS: [] as AppScreen[],
} as const;

export function isInGameFlow(screen: AppScreen): boolean {
  return SCREEN_CATEGORIES.GAME_FLOW.includes(screen);
}

export function isInSlowMoFlow(screen: AppScreen): boolean {
  return SCREEN_CATEGORIES.SLOWMO_FLOW.includes(screen);
}

export function isInMenuFlow(screen: AppScreen): boolean {
  return SCREEN_CATEGORIES.MENU_FLOW.includes(screen);
}
