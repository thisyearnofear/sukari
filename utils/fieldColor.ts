/**
 * Field color math — interpolation helpers for the Settle.
 * The field never hard-cuts between states; it melts from stressed
 * to steady over ~1.2s. Settling is the reward (docs/PRODUCT_DESIGN.md §7).
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface FieldVisual {
  rgb: Rgb;
  intensity: number;
}

export function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num) || full.length !== 6) return { r: 0, g: 0, b: 0 };
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const to = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function lerpRgb(from: Rgb, to: Rgb, t: number): Rgb {
  return {
    r: from.r + (to.r - from.r) * t,
    g: from.g + (to.g - from.g) * t,
    b: from.b + (to.b - from.b) * t,
  };
}

/** Exponential approach — the physics of a system settling to equilibrium. */
export function lerpFieldState(from: FieldVisual, to: FieldVisual, t: number): FieldVisual {
  return {
    rgb: lerpRgb(from.rgb, to.rgb, t),
    intensity: from.intensity + (to.intensity - from.intensity) * t,
  };
}

/** Close enough to snap to the target and stop animating. */
export function isFieldSettled(a: FieldVisual, b: FieldVisual, epsilon = 1.5): boolean {
  return (
    Math.abs(a.rgb.r - b.rgb.r) < epsilon &&
    Math.abs(a.rgb.g - b.rgb.g) < epsilon &&
    Math.abs(a.rgb.b - b.rgb.b) < epsilon &&
    Math.abs(a.intensity - b.intensity) < 0.01
  );
}
