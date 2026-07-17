import {
  dateKeyFrom,
  selectMission,
  buildTransfer,
  getPracticeBiasForMission,
  emptyAdherenceWeek,
  rollAdherenceWeek,
} from '@/domain/programme';
import { buildSignalSnapshot } from '@/domain/signals';

describe('programme domain', () => {
  it('selects one mission per day and keeps it stable', () => {
    const first = selectMission({ userMode: 'personal' });
    const second = selectMission({
      userMode: 'personal',
      activeMission: first,
    });
    expect(second.id).toBe(first.id);
    expect(first.dateKey).toBe(dateKeyFrom());
  });

  it('prefers caregiver_support for caregiver mode', () => {
    const mission = selectMission({ userMode: 'caregiver', activeMission: null });
    expect(mission.templateId).toBe('caregiver_support');
  });

  it('builds transfer after practice', () => {
    const mission = selectMission({ userMode: 'personal', activeMission: null });
    const transfer = buildTransfer(mission, {
      result: 'victory',
      correctSwipes: 5,
      incorrectSwipes: 1,
      score: 200,
    });
    expect(transfer?.practiced).toBe(true);
    expect(transfer?.realWorldAction).toBeTruthy();
  });

  it('returns practice bias for mission templates', () => {
    const mission = selectMission({
      userMode: 'personal',
      forceTemplateId: 'protein_first',
      activeMission: null,
    });
    const bias = getPracticeBiasForMission(mission);
    expect(bias.preferProteinAllies).toBe(true);
  });

  it('rolls adherence week counters', () => {
    const mission = selectMission({ userMode: 'curious', activeMission: null });
    const week = rollAdherenceWeek(emptyAdherenceWeek(), mission, 'completed');
    expect(week.completed).toBe(1);
  });
});

describe('signals domain', () => {
  it('builds minimized snapshot without leaking glucose in private mode', () => {
    const snap = buildSignalSnapshot({
      connected: true,
      provider: 'dexcom',
      latestReading: {
        value: 140,
        timestamp: Date.now(),
        source: 'cgm',
        trend: 'stable',
      },
      privacyMode: 'private',
    });
    expect(snap.latestMgDl).toBeNull();
    expect(snap.minimized.band).toBe('in_range');
    expect(snap.minimized.connected).toBe(true);
  });
});
