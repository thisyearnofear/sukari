import { AGENCY_CHARTER, getAgencyLane } from '@/constants/agencyCharter';

describe('agency charter config', () => {
  it('publishes exactly three lanes in the designed order', () => {
    expect(AGENCY_CHARTER.lanes.map((l) => l.id)).toEqual(['always', 'asks_first', 'never']);
  });

  it('gives every lane a one-word marker, icon, and at least three behaviours', () => {
    for (const lane of AGENCY_CHARTER.lanes) {
      expect(lane.tag.split(' ')).toHaveLength(1);
      expect(lane.icon.length).toBeGreaterThan(0);
      expect(lane.title.length).toBeGreaterThan(0);
      expect(lane.items.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('markers match the design vocabulary', () => {
    expect(getAgencyLane('always').tag).toBe('Autonomous');
    expect(getAgencyLane('asks_first').tag).toBe('Proposal');
    expect(getAgencyLane('never').tag).toBe('Never');
  });

  it('never lane rules out dosing, diagnosis, and shame', () => {
    const text = getAgencyLane('never').items.join(' ').toLowerCase();
    expect(text).toContain('insulin');
    expect(text).toContain('diagnosis');
    expect(text).toContain('shame');
  });

  it('always lane covers detection, adaptation, follow-up, and escalation', () => {
    const text = getAgencyLane('always').items.join(' ').toLowerCase();
    expect(text).toContain('pattern');
    expect(text).toContain('adapts');
    expect(text).toContain('follows up');
    expect(text).toContain('escalates');
  });

  it('safety line keeps the habits-only scope', () => {
    const safety = AGENCY_CHARTER.safety.toLowerCase();
    expect(safety).toContain('habits only');
    expect(safety).toContain('never insulin');
  });

  it('getAgencyLane throws on unknown lane', () => {
    expect(() => getAgencyLane('sometimes' as never)).toThrow('Unknown agency lane');
  });
});
