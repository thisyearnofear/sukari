import {
  hexToRgb,
  rgbToHex,
  lerpRgb,
  lerpFieldState,
  isFieldSettled,
} from '@/utils/fieldColor';

describe('fieldColor', () => {
  it('parses programme hex colors to rgb', () => {
    expect(hexToRgb('#3D9B7A')).toEqual({ r: 61, g: 155, b: 122 });
    expect(hexToRgb('#C4923A')).toEqual({ r: 196, g: 146, b: 58 });
  });

  it('handles shorthand and invalid input safely', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('not-a-color')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('round-trips hex → rgb → hex', () => {
    expect(rgbToHex(hexToRgb('#3D9B7A'))).toBe('#3d9b7a');
  });

  it('clamps rgb channels when serializing', () => {
    expect(rgbToHex({ r: 300, g: -4, b: 128 })).toBe('#ff0080');
  });

  it('lerps channels at the bounds and midpoint', () => {
    const from = { r: 0, g: 100, b: 200 };
    const to = { r: 200, g: 100, b: 0 };
    expect(lerpRgb(from, to, 0)).toEqual(from);
    expect(lerpRgb(from, to, 1)).toEqual(to);
    expect(lerpRgb(from, to, 0.5)).toEqual({ r: 100, g: 100, b: 100 });
  });

  it('lerps field intensity alongside color', () => {
    const from = { rgb: { r: 0, g: 0, b: 0 }, intensity: 0.8 };
    const to = { rgb: { r: 100, g: 100, b: 100 }, intensity: 0.4 };
    const mid = lerpFieldState(from, to, 0.5);
    expect(mid.intensity).toBeCloseTo(0.6);
    expect(mid.rgb.r).toBe(50);
  });

  it('reports settled only within epsilon on every channel', () => {
    const target = { rgb: { r: 61, g: 155, b: 122 }, intensity: 0.4 };
    expect(isFieldSettled(target, target)).toBe(true);
    expect(
      isFieldSettled({ rgb: { r: 62, g: 154, b: 122 }, intensity: 0.405 }, target),
    ).toBe(true);
    expect(
      isFieldSettled({ rgb: { r: 90, g: 155, b: 122 }, intensity: 0.4 }, target),
    ).toBe(false);
    expect(
      isFieldSettled({ rgb: { r: 61, g: 155, b: 122 }, intensity: 0.5 }, target),
    ).toBe(false);
  });

  it('exponential approach converges near target in ~1.2s at 60fps', () => {
    const target = { rgb: hexToRgb('#3D9B7A'), intensity: 0.4 };
    let current = { rgb: hexToRgb('#C4923A'), intensity: 0.85 };
    for (let i = 0; i < 72; i++) current = lerpFieldState(current, target, 0.06);
    expect(isFieldSettled(current, target, 2)).toBe(true);
  });
});
