/**
 * DESIGN SYSTEM - Single source of truth for all UI tokens
 * Enables consistent styling, easy theming, and accessibility
 * 
 * Organization:
 * - Colors: Zone-based system for glucose stability states
 * - Typography: Size, weight, line height standards
 * - Spacing: 4px grid base unit
 * - Animations: Duration, easing, and timing curves
 * - Shadows: Depth levels
 * - Z-indexes: Layering rules
 */

// ============================================
// COLORS - Glucose Zone Mapping
// ============================================
export const COLORS = {
  // Stability Zones (from gameConfig)
  ZONES: {
    balanced: '#10b981',      // Green - healthy glucose
    warningLow: '#38bdf8',    // Sky blue - low blood sugar
    warningHigh: '#f59e0b',   // Amber - high blood sugar
    criticalLow: '#06b6d4',   // Cyan - dangerously low
    criticalHigh: '#ef4444',  // Red - dangerously high
  },

  // Food Factions
  ALLY: '#22c55e',            // Bright green for healthy foods
  ENEMY: '#ef4444',           // Red for junk foods
  CONTEXTUAL: '#8b5cf6',      // Purple for contextual foods

  // UI Elements
  PRIMARY: '#3b82f6',         // Blue - primary actions
  SECONDARY: '#6b7280',       // Gray - secondary actions
  SUCCESS: '#10b981',         // Green - positive feedback
  WARNING: '#f59e0b',         // Amber - warnings
  ERROR: '#ef4444',           // Red - errors
  INFO: '#06b6d4',            // Cyan - info

  // Background & Text
  BG_DARK: '#0a0a12',         // Dark navy - main background
  BG_DARKER: '#000000',       // Black - overlay background
  TEXT_PRIMARY: '#ffffff',    // White - primary text
  TEXT_SECONDARY: '#d1d5db',  // Light gray - secondary text
  TEXT_MUTED: '#9ca3af',      // Gray - muted text
  BORDER: '#374151',          // Dark gray - borders

  // Accessibility
  FOCUS_RING: '#60a5fa',      // Blue - keyboard focus
} as const;

// ============================================
// TYPOGRAPHY
// ============================================
export const TYPOGRAPHY = {
  // Font sizes (in pixels)
  SIZE: {
    XS: 12,
    SM: 14,
    BASE: 16,
    LG: 18,
    XL: 20,
    '2XL': 24,
    '3XL': 30,
    '4XL': 36,
    '5XL': 48,
  } as const,

  // Font weights
  WEIGHT: {
    LIGHT: '300',
    NORMAL: '400',
    MEDIUM: '500',
    SEMIBOLD: '600',
    BOLD: '700',
    EXTRABOLD: '800',
  } as const,

  // Line heights
  LINE_HEIGHT: {
    TIGHT: 1.2,
    NORMAL: 1.5,
    RELAXED: 1.75,
    LOOSE: 2,
  } as const,

  // Presets for common text styles (lineHeight must be absolute px for React Native)
  PRESETS: {
    TITLE_LARGE: {
      fontSize: 36,
      fontWeight: '700' as const,
      lineHeight: 43, // 36 * 1.2
    },
    TITLE_MEDIUM: {
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 31, // 24 * 1.3
    },
    TITLE_SMALL: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 25, // 18 * 1.4
    },
    BODY_LARGE: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24, // 16 * 1.5
    },
    BODY_SMALL: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 21, // 14 * 1.5
    },
    CAPTION: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 17, // 12 * 1.4
    },
    BUTTON: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24, // 16 * 1.5
    },
  } as const,
} as const;

// ============================================
// SPACING - 4px Grid Base
// ============================================
export const SPACING = {
  // Base unit: 4px
  // Use multiples for consistency
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

// ============================================
// ANIMATIONS - Timing & Easing
// ============================================
export const ANIMATIONS = {
  // Standard durations (in milliseconds)
  DURATION: {
    INSTANT: 0,
    FAST: 150,
    BASE: 300,
    SLOW: 500,
    SLOWER: 800,
    SLOWEST: 1500,
  } as const,

  // Easing function names — use with Easing[key] from 'react-native'
  // e.g. Easing[ANIMATIONS.EASING.EASE_IN] or use the helpers below
  EASING: {
    LINEAR: 'linear',
    EASE_IN: 'in',
    EASE_OUT: 'out',
    EASE_IN_OUT: 'inOut',
  } as const,

  // Common animation configurations
  PRESETS: {
    // Fade in/out
    FADE_IN: {
      duration: 300,
      easing: 'ease-in',
    },
    FADE_OUT: {
      duration: 300,
      easing: 'ease-out',
    },

    // Scale
    SCALE_IN: {
      duration: 300,
      easing: 'ease-out',
    },
    SCALE_OUT: {
      duration: 200,
      easing: 'ease-in',
    },

    // Slide
    SLIDE_IN_UP: {
      duration: 400,
      easing: 'ease-out',
    },
    SLIDE_OUT_DOWN: {
      duration: 300,
      easing: 'ease-in',
    },

    // Pulse (for looping)
    PULSE: {
      duration: 800,
      easing: 'ease-in-out',
    },

    // Combo burst
    COMBO_BURST: {
      duration: 600,
      easing: 'ease-out',
    },

    // Screen transition
    SCREEN_TRANSITION: {
      duration: 300,
      easing: 'ease-in-out',
    },
  } as const,
} as const;

// ============================================
// SHADOWS - Depth Levels
// ============================================
export const SHADOWS = {
  NONE: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  SM: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  BASE: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  MD: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  LG: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
  XL: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.39,
    shadowRadius: 15.46,
    elevation: 20,
  },
} as const;

// ============================================
// Z-INDEXES - Layering Rules
// ============================================
export const Z_INDEX = {
  // Base layers
  BACKGROUND: 0,
  CONTENT: 10,
  
  // Overlays
  OVERLAY: 100,
  MODAL_BACKDROP: 110,
  MODAL: 120,
  
  // Floating elements
  DROPDOWN: 150,
  TOOLTIP: 160,
  NOTIFICATION: 170,
  
  // Always on top
  DEBUG: 999,
} as const;

// ============================================
// BORDER RADIUS - Consistency
// ============================================
export const BORDER_RADIUS = {
  NONE: 0,
  SM: 4,
  BASE: 8,
  MD: 12,
  LG: 16,
  XL: 20,
  FULL: 9999,
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get stability zone color by value (0-100)
 */
export function getStabilityColor(stability: number): string {
  if (stability >= 40 && stability <= 60) return COLORS.ZONES.balanced;
  if (stability >= 25 && stability < 40) return COLORS.ZONES.warningLow;
  if (stability > 60 && stability <= 75) return COLORS.ZONES.warningHigh;
  if (stability < 25) return COLORS.ZONES.criticalLow;
  return COLORS.ZONES.criticalHigh;
}

/**
 * Get zone label for stability value
 */
export function getStabilityLabel(stability: number): string {
  if (stability >= 40 && stability <= 60) return '⚖️ BALANCED';
  if (stability >= 25 && stability < 40) return '❄️ LOW';
  if (stability > 60 && stability <= 75) return '🔥 HIGH';
  if (stability < 25) return '💀 CRITICAL';
  return '💀 CRITICAL';
}

/**
 * Convert design token spacing to pixel value
 */
export function getSpacing(multiplier: keyof typeof SPACING): number {
  return SPACING[multiplier];
}

/**
 * Get animation duration as number
 */
export function getAnimationDuration(key: keyof typeof ANIMATIONS.DURATION): number {
  return ANIMATIONS.DURATION[key];
}
