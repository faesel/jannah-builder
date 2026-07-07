/**
 * Integration test: full game flow
 *
 * Tests the end-to-end journey from fresh profile through prayer logging,
 * world processing, tree generation, decay, and statistics.
 */

import { WorldLogic } from '../logic/worldLogic';
import { GAME_CONFIG } from '../config/game.config';
import { UserProfile, WorldState, PrayerLog } from '../types/models';

function createFreshProfile(): UserProfile {
  const now = Date.now();
  const worldState: WorldState = {
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
    lastUpdated: now,
  };

  return {
    id: 'test-profile',
    name: 'Test',
    createdAt: now,
    lastActive: now,
    worldState,
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
  };
}

function makeCompleteLog(date: string): PrayerLog {
  return {
    id: `prayer_${date}`,
    date,
    prayers: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true },
    isComplete: true,
    quranLogged: false,
    dhikrLogged: false,
    timestamp: Date.now(),
  };
}

function makeIncompleteLog(date: string): PrayerLog {
  return {
    id: `prayer_${date}`,
    date,
    prayers: { Fajr: true, Dhuhr: false, Asr: false, Maghrib: false, Isha: false },
    isComplete: false,
    quranLogged: false,
    dhikrLogged: false,
    timestamp: Date.now(),
  };
}

/** Produce a YYYY-MM-DD string offset from a base date */
function dateOffset(base: string, days: number): string {
  const d = new Date(base + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

describe('Integration: full game flow', () => {
  const daysPerTree = GAME_CONFIG.trees.daysForNewTree;
  const baseDate = '2026-01-01';

  it('generates a tree after consecutive complete days', () => {
    let profile = createFreshProfile();

    // Log complete prayers for the required number of consecutive days
    for (let i = 0; i < daysPerTree; i++) {
      const date = dateOffset(baseDate, i);
      profile.prayerLogs.push(makeCompleteLog(date));
    }

    // Process the last day — this should trigger tree generation
    const lastDate = dateOffset(baseDate, daysPerTree - 1);
    const result = WorldLogic.processDay(profile, lastDate);

    expect(result.treesAdded.length).toBeGreaterThan(0);
    expect(result.treesAdded[0].stage).toBe('sapling');
  });

  it('does not generate trees before the threshold is met', () => {
    let profile = createFreshProfile();

    for (let i = 0; i < daysPerTree - 1; i++) {
      const date = dateOffset(baseDate, i);
      profile.prayerLogs.push(makeCompleteLog(date));
    }

    const lastDate = dateOffset(baseDate, daysPerTree - 2);
    const result = WorldLogic.processDay(profile, lastDate);

    expect(result.treesAdded).toHaveLength(0);
  });

  it('applies decay when a day is missed', () => {
    let profile = createFreshProfile();

    // Build up a tree first
    for (let i = 0; i < daysPerTree; i++) {
      const date = dateOffset(baseDate, i);
      profile.prayerLogs.push(makeCompleteLog(date));
    }

    const genDate = dateOffset(baseDate, daysPerTree - 1);
    const genResult = WorldLogic.processDay(profile, genDate);
    profile = WorldLogic.applyProcessingResult(profile, genResult);
    expect(profile.worldState.trees).toHaveLength(1);
    expect(profile.worldState.trees[0].stage).toBe('sapling');

    // Now process a missed day (no log for this date)
    const missedDate = dateOffset(baseDate, daysPerTree);
    const decayResult = WorldLogic.processDay(profile, missedDate);

    // Sapling should be removed (decayed past sapling → gone)
    expect(decayResult.treesRemoved.length + decayResult.treesDecayed.length).toBeGreaterThan(0);
  });

  it('tracks statistics across multiple days', () => {
    let profile = createFreshProfile();

    // Log 6 complete days (should produce 2 trees with daysPerTree=3)
    for (let i = 0; i < daysPerTree * 2; i++) {
      const date = dateOffset(baseDate, i);
      profile.prayerLogs.push(makeCompleteLog(date));

      const result = WorldLogic.processDay(profile, date);
      profile = WorldLogic.applyProcessingResult(profile, result);
    }

    profile = WorldLogic.updateStatisticsForPrayer(profile);

    expect(profile.statistics.totalPrayersLogged).toBe(daysPerTree * 2 * 5);
    expect(profile.statistics.totalDaysComplete).toBe(daysPerTree * 2);
    expect(profile.worldState.trees.length).toBeGreaterThanOrEqual(1);
    expect(profile.statistics.totalTreesGrown).toBeGreaterThanOrEqual(1);
  });

  it('full journey: grow, miss, decay, return, grow again', () => {
    let profile = createFreshProfile();
    let dayIndex = 0;

    // Phase 1: Log consecutive days to earn a tree
    for (let i = 0; i < daysPerTree; i++) {
      const date = dateOffset(baseDate, dayIndex++);
      profile.prayerLogs.push(makeCompleteLog(date));
      const result = WorldLogic.processDay(profile, date);
      profile = WorldLogic.applyProcessingResult(profile, result);
    }
    const treesAfterGrowth = profile.worldState.trees.length;
    expect(treesAfterGrowth).toBeGreaterThan(0);

    // Phase 2: Miss a day — no prayer log for this date. Decay is gentle: the
    // tree steps down one stage (young → sapling) rather than necessarily being
    // removed, so assert that a decay occurred rather than a strict count drop.
    const missedDate = dateOffset(baseDate, dayIndex++);
    const decayResult = WorldLogic.processDay(profile, missedDate);
    profile = WorldLogic.applyProcessingResult(profile, decayResult);
    expect(decayResult.treesDecayed.length + decayResult.treesRemoved.length).toBeGreaterThan(0);

    // Phase 3: Return with incomplete day (no further decay on incomplete vs no log)
    const incompleteDate = dateOffset(baseDate, dayIndex++);
    profile.prayerLogs.push(makeIncompleteLog(incompleteDate));
    const incompleteResult = WorldLogic.processDay(profile, incompleteDate);
    profile = WorldLogic.applyProcessingResult(profile, incompleteResult);

    // Phase 4: Log enough consecutive complete days to earn another tree
    for (let i = 0; i < daysPerTree; i++) {
      const date = dateOffset(baseDate, dayIndex++);
      profile.prayerLogs.push(makeCompleteLog(date));
      const result = WorldLogic.processDay(profile, date);
      profile = WorldLogic.applyProcessingResult(profile, result);
    }

    profile = WorldLogic.updateStatisticsForPrayer(profile);

    // Verify the world has grown back
    expect(profile.worldState.trees.length).toBeGreaterThanOrEqual(1);
    expect(profile.statistics.totalTreesGrown).toBeGreaterThanOrEqual(2);
    expect(profile.statistics.totalTreesDecayed).toBeGreaterThanOrEqual(1);
  });
});
