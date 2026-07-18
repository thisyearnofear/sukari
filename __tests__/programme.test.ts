import {
  dateKeyFrom,
  selectMission,
  buildTransfer,
  getPracticeBiasForMission,
  getPracticeCueForTemplate,
  applyWorldStateToPracticeBias,
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

  it('exposes a patient-readable focus for a template-personalised rehearsal', () => {
    expect(getPracticeCueForTemplate('reject_liquid_sugar')).toEqual({
      label: 'Drink decisions',
      detail: 'Sugary-drink decisions appear more often so the practice matches today\'s ask.',
    });
    expect(getPracticeCueForTemplate('unknown_template')).toBeNull();
  });

  it('slows the rehearsal only when the bounded world state is unhurried', () => {
    const adjusted = applyWorldStateToPracticeBias(
      { allyWeightBonus: 0, enemyWeightBonus: 0, preferProteinAllies: false, preferRejectSugaryDrinks: false, spawnRateMultiplier: 1 },
      {
        version: 1,
        missionId: 'mission-1',
        missionTemplateId: 'post_meal_walk',
        scene: 'after_meal_path',
        tone: 'gentle',
        practiceIntensity: 'unhurried',
        response: 'easier',
        updatedAt: 1,
      },
    );
    expect(adjusted.spawnRateMultiplier).toBe(0.78);
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
