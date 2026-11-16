import { circadianFieldCharacter, dayPartForHour } from '@/domain/atmosphere';

describe('circadian field character', () => {
  it('maps hours to day parts', () => {
    expect(dayPartForHour(2)).toBe('night');
    expect(dayPartForHour(7)).toBe('dawn');
    expect(dayPartForHour(13)).toBe('day');
    expect(dayPartForHour(19)).toBe('evening');
    expect(dayPartForHour(23)).toBe('night');
  });

  it('is quietest at night and fullest during the day', () => {
    const night = circadianFieldCharacter(3);
    const day = circadianFieldCharacter(13);
    expect(night.lightness).toBeLessThan(day.lightness);
    expect(night.tempo).toBeLessThan(day.tempo);
    expect(night.activity).toBeLessThan(day.activity);
  });

  it('warms in the evening and cools at night', () => {
    expect(circadianFieldCharacter(19).warm).toBeGreaterThan(0);
    expect(circadianFieldCharacter(3).warm).toBeLessThan(0);
  });

  it('handles edge hours and wrap-around', () => {
    expect(dayPartForHour(0)).toBe('night');
    expect(dayPartForHour(6)).toBe('dawn');
    expect(circadianFieldCharacter(25).tempo).toBe(circadianFieldCharacter(1).tempo);
  });
});
