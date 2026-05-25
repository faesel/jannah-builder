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

    it('upgrades an existing sapling instead of creating a new tree', () => {
      const existingSapling = {
        id: 'tree_existing',
        stage: 'sapling' as const,
        position: { x: 1, y: 1 },
        createdAt: 1000,
        lastUpdated: 1000,
      };
      const logs = consecutiveLogs('2026-03-06', 6);
      // Profile already has 1 sapling from the first 3-day period
      const profile = makeProfile({
        prayerLogs: logs,
        worldState: {
          trees: [existingSapling],
          flowers: [],
          buildings: [],
          animals: [],
          rivers: [],
          illustriousItems: [],
          mapSize: { width: GAME_CONFIG.map.initialGridSize, height: GAME_CONFIG.map.initialGridSize },
          gridSize: GAME_CONFIG.map.initialGridSize,
          lastUpdated: 0,
        },
      });
      const result = WorldLogic.processDay(profile, '2026-03-06');
      // Should upgrade the sapling, not create a new tree
      expect(result.treesUpgraded).toHaveLength(1);
      expect(result.treesUpgraded[0].id).toBe('tree_existing');
      expect(result.treesUpgraded[0].stage).toBe('young');
      expect(result.treesAdded).toHaveLength(0);
    });

    it('creates a new tree only when all existing trees are mature', () => {
      const matureTree = {
        id: 'tree_mature',
        stage: 'mature' as const,
        position: { x: 2, y: 2 },
        createdAt: 500,
        lastUpdated: 500,
      };
      const logs = consecutiveLogs('2026-03-06', 6);
      const profile = makeProfile({
        prayerLogs: logs,
        worldState: {
          trees: [matureTree],
          flowers: [],
          buildings: [],
          animals: [],
          rivers: [],
          illustriousItems: [],
          mapSize: { width: GAME_CONFIG.map.initialGridSize, height: GAME_CONFIG.map.initialGridSize },
          gridSize: GAME_CONFIG.map.initialGridSize,
          lastUpdated: 0,
        },
      });
      const result = WorldLogic.processDay(profile, '2026-03-06');
      // All trees are mature, so a new sapling is created
      expect(result.treesAdded).toHaveLength(1);
      expect(result.treesUpgraded).toHaveLength(0);
    });

    it('upgrades oldest sapling first when multiple saplings exist', () => {
      const olderSapling = {
        id: 'tree_old',
        stage: 'sapling' as const,
        position: { x: 1, y: 1 },
        createdAt: 100,
        lastUpdated: 100,
      };
      const newerSapling = {
        id: 'tree_new',
        stage: 'sapling' as const,
        position: { x: 2, y: 2 },
        createdAt: 200,
        lastUpdated: 200,
      };
      const logs = consecutiveLogs('2026-03-09', 9);
      const profile = makeProfile({
        prayerLogs: logs,
        worldState: {
          trees: [newerSapling, olderSapling],
          flowers: [],
          buildings: [],
          animals: [],
          rivers: [],
          illustriousItems: [],
          mapSize: { width: GAME_CONFIG.map.initialGridSize, height: GAME_CONFIG.map.initialGridSize },
          gridSize: GAME_CONFIG.map.initialGridSize,
          lastUpdated: 0,
        },
      });
      // 9 days = 3 tree actions; 2 existing trees → 1 action available
      const result = WorldLogic.processDay(profile, '2026-03-09');
      expect(result.treesUpgraded).toHaveLength(1);
      expect(result.treesUpgraded[0].id).toBe('tree_old');
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
          rivers: [],
      illustriousItems: [],
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
          rivers: [],
      illustriousItems: [],
          mapSize: { width: GAME_CONFIG.map.initialGridSize, height: GAME_CONFIG.map.initialGridSize },
          gridSize: GAME_CONFIG.map.initialGridSize,
          lastUpdated: 0,
        },
      });
      const result: ReturnType<typeof WorldLogic.processDay> = {
        treesAdded: [],
        treesUpgraded: [],
        treesDecayed: [],
        treesRemoved: ["tree_to_remove"],
        flowersAdded: [],
        flowersRemoved: [],
        buildingsAdded: [],
        buildingsDecayed: [],
        buildingsRemoved: [],
        animalsAdded: [],
        animalsRemoved: [],
        riversAdded: [],
        illustriousItemsAdded: [],
        illustriousItemsRemoved: [],
      };
      const updated = WorldLogic.applyProcessingResult(profile, result);
      expect(updated.worldState.trees).toHaveLength(0);
      expect(updated.statistics.totalTreesDecayed).toBe(1);
    });

    it('removes buildings when trees drop below threshold', () => {
      const building = {
        id: 'home_1',
        type: 'home' as const,
        position: { x: 5, y: 5 },
        createdAt: 1000,
        condition: 'good' as const,
      };
      const profile = makeProfile({
        worldState: {
          trees: [], // No trees — below home threshold of 30
          flowers: [],
          buildings: [building],
          animals: [],
          rivers: [],
          illustriousItems: [],
          mapSize: { width: GAME_CONFIG.map.initialGridSize, height: GAME_CONFIG.map.initialGridSize },
          gridSize: GAME_CONFIG.map.initialGridSize,
          lastUpdated: 0,
        },
      });
      const result: ReturnType<typeof WorldLogic.processDay> = {
        treesAdded: [],
        treesUpgraded: [],
        treesDecayed: [],
        treesRemoved: [],
        flowersAdded: [],
        flowersRemoved: [],
        buildingsAdded: [],
        buildingsDecayed: [],
        buildingsRemoved: ['home_1'],
        animalsAdded: [],
        animalsRemoved: [],
        riversAdded: [],
        illustriousItemsAdded: [],
        illustriousItemsRemoved: [],
      };
      const updated = WorldLogic.applyProcessingResult(profile, result);
      expect(updated.worldState.buildings).toHaveLength(0);
    });

    it('removes animals when trees drop below threshold', () => {
      const animal = {
        id: 'bird_1',
        type: 'bird' as const,
        position: { x: 3, y: 3 },
        createdAt: 1000,
      };
      const profile = makeProfile({
        worldState: {
          trees: [], // No trees — below bird threshold of 5
          flowers: [],
          buildings: [],
          animals: [animal],
          rivers: [],
          illustriousItems: [],
          mapSize: { width: GAME_CONFIG.map.initialGridSize, height: GAME_CONFIG.map.initialGridSize },
          gridSize: GAME_CONFIG.map.initialGridSize,
          lastUpdated: 0,
        },
      });
      const result: ReturnType<typeof WorldLogic.processDay> = {
        treesAdded: [],
        treesUpgraded: [],
        treesDecayed: [],
        treesRemoved: [],
        flowersAdded: [],
        flowersRemoved: [],
        buildingsAdded: [],
        buildingsDecayed: [],
        buildingsRemoved: [],
        animalsAdded: [],
        animalsRemoved: ['bird_1'],
        riversAdded: [],
        illustriousItemsAdded: [],
        illustriousItemsRemoved: [],
      };
      const updated = WorldLogic.applyProcessingResult(profile, result);
      expect(updated.worldState.animals).toHaveLength(0);
    });
  });
});
