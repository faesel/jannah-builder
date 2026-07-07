import { PrayerLogic } from '../logic/prayerLogic';
import { WorldLogic } from '../logic/worldLogic';
import { GAME_CONFIG, TreeStage } from '../config/game.config';
import { Tree, UserProfile } from '../types/models';

function makeTree(id: string, stage: TreeStage): Tree {
  return {
    id,
    stage,
    position: { x: 0, y: 0 },
    createdAt: 0,
    lastUpdated: 0,
  };
}

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'p1',
    name: 'Test',
    createdAt: 0,
    lastActive: 0,
    settings: { restMode: false },
    worldState: {
      trees: [],
      flowers: [],
      dhikrFlowers: [],
      mushrooms: [],
      obstacles: [],
      buildings: [],
      animals: [],
      rivers: [],
      illustriousItems: [],
      mapSize: { width: GAME_CONFIG.map.initialGridSize, height: GAME_CONFIG.map.initialGridSize },
      gridSize: GAME_CONFIG.map.initialGridSize,
      lastUpdated: 0,
    },
    prayerLogs: [],
    statistics: {
      totalPrayersLogged: 0,
      totalDaysComplete: 0,
      totalTreesGrown: 0,
      totalTreesDecayed: 0,
      totalBuildingsCreated: 0,
      totalBuildingsReturned: 0,
      totalAnimalsAppeared: 0,
      totalAnimalsReturned: 0,
      mapAge: 0,
      currentStreak: 0,
      longestStreak: 0,
    },
    streaks: { current: 0, longest: 0, lastPrayerDate: '', consecutiveFullDays: 0 },
    ...overrides,
  };
}

describe('PrayerLogic.getMissedDatesBetween', () => {
  it('returns the days strictly between last-active and today', () => {
    expect(PrayerLogic.getMissedDatesBetween('2026-06-25', '2026-07-01')).toEqual([
      '2026-06-26',
      '2026-06-27',
      '2026-06-28',
      '2026-06-29',
      '2026-06-30',
    ]);
  });

  it('returns nothing when reopened the same day', () => {
    expect(PrayerLogic.getMissedDatesBetween('2026-07-04', '2026-07-04')).toEqual([]);
  });

  it('returns nothing when reopened the next day (today excluded)', () => {
    expect(PrayerLogic.getMissedDatesBetween('2026-07-03', '2026-07-04')).toEqual([]);
  });

  it('spans month boundaries correctly', () => {
    expect(PrayerLogic.getMissedDatesBetween('2026-05-30', '2026-06-02')).toEqual([
      '2026-05-31',
      '2026-06-01',
    ]);
  });
});

describe('WorldLogic.processMissedDays', () => {
  it('decays one tree per missed day after a multi-day absence (rest mode off)', () => {
    // App closed for a week — no logs for any of those days.
    const profile = makeProfile({
      worldState: {
        ...makeProfile().worldState,
        trees: [
          makeTree('t1', 'mature'),
          makeTree('t2', 'mature'),
          makeTree('t3', 'mature'),
          makeTree('t4', 'young'),
        ],
      },
    });

    const missed = PrayerLogic.getMissedDatesBetween('2026-06-25', '2026-07-02'); // 6 days
    const { profile: after } = WorldLogic.processMissedDays(profile, missed);

    // Every missed day should have degraded/removed exactly one tree.
    expect(after.statistics.totalTreesDecayed).toBe(6);
    // Trees are gently pushed down the stages, not left fully mature.
    const stages = after.worldState.trees.map((t) => t.stage).sort();
    expect(stages).not.toEqual(['mature', 'mature', 'mature', 'young'].sort());
    expect(after.worldState.lastProcessedDate).toBe('2026-07-01');
  });

  it('does not decay when rest mode is on, and marks missed days as rest', () => {
    const profile = makeProfile({
      settings: { restMode: true },
      worldState: {
        ...makeProfile().worldState,
        trees: [makeTree('t1', 'mature'), makeTree('t2', 'young')],
      },
    });

    const missed = PrayerLogic.getMissedDatesBetween('2026-06-25', '2026-07-01'); // 5 days
    const { profile: after } = WorldLogic.processMissedDays(profile, missed);

    expect(after.statistics.totalTreesDecayed).toBe(0);
    expect(after.worldState.trees.map((t) => t.stage).sort()).toEqual(['mature', 'young'].sort());
    // Each missed day is recorded as a rest day so streaks are preserved.
    const restDays = after.prayerLogs.filter((l) => l.isRestDay).map((l) => l.date);
    expect(restDays).toEqual(missed);
  });

  it('is a no-op when there are no missed days', () => {
    const profile = makeProfile({
      worldState: { ...makeProfile().worldState, trees: [makeTree('t1', 'mature')] },
    });
    const { profile: after, daysProcessed } = WorldLogic.processMissedDays(profile, []);

    expect(daysProcessed).toBe(0);
    expect(after.statistics.totalTreesDecayed).toBe(0);
    expect(after.worldState.trees).toHaveLength(1);
  });
});
