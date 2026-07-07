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
          dhikrFlowers: [],
          mushrooms: [],
          obstacles: [],
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
          dhikrFlowers: [],
          mushrooms: [],
          obstacles: [],
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
          dhikrFlowers: [],
          mushrooms: [],
          obstacles: [],
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

    it('keeps growing after a broken streak even with many existing trees', () => {
      // Reproduces the reported bug: a long-standing user (several trees) breaks
      // their streak, then prays 3 consecutive full days again. Growth must
      // resume — it previously stalled because the target was tied to the
      // lifetime tree count rather than the current streak.
      const existingTrees = Array.from({ length: 5 }, (_, i) => ({
        id: `tree_${i}`,
        stage: 'mature' as const,
        position: { x: i, y: i + 3 },
        createdAt: i,
        lastUpdated: i,
      }));

      // A gap, then a fresh 3-day streak ending 2026-03-10.
      const logs = [
        makeLog('2026-03-01', true),
        makeLog('2026-03-02', true),
        // 2026-03-03 .. 2026-03-07 missing → streak broken
        makeLog('2026-03-08', true),
        makeLog('2026-03-09', true),
        makeLog('2026-03-10', true),
      ];

      const profile = makeProfile({
        prayerLogs: logs,
        worldState: {
          trees: existingTrees,
          flowers: [],
          buildings: [],
          animals: [],
          rivers: [],
          illustriousItems: [],
          dhikrFlowers: [],
          mushrooms: [],
          obstacles: [],
          mapSize: { width: GAME_CONFIG.map.initialGridSize, height: GAME_CONFIG.map.initialGridSize },
          gridSize: GAME_CONFIG.map.initialGridSize,
          lastUpdated: 0,
        },
      });

      const result = WorldLogic.processDay(profile, '2026-03-10');
      // All existing trees are mature, so the earned action is a brand new tree.
      expect(result.treesAdded).toHaveLength(1);
    });

    it('earns exactly one tree action per completed streak block, not per day', () => {
      // A continuous 4-day streak: only day 3 (a multiple of daysForNewTree)
      // earns an action; day 4 alone does not.
      const profile = makeProfile({ prayerLogs: consecutiveLogs('2026-03-04', 4) });
      const day4 = WorldLogic.processDay(profile, '2026-03-04');
      expect(day4.treesAdded).toHaveLength(0);
      expect(day4.treesUpgraded).toHaveLength(0);

      const day3 = WorldLogic.processDay(profile, '2026-03-03');
      expect(day3.treesAdded.length + day3.treesUpgraded.length).toBe(1);
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
      dhikrFlowers: [],
          mushrooms: [],
      obstacles: [],
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

    it('suspends all decay on a missed day when rest mode is enabled', () => {
      const tree = {
        id: 'tree_1',
        stage: 'mature' as const,
        position: { x: 0, y: 0 },
        createdAt: 0,
        lastUpdated: 0,
      };
      const profile = makeProfile({
        prayerLogs: [],
        settings: { restMode: true },
        worldState: {
          trees: [tree],
          flowers: [],
          buildings: [],
          animals: [],
          rivers: [],
          illustriousItems: [],
          dhikrFlowers: [],
          mushrooms: [],
          obstacles: [],
          mapSize: { width: GAME_CONFIG.map.initialGridSize, height: GAME_CONFIG.map.initialGridSize },
          gridSize: GAME_CONFIG.map.initialGridSize,
          lastUpdated: 0,
        },
      });
      const result = WorldLogic.processDay(profile, '2026-03-01');
      expect(result.treesDecayed).toHaveLength(0);
      expect(result.treesRemoved).toHaveLength(0);
      expect(result.buildingsRemoved).toHaveLength(0);
      expect(result.animalsRemoved).toHaveLength(0);
      expect(result.obstaclesAdded).toHaveLength(0);
    });

    it('clears one rock per prayer logged that day', () => {
      const obstacles = [
        { id: 'rock_1', type: 'rock' as const, variant: 1, position: { x: 1, y: 0 }, createdAt: 100 },
        { id: 'rock_2', type: 'rock' as const, variant: 2, position: { x: 2, y: 0 }, createdAt: 200 },
        { id: 'rock_3', type: 'rock' as const, variant: 3, position: { x: 3, y: 0 }, createdAt: 300 },
        { id: 'stump_1', type: 'stump' as const, variant: 1, position: { x: 4, y: 0 }, createdAt: 400 },
      ];
      // Log 2 of 5 prayers; no Qur'an/dhikr
      const partialLog: PrayerLog = {
        ...makeLog('2026-03-10', false),
        prayers: { Fajr: true, Dhuhr: true, Asr: false, Maghrib: false, Isha: false },
        isComplete: false,
      };
      const profile = makeProfile({
        prayerLogs: [partialLog],
        worldState: {
          trees: [], flowers: [], buildings: [], animals: [], rivers: [],
          illustriousItems: [], dhikrFlowers: [],
          mushrooms: [], obstacles,
          mapSize: { width: GAME_CONFIG.map.initialGridSize, height: GAME_CONFIG.map.initialGridSize },
          gridSize: GAME_CONFIG.map.initialGridSize,
          lastUpdated: 0,
        },
      });
      const result = WorldLogic.processDay(profile, '2026-03-10');
      // 2 prayers → 2 oldest rocks cleared; no stumps (no Qur'an/dhikr)
      expect(result.obstaclesRemoved).toEqual(['rock_1', 'rock_2']);
    });

    it('clears one stump for Qur\'an and one for dhikr', () => {
      const obstacles = [
        { id: 'stump_1', type: 'stump' as const, variant: 1, position: { x: 1, y: 0 }, createdAt: 100 },
        { id: 'stump_2', type: 'stump' as const, variant: 2, position: { x: 2, y: 0 }, createdAt: 200 },
        { id: 'stump_3', type: 'stump' as const, variant: 3, position: { x: 3, y: 0 }, createdAt: 300 },
      ];
      // Qur'an + dhikr logged, but zero prayers
      const log: PrayerLog = {
        ...makeLog('2026-03-11', false),
        prayers: { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false },
        isComplete: false,
        quranLogged: true,
        dhikrLogged: true,
      };
      const profile = makeProfile({
        prayerLogs: [log],
        worldState: {
          trees: [], flowers: [], buildings: [], animals: [], rivers: [],
          illustriousItems: [], dhikrFlowers: [],
          mushrooms: [], obstacles,
          mapSize: { width: GAME_CONFIG.map.initialGridSize, height: GAME_CONFIG.map.initialGridSize },
          gridSize: GAME_CONFIG.map.initialGridSize,
          lastUpdated: 0,
        },
      });
      const result = WorldLogic.processDay(profile, '2026-03-11');
      // 2 oldest stumps cleared; no rocks present
      expect(result.obstaclesRemoved).toEqual(['stump_1', 'stump_2']);
    });

    it('clears one mushroom (oldest first) on a day Qur\'an is logged', () => {
      const mushrooms = [
        { id: 'm_1', color: 'red' as const, stage: 1, position: { x: 1, y: 0 }, createdAt: 100 },
        { id: 'm_2', color: 'blue' as const, stage: 2, position: { x: 2, y: 0 }, createdAt: 200 },
      ];
      const log: PrayerLog = {
        ...makeLog('2026-03-12', false),
        prayers: { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false },
        isComplete: false,
        quranLogged: true,
      };
      const profile = makeProfile({
        prayerLogs: [log],
        worldState: {
          trees: [], flowers: [], buildings: [], animals: [], rivers: [],
          illustriousItems: [], dhikrFlowers: [],
          mushrooms, obstacles: [],
          mapSize: { width: GAME_CONFIG.map.initialGridSize, height: GAME_CONFIG.map.initialGridSize },
          gridSize: GAME_CONFIG.map.initialGridSize,
          lastUpdated: 0,
        },
      });
      const result = WorldLogic.processDay(profile, '2026-03-12');
      expect(result.mushroomsRemoved).toEqual(['m_1']);
    });

    it('does not clear mushrooms when Qur\'an is not logged', () => {
      const mushrooms = [
        { id: 'm_1', color: 'red' as const, stage: 1, position: { x: 1, y: 0 }, createdAt: 100 },
      ];
      const log: PrayerLog = {
        ...makeLog('2026-03-13', false),
        prayers: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true },
        isComplete: true,
        dhikrLogged: true,
      };
      const profile = makeProfile({
        prayerLogs: [log],
        worldState: {
          trees: [], flowers: [], buildings: [], animals: [], rivers: [],
          illustriousItems: [], dhikrFlowers: [],
          mushrooms, obstacles: [],
          mapSize: { width: GAME_CONFIG.map.initialGridSize, height: GAME_CONFIG.map.initialGridSize },
          gridSize: GAME_CONFIG.map.initialGridSize,
          lastUpdated: 0,
        },
      });
      const result = WorldLogic.processDay(profile, '2026-03-13');
      expect(result.mushroomsRemoved).toHaveLength(0);
    });

    it('spawns a permanent barakah flower when Qur\'an or dhikr is logged', () => {
      const realRandom = Math.random;
      Math.random = () => 0; // force the 2% roll to succeed
      try {
        const log: PrayerLog = {
          ...makeLog('2026-03-12', false),
          prayers: { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false },
          isComplete: false,
          quranLogged: true,
          dhikrLogged: false,
        };
        const profile = makeProfile({ prayerLogs: [log] });
        const result = WorldLogic.processDay(profile, '2026-03-12');
        expect(result.dhikrFlowersAdded).toHaveLength(1);
        // Permanent — nothing is ever expired/removed
        expect(result.dhikrFlowersRemoved).toHaveLength(0);
      } finally {
        Math.random = realRandom;
      }
    });

    it('does not spawn a barakah flower when neither Qur\'an nor dhikr is logged', () => {
      const realRandom = Math.random;
      Math.random = () => 0; // even with a guaranteed roll
      try {
        const profile = makeProfile({ prayerLogs: [makeLog('2026-03-13', true)] });
        const result = WorldLogic.processDay(profile, '2026-03-13');
        expect(result.dhikrFlowersAdded).toHaveLength(0);
      } finally {
        Math.random = realRandom;
      }
    });

    it('never spawns an obstacle on a complete day', () => {
      const completeProfile = makeProfile({
        prayerLogs: [makeLog('2026-03-20', true)],
      });
      const completeResult = WorldLogic.processDay(completeProfile, '2026-03-20');
      expect(completeResult.obstaclesAdded).toHaveLength(0);
    });

    it('does not spawn an obstacle on the first missed day (grace period)', () => {
      // A complete day followed by a single missed day must not return an
      // obstacle — one lapsed day is forgiven.
      const profile = makeProfile({
        prayerLogs: [makeLog('2026-03-20', true), makeLog('2026-03-21', false)],
      });
      const result = WorldLogic.processDay(profile, '2026-03-21');
      expect(result.obstaclesAdded).toHaveLength(0);
    });

    it('spawns an obstacle once prayers are missed for two consecutive days', () => {
      // Complete, then two consecutive missed days → the second missed day
      // returns one obstacle.
      const profile = makeProfile({
        prayerLogs: [
          makeLog('2026-03-20', true),
          makeLog('2026-03-21', false),
          makeLog('2026-03-22', false),
        ],
      });
      const firstMissed = WorldLogic.processDay(profile, '2026-03-21');
      expect(firstMissed.obstaclesAdded).toHaveLength(0);

      const secondMissed = WorldLogic.processDay(profile, '2026-03-22');
      expect(secondMissed.obstaclesAdded).toHaveLength(1);
    });
  });

  describe('no asset overlaps', () => {
    function allPositionKeys(ws: UserProfile['worldState']): string[] {
      return [
        ...ws.trees.map((t) => `${t.position.x},${t.position.y}`),
        ...ws.flowers.map((f) => `${f.position.x},${f.position.y}`),
        ...(ws.dhikrFlowers ?? []).map((f) => `${f.position.x},${f.position.y}`),
        ...(ws.obstacles ?? []).map((o) => `${o.position.x},${o.position.y}`),
        ...ws.buildings.map((b) => `${b.position.x},${b.position.y}`),
        ...ws.animals.map((a) => `${a.position.x},${a.position.y}`),
        ...ws.rivers.flatMap((r) => r.tiles.map((t) => `${t.x},${t.y}`)),
        ...ws.illustriousItems.map((i) => `${i.position.x},${i.position.y}`),
      ];
    }

    it('never spawns an illustrious item on top of an existing stump', () => {
      // Stumps sit on the exact ring the fountain prefers for this cluster.
      const trees = [
        { id: 't1', stage: 'mature' as const, position: { x: 0, y: 0 }, createdAt: 0, lastUpdated: 0 },
        { id: 't2', stage: 'mature' as const, position: { x: 1, y: 0 }, createdAt: 0, lastUpdated: 0 },
        { id: 't3', stage: 'mature' as const, position: { x: 0, y: 1 }, createdAt: 0, lastUpdated: 0 },
      ];
      const obstacles = [
        { id: 'o1', type: 'stump' as const, variant: 1, position: { x: 3, y: 0 }, createdAt: 0 },
        { id: 'o2', type: 'stump' as const, variant: 1, position: { x: -3, y: 0 }, createdAt: 0 },
        { id: 'o3', type: 'stump' as const, variant: 1, position: { x: 0, y: 3 }, createdAt: 0 },
        { id: 'o4', type: 'stump' as const, variant: 1, position: { x: 0, y: -3 }, createdAt: 0 },
      ];
      const profile = makeProfile({
        worldState: { ...makeProfile().worldState, trees, obstacles },
        prayerLogs: consecutiveLogs('2026-03-20', 35),
      });

      const result = WorldLogic.processDay(profile, '2026-03-20');
      const updated = WorldLogic.applyProcessingResult(profile, result);

      const obstacleKeys = new Set(
        (updated.worldState.obstacles ?? []).map((o) => `${o.position.x},${o.position.y}`)
      );
      for (const item of updated.worldState.illustriousItems) {
        expect(obstacleKeys.has(`${item.position.x},${item.position.y}`)).toBe(false);
      }
    });

    it('keeps every placed asset on a distinct tile after a processed day', () => {
      const trees = Array.from({ length: 4 }, (_, i) => ({
        id: `t${i}`,
        stage: 'mature' as const,
        position: { x: i - 1, y: 0 },
        createdAt: 0,
        lastUpdated: 0,
      }));
      const obstacles = [
        { id: 'o1', type: 'stump' as const, variant: 1, position: { x: 3, y: 0 }, createdAt: 0 },
        { id: 'o2', type: 'rock' as const, variant: 1, position: { x: -3, y: 0 }, createdAt: 0 },
      ];
      const log = {
        ...makeLog('2026-03-21', true),
        quranLogged: true,
        dhikrLogged: true,
      };
      const profile = makeProfile({
        worldState: { ...makeProfile().worldState, trees, obstacles },
        prayerLogs: [...consecutiveLogs('2026-03-20', 34), log],
      });

      const result = WorldLogic.processDay(profile, '2026-03-21');
      const updated = WorldLogic.applyProcessingResult(profile, result);
      const keys = allPositionKeys(updated.worldState);
      expect(new Set(keys).size).toBe(keys.length);
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
      dhikrFlowers: [],
          mushrooms: [],
      obstacles: [],
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
        flowersUpgraded: [],
        dhikrFlowersAdded: [],
        dhikrFlowersRemoved: [],
        obstaclesAdded: [],
        obstaclesRemoved: [],
        mushroomsRemoved: [],
        buildingsAdded: [],
        buildingsDecayed: [],
        buildingsRemoved: [],
        animalsAdded: [],
        animalsRemoved: [],
        riversAdded: [],
        riversRemoved: [],
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
          dhikrFlowers: [],
          mushrooms: [],
          obstacles: [],
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
        flowersUpgraded: [],
        dhikrFlowersAdded: [],
        dhikrFlowersRemoved: [],
        obstaclesAdded: [],
        obstaclesRemoved: [],
        mushroomsRemoved: [],
        buildingsAdded: [],
        buildingsDecayed: [],
        buildingsRemoved: ['home_1'],
        animalsAdded: [],
        animalsRemoved: [],
        riversAdded: [],
        riversRemoved: [],
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
          dhikrFlowers: [],
          mushrooms: [],
          obstacles: [],
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
        flowersUpgraded: [],
        dhikrFlowersAdded: [],
        dhikrFlowersRemoved: [],
        obstaclesAdded: [],
        obstaclesRemoved: [],
        mushroomsRemoved: [],
        buildingsAdded: [],
        buildingsDecayed: [],
        buildingsRemoved: [],
        animalsAdded: [],
        animalsRemoved: ['bird_1'],
        riversAdded: [],
        riversRemoved: [],
        illustriousItemsAdded: [],
        illustriousItemsRemoved: [],
      };
      const updated = WorldLogic.applyProcessingResult(profile, result);
      expect(updated.worldState.animals).toHaveLength(0);
    });
  });

  describe('black cat (temporary gift)', () => {
    const realRandom = Math.random;
    afterEach(() => {
      Math.random = realRandom;
    });

    it('spawns a cat without inflating the lifetime animals-appeared stat', () => {
      Math.random = () => 0; // force the spawn roll to succeed
      const profile = makeProfile();
      const updated = WorldLogic.trySpawnBlackCat(profile);

      expect(updated.worldState.animals).toHaveLength(1);
      expect(updated.worldState.animals[0].type).toBe('black_cat');
      // Temporary barakah — must NOT count toward permanent "animals appeared".
      expect(updated.statistics.totalAnimalsAppeared).toBe(0);
    });

    it('flags an expired black cat for removal even on a complete day', () => {
      const cat = {
        id: 'animal_black_cat_1740787200000', // 2025-03-01
        type: 'black_cat' as const,
        position: { x: 2, y: 2 },
        createdAt: Date.parse('2025-03-01T00:00:00Z'),
      };
      const profile = makeProfile({
        worldState: {
          trees: [],
          flowers: [],
          buildings: [],
          animals: [cat],
          rivers: [],
          illustriousItems: [],
          dhikrFlowers: [],
          mushrooms: [],
          obstacles: [],
          mapSize: { width: GAME_CONFIG.map.initialGridSize, height: GAME_CONFIG.map.initialGridSize },
          gridSize: GAME_CONFIG.map.initialGridSize,
          lastUpdated: 0,
        },
        prayerLogs: [makeLog('2025-03-05', true)],
      });

      const result = WorldLogic.processDay(profile, '2025-03-05');
      // Older than durationDays (2) → expiry, regardless of day completion.
      expect(result.animalsRemoved).toContain(cat.id);
    });

    it('removing a black cat does not count as an animal returned', () => {
      const cat = {
        id: 'animal_black_cat_1',
        type: 'black_cat' as const,
        position: { x: 2, y: 2 },
        createdAt: 1000,
      };
      const profile = makeProfile({
        worldState: {
          trees: [],
          flowers: [],
          buildings: [],
          animals: [cat],
          rivers: [],
          illustriousItems: [],
          dhikrFlowers: [],
          mushrooms: [],
          obstacles: [],
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
        flowersUpgraded: [],
        dhikrFlowersAdded: [],
        dhikrFlowersRemoved: [],
        obstaclesAdded: [],
        obstaclesRemoved: [],
        mushroomsRemoved: [],
        buildingsAdded: [],
        buildingsDecayed: [],
        buildingsRemoved: [],
        animalsAdded: [],
        animalsRemoved: ['animal_black_cat_1'],
        riversAdded: [],
        riversRemoved: [],
        illustriousItemsAdded: [],
        illustriousItemsRemoved: [],
      };
      const updated = WorldLogic.applyProcessingResult(profile, result);
      expect(updated.worldState.animals).toHaveLength(0);
      expect(updated.statistics.totalAnimalsReturned).toBe(0);
    });
  });
});
