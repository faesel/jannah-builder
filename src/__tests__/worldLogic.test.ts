import { WorldLogic } from '../logic/worldLogic';
import { UserProfile, PrayerLog } from '../types/models';
import { GAME_CONFIG } from '../config/game.config';

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'test-profile',
    name: 'Test',
    createdAt: 0,
    lastActive: 0,
    worldState: {
      trees: [],
      flowers: [],
      buildings: [],
      animals: [],
      illustriousItems: [],
      season: 'spring',
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
      totalAnimalsAppeared: 0,
      mapAge: 0,
      currentStreak: 0,
      longestStreak: 0,
    },
    streaks: {
      current: 0,
      longest: 0,
      lastPrayerDate: '',
      consecutiveFullDays: 0,
    },
    ...overrides,
  };
}

function makeLog(date: string, complete: boolean): PrayerLog {
  return {
    id: `prayer_${date}`,
    date,
    prayers: {
      Fajr: complete,
      Dhuhr: complete,
      Asr: complete,
      Maghrib: complete,
      Isha: complete,
    },
    isComplete: complete,
    quranLogged: false,
    dhikrLogged: false,
    timestamp: 0,
  };
}

function consecutiveLogs(endDate: string, count: number): PrayerLog[] {
  const logs: PrayerLog[] = [];
  let cursor = endDate;
  for (let i = 0; i < count; i++) {
    logs.push(makeLog(cursor, true));
    const d = new Date(cursor);
    d.setDate(d.getDate() - 1);
    cursor = d.toISOString().split('T')[0];
  }
  return logs;
}

describe('WorldLogic', () => {
  describe('processDay', () => {
    it('generates a tree after 3 consecutive complete days', () => {
      const logs = consecutiveLogs('2026-03-03', 3);
      const profile = makeProfile({ prayerLogs: logs });
      const result = WorldLogic.processDay(profile, '2026-03-03');
      expect(result.treesAdded.length).toBeGreaterThan(0);
    });

    it('does not generate a tree with only 2 consecutive days', () => {
      const logs = consecutiveLogs('2026-03-02', 2);
      const profile = makeProfile({ prayerLogs: logs });
      const result = WorldLogic.processDay(profile, '2026-03-02');
      expect(result.treesAdded).toHaveLength(0);
    });

    it('triggers decay on a missed day', () => {
      const tree = {
        id: 'tree_1',
        stage: 'mature' as const,
        position: { x: 0, y: 0 },
        createdAt: 0,
        lastUpdated: 0,
      };
      const profile = makeProfile({
        prayerLogs: [],
        worldState: {
          trees: [tree],
          flowers: [],
          buildings: [],
          animals: [],
          illustriousItems: [],
          season: 'spring',
           mapSize: { width: GAME_CONFIG.map.initialGridSize, height: GAME_CONFIG.map.initialGridSize },
          gridSize: GAME_CONFIG.map.initialGridSize,
          lastUpdated: 0,
        },
      });
      const result = WorldLogic.processDay(profile, '2026-03-01');
      expect(
        result.treesDecayed.length + result.treesRemoved.length
      ).toBe(1);
    });

    it('evaluates season change', () => {
      // Enable seasons for this test
      (GAME_CONFIG.seasons as any).enabled = true;
      const logs = consecutiveLogs('2026-03-14', 14);
      const profile = makeProfile({ prayerLogs: logs });
      const result = WorldLogic.processDay(profile, '2026-03-14');
      expect(result.seasonChanged).toBe(true);
      expect(result.newSeason).toBe('summer');
      (GAME_CONFIG.seasons as any).enabled = false;
    });
  });

  describe('applyProcessingResult', () => {
    it('adds trees to world state', () => {
      const profile = makeProfile();
      const result = WorldLogic.processDay(profile, '2026-03-01');
      // Force add a tree to test application
      result.treesAdded = [
        {
          id: 'new_tree',
          stage: 'sapling',
          position: { x: 0, y: 0 },
          createdAt: 0,
          lastUpdated: 0,
        },
      ];
      const updated = WorldLogic.applyProcessingResult(profile, result);
      expect(updated.worldState.trees).toHaveLength(1);
      expect(updated.statistics.totalTreesGrown).toBe(1);
    });

    it('removes decayed trees from world state', () => {
      const tree = {
        id: 'tree_to_remove',
        stage: 'sapling' as const,
        position: { x: 0, y: 0 },
        createdAt: 0,
        lastUpdated: 0,
      };
      const profile = makeProfile({
        worldState: {
          trees: [tree],
          flowers: [],
          buildings: [],
          animals: [],
          illustriousItems: [],
          season: 'spring',
          mapSize: { width: GAME_CONFIG.map.initialGridSize, height: GAME_CONFIG.map.initialGridSize },
          gridSize: GAME_CONFIG.map.initialGridSize,
          lastUpdated: 0,
        },
      });
      const result: ReturnType<typeof WorldLogic.processDay> = {
        treesAdded: [],
        treesDecayed: [],
        treesRemoved: ['tree_to_remove'],
        buildingsAdded: [],
        animalsAdded: [],
        illustriousItemsAdded: [],
        illustriousItemsRemoved: [],
        seasonChanged: false,
      };
      const updated = WorldLogic.applyProcessingResult(profile, result);
      expect(updated.worldState.trees).toHaveLength(0);
      expect(updated.statistics.totalTreesDecayed).toBe(1);
    });

    it('updates season in world state', () => {
      const profile = makeProfile();
      const result: ReturnType<typeof WorldLogic.processDay> = {
        treesAdded: [],
        treesDecayed: [],
        treesRemoved: [],
        buildingsAdded: [],
        animalsAdded: [],
        illustriousItemsAdded: [],
        illustriousItemsRemoved: [],
        seasonChanged: true,
        newSeason: 'summer',
      };
      const updated = WorldLogic.applyProcessingResult(profile, result);
      expect(updated.worldState.season).toBe('summer');
    });
  });
});
