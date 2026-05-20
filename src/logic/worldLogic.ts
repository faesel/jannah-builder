/**
 * World Logic
 * Processes daily game state updates based on prayer logs.
 *
 * This is the central orchestrator that calls into
 * IllustriousItemLogic, WorldElementLogic, and TreeLogic to
 * produce a single DayProcessingResult for each elapsed day.
 */

import { UserProfile, DayProcessingResult } from '../types/models';
import { GAME_CONFIG } from '../config/game.config';
import { PrayerLogic } from './prayerLogic';
import { TreeLogic } from './treeLogic';
import { IllustriousItemLogic } from './illustriousItemLogic';
import { WorldElementLogic } from './worldElementLogic';

export class WorldLogic {
  /**
   * Process a single date and return what changed.
   * The date parameter allows replaying missed days in order.
   */
  static processDay(
    profile: UserProfile,
    date: string
  ): DayProcessingResult {
    const result: DayProcessingResult = {
      treesAdded: [],
      treesDecayed: [],
      treesRemoved: [],
      buildingsAdded: [],
      buildingsDecayed: [],
      buildingsRemoved: [],
      animalsAdded: [],
      animalsRemoved: [],
      riversAdded: [],
      illustriousItemsAdded: [],
      illustriousItemsRemoved: [],
    };

    const dayLog = profile.prayerLogs.find((log) => log.date === date);
    const dayComplete = dayLog?.isComplete ?? false;

    // --- Trees: generation or decay ---
    if (dayComplete) {
      const consecutiveDays = PrayerLogic.countConsecutiveDaysFrom(
        profile.prayerLogs,
        date
      );
      const treesToGenerate = TreeLogic.shouldGenerateTrees(consecutiveDays);
      const currentTreeCount = profile.worldState.trees.length;
      const treesNeeded = treesToGenerate - currentTreeCount;

      if (treesNeeded > 0) {
        result.treesAdded = TreeLogic.generateTrees(
          treesNeeded,
          profile.worldState.trees
        );
      }

      // First-day seedling incentive: plant one sapling on the user's very first complete day
      if (
        GAME_CONFIG.trees.firstDaySeedling &&
        profile.worldState.trees.length === 0 &&
        result.treesAdded.length === 0
      ) {
        const completeLogs = profile.prayerLogs.filter((l) => l.isComplete);
        const isFirstCompleteDay =
          completeLogs.length === 1 && completeLogs[0].date === date;
        if (isFirstCompleteDay) {
          result.treesAdded = TreeLogic.generateTrees(1, profile.worldState.trees);
        }
      }
    } else {
      const decayResult = TreeLogic.applyDecay(profile.worldState.trees);
      result.treesDecayed = decayResult.degradedTrees;
      result.treesRemoved = decayResult.removedTreeIds;
    }

    // Project what the tree list will look like after this day
    const projectedTrees = this.projectTrees(profile, result);
    const projectedTreeCount = projectedTrees.length;

    // --- Building & animal decay (when trees drop below thresholds) ---
    if (!dayComplete) {
      const buildingDecayResult = WorldElementLogic.decayBuildings(
        projectedTreeCount,
        profile.worldState.buildings
      );
      result.buildingsDecayed = buildingDecayResult.degraded;
      result.buildingsRemoved = buildingDecayResult.removed;
      result.animalsRemoved = WorldElementLogic.decayAnimals(
        projectedTreeCount,
        profile.worldState.animals
      );
    }

    // --- Buildings & animals ---
    result.buildingsAdded = WorldElementLogic.evaluateBuildings(
      projectedTreeCount,
      profile.worldState.buildings,
      projectedTrees
    );
    result.animalsAdded = WorldElementLogic.evaluateAnimals(
      projectedTreeCount,
      profile.worldState.animals,
      projectedTrees
    );

    // --- Rivers ---
    result.riversAdded = WorldElementLogic.evaluateRivers(
      projectedTreeCount,
      profile.worldState.rivers,
      projectedTrees,
      [...profile.worldState.buildings, ...result.buildingsAdded]
    );

    // --- Illustrious items ---
    const streak = PrayerLogic.countConsecutiveDaysFrom(
      profile.prayerLogs,
      date
    );
    const illustriousResult = IllustriousItemLogic.evaluate(
      streak,
      profile.worldState.illustriousItems,
      projectedTrees
    );
    result.illustriousItemsAdded = illustriousResult.itemsToAdd;
    result.illustriousItemsRemoved = illustriousResult.itemIdsToRemove;

    // --- Black cat expiry (temporary animals with duration) ---
    const blackCatConfig = GAME_CONFIG.world.animals.black_cat;
    const expiredBlackCats = profile.worldState.animals
      .filter((a) => a.type === 'black_cat')
      .filter((a) => {
        const createdDate = new Date(a.createdAt).toISOString().split('T')[0];
        const daysDiff = this.daysBetween(createdDate, date);
        return daysDiff >= blackCatConfig.durationDays;
      })
      .map((a) => a.id);

    if (expiredBlackCats.length > 0) {
      result.animalsRemoved = Array.from(new Set([
        ...result.animalsRemoved,
        ...expiredBlackCats,
      ]));
    }

    return result;
  }

  /**
   * Legacy entry point — processes today.
   */
  static processDayEnd(profile: UserProfile): DayProcessingResult {
    return this.processDay(profile, PrayerLogic.getTodayDate());
  }

  /**
   * Apply processing result to profile, returning the updated profile.
   */
  static applyProcessingResult(
    profile: UserProfile,
    result: DayProcessingResult
  ): UserProfile {
    const updatedTrees = [...profile.worldState.trees];

    // Add new trees
    updatedTrees.push(...result.treesAdded);

    // Update degraded trees
    for (const degradedTree of result.treesDecayed) {
      const index = updatedTrees.findIndex((t) => t.id === degradedTree.id);
      if (index !== -1) {
        updatedTrees[index] = degradedTree;
      }
    }

    // Remove trees
    const filteredTrees = updatedTrees.filter(
      (tree) => !result.treesRemoved.includes(tree.id)
    );

    // Update degraded buildings (good → dilapidated)
    const updatedBuildings = [...profile.worldState.buildings, ...result.buildingsAdded];
    for (const degraded of result.buildingsDecayed) {
      const idx = updatedBuildings.findIndex((b) => b.id === degraded.id);
      if (idx !== -1) {
        updatedBuildings[idx] = degraded;
      }
    }
    const filteredBuildings = updatedBuildings.filter(
      (b) => !result.buildingsRemoved.includes(b.id)
    );

    // Map expansion
    const newMapSize =
      WorldElementLogic.evaluateMapExpansion(
        filteredTrees.length,
        profile.worldState.mapSize
      ) ?? profile.worldState.mapSize;

    // Statistics
    const mapAge = Math.max(
      0,
      Math.floor((Date.now() - profile.createdAt) / (1000 * 60 * 60 * 24))
    );
    const statistics = {
      ...profile.statistics,
      mapAge,
      totalTreesGrown:
        profile.statistics.totalTreesGrown + result.treesAdded.length,
      totalTreesDecayed:
        profile.statistics.totalTreesDecayed +
        result.treesDecayed.length +
        result.treesRemoved.length,
      totalBuildingsCreated:
        profile.statistics.totalBuildingsCreated + result.buildingsAdded.length,
      totalBuildingsReturned:
        profile.statistics.totalBuildingsReturned + result.buildingsRemoved.length,
      totalAnimalsAppeared:
        profile.statistics.totalAnimalsAppeared + result.animalsAdded.length,
      totalAnimalsReturned:
        profile.statistics.totalAnimalsReturned + result.animalsRemoved.length,
    };

    return {
      ...profile,
      worldState: {
        ...profile.worldState,
        trees: filteredTrees,
        flowers: profile.worldState.flowers,
        buildings: filteredBuildings,
        animals: [
          ...profile.worldState.animals,
          ...result.animalsAdded,
        ].filter((a) => !result.animalsRemoved.includes(a.id)),
        rivers: [...profile.worldState.rivers, ...result.riversAdded],
        illustriousItems: profile.worldState.illustriousItems
          .filter((item) => !result.illustriousItemsRemoved.includes(item.id))
          .concat(result.illustriousItemsAdded),
        mapSize: newMapSize,
        gridSize: Math.max(newMapSize.width, newMapSize.height),
        lastUpdated: Date.now(),
      },
      statistics,
    };
  }

  /**
   * Update statistics after logging a prayer.
   */
  static updateStatisticsForPrayer(profile: UserProfile): UserProfile {
    const totalPrayers = profile.prayerLogs.reduce((sum, log) => {
      return sum + Object.values(log.prayers).filter(Boolean).length;
    }, 0);

    const completeDays = profile.prayerLogs.filter(
      (log) => log.isComplete
    ).length;

    const consecutiveDays = PrayerLogic.countConsecutiveDays(
      profile.prayerLogs
    );

    return {
      ...profile,
      statistics: {
        ...profile.statistics,
        totalPrayersLogged: totalPrayers,
        totalDaysComplete: completeDays,
        currentStreak: consecutiveDays,
        longestStreak: Math.max(
          profile.statistics.longestStreak,
          consecutiveDays
        ),
      },
      streaks: {
        ...profile.streaks,
        current: consecutiveDays,
        longest: Math.max(profile.streaks.longest, consecutiveDays),
        lastPrayerDate: PrayerLogic.getTodayDate(),
        consecutiveFullDays: consecutiveDays,
      },
    };
  }

  /**
   * Reconcile trees: ensures the world state has the expected number of trees
   * based on the current consecutive-day streak. This guards against race
   * conditions or missed processDay calls that could leave the world under-populated.
   * Returns an updated profile only if trees were added.
   */
  static reconcileTrees(profile: UserProfile): UserProfile {
    const today = PrayerLogic.getTodayDate();
    const consecutiveDays = PrayerLogic.countConsecutiveDaysFrom(
      profile.prayerLogs,
      today
    );
    const expectedTrees = TreeLogic.shouldGenerateTrees(consecutiveDays);
    const currentTrees = profile.worldState.trees.length;

    if (expectedTrees > currentTrees) {
      const treesNeeded = expectedTrees - currentTrees;
      const newTrees = TreeLogic.generateTrees(
        treesNeeded,
        profile.worldState.trees
      );

      return {
        ...profile,
        worldState: {
          ...profile.worldState,
          trees: [...profile.worldState.trees, ...newTrees],
          lastUpdated: Date.now(),
        },
        statistics: {
          ...profile.statistics,
          totalTreesGrown: profile.statistics.totalTreesGrown + newTrees.length,
        },
      };
    }

    return profile;
  }

  // --- Internal helpers ---

  /**
   * Project the tree list after applying a day result (without mutating profile).
   */
  private static projectTrees(
    profile: UserProfile,
    result: DayProcessingResult
  ): typeof profile.worldState.trees {
    const trees = [...profile.worldState.trees, ...result.treesAdded];

    for (const degraded of result.treesDecayed) {
      const idx = trees.findIndex((t) => t.id === degraded.id);
      if (idx !== -1) trees[idx] = degraded;
    }

    return trees.filter((t) => !result.treesRemoved.includes(t.id));
  }

  /**
   * Calculate the number of days between two ISO date strings.
   */
  private static daysBetween(dateA: string, dateB: string): number {
    const a = new Date(dateA + 'T00:00:00Z').getTime();
    const b = new Date(dateB + 'T00:00:00Z').getTime();
    return Math.floor(Math.abs(b - a) / (1000 * 60 * 60 * 24));
  }

  /**
   * Attempt to spawn a black cat (8% chance per prayer logged).
   * Returns the updated profile with the cat added if the roll succeeds.
   */
  static trySpawnBlackCat(profile: UserProfile): UserProfile {
    const config = GAME_CONFIG.world.animals.black_cat;
    if (Math.random() >= config.spawnChance) return profile;

    // Only allow one active black cat at a time
    const existingCat = profile.worldState.animals.find((a) => a.type === 'black_cat');
    if (existingCat) return profile;

    const now = Date.now();
    const position = WorldElementLogic.findPositionForAnimal(
      profile.worldState.trees,
      profile.worldState.animals
    );

    const cat = {
      id: `animal_black_cat_${now}`,
      type: 'black_cat' as const,
      position,
      createdAt: now,
    };

    return {
      ...profile,
      worldState: {
        ...profile.worldState,
        animals: [...profile.worldState.animals, cat],
      },
      statistics: {
        ...profile.statistics,
        totalAnimalsAppeared: profile.statistics.totalAnimalsAppeared + 1,
      },
    };
  }
}
