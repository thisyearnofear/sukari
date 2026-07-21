import {
  buildLocalDigest,
  estimateStaffMinutesSaved,
  STAFF_MINUTES_AVOIDED_CHECKIN,
  STAFF_MINUTES_AVOIDED_PER_COMPLETED_MISSION,
  STAFF_MINUTES_COMPLETED_MISSION_CAP,
  type WeeklyDigestPayload,
} from '@/domain/digest';
import { emptyAdherenceWeek } from '@/domain/programme';

function makeDigest(overrides: Partial<WeeklyDigestPayload> = {}): WeeklyDigestPayload {
  return {
    weekKey: '2026-07-21',
    adherence: emptyAdherenceWeek(),
    missionsCompleted: 0,
    missionsAssigned: 0,
    topBehaviours: [],
    wins: [],
    concerns: [],
    createdAt: Date.now(),
    outreachRecommended: false,
    ...overrides,
  };
}

describe('estimateStaffMinutesSaved', () => {
  it('returns 0 when outreach is recommended — staff time is needed, not saved', () => {
    const result = estimateStaffMinutesSaved(makeDigest({ outreachRecommended: true, missionsCompleted: 5 }));
    expect(result.minutes).toBe(0);
    expect(result.model).toMatch(/Outreach recommended/);
  });

  it('counts the avoided check-in when no outreach is needed', () => {
    const result = estimateStaffMinutesSaved(makeDigest({ outreachRecommended: false, missionsCompleted: 0 }));
    expect(result.minutes).toBe(STAFF_MINUTES_AVOIDED_CHECKIN);
    expect(result.model).toMatch(/avoided check-in/);
  });

  it('adds follow-up minutes for each completed mission', () => {
    const completed = 3;
    const result = estimateStaffMinutesSaved(makeDigest({ missionsCompleted: completed }));
    expect(result.minutes).toBe(
      STAFF_MINUTES_AVOIDED_CHECKIN + completed * STAFF_MINUTES_AVOIDED_PER_COMPLETED_MISSION,
    );
  });

  it('caps completed-mission follow-up so a high-volume week does not inflate the number', () => {
    const result = estimateStaffMinutesSaved(makeDigest({ missionsCompleted: 50 }));
    expect(result.minutes).toBe(
      STAFF_MINUTES_AVOIDED_CHECKIN +
        STAFF_MINUTES_COMPLETED_MISSION_CAP * STAFF_MINUTES_AVOIDED_PER_COMPLETED_MISSION,
    );
  });

  it('exposes the model string so the operator can see how the number was built', () => {
    const result = estimateStaffMinutesSaved(makeDigest({ missionsCompleted: 2 }));
    expect(result.model).toContain(String(STAFF_MINUTES_AVOIDED_CHECKIN));
    expect(result.model).toContain('2 completed mission');
  });
});

describe('buildLocalDigest', () => {
  it('flags outreach when completion is low and concerns exist', () => {
    const digest = buildLocalDigest({
      adherence: emptyAdherenceWeek(),
      missionHistory: [],
    });
    // No missions completed → concern present → outreach recommended at <40%.
    expect(digest.outreachRecommended).toBe(true);
    expect(digest.concerns.length).toBeGreaterThan(0);
  });
});
